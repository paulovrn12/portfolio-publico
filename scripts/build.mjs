import { readdir, lstat, readFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { resolve, join, dirname, extname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const ignored = new Set(['.git', '.github', 'scripts', 'docs', 'build', 'node_modules']);
const publicRoots = new Set(['assets', 'images', 'fonts', 'bio', 'demos']);
const extensions = new Set(['.html', '.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.ico', '.woff', '.woff2']);
const privateFile = name => /^\.env(?:\.|$)/i.test(name) || /\.(?:sql|sqlite|sqlite3|db|pem|key|pfx|p12)$/i.test(name);
const posix = name => name.split(sep).join('/');
const inside = (root, target) => target === root || target.startsWith(root + sep);
export const DEFAULT_ROOT = fileURLToPath(new URL('../', import.meta.url));

export async function publicFiles(rawRoot = DEFAULT_ROOT) {
  const root = resolve(rawRoot), files = [];
  async function walk(folder, top = false) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      if (ignored.has(entry.name) && top) continue;
      const target = join(folder, entry.name), info = await lstat(target);
      if (info.isSymbolicLink()) throw new Error(`Link simbólico não publicável: ${posix(relative(root, target))}`);
      if (privateFile(entry.name)) throw new Error('Arquivo privado detectado na pasta pública. Remova-o antes de gerar a publicação.');
      if (entry.name.startsWith('.')) continue;
      if (info.isDirectory()) {
        if (top && !publicRoots.has(entry.name)) throw new Error(`Diretório de raiz não publicável: ${entry.name}`);
        await walk(target);
      } else if (info.isFile() && extensions.has(extname(entry.name).toLowerCase())) {
        const name = posix(relative(root, target));
        if (!/^[a-zA-Z0-9_./-]+$/.test(name)) throw new Error(`Nome de recurso inválido: ${name}`);
        if (info.size > 10 * 1024 * 1024) throw new Error(`Recurso excede 10 MB: ${name}`);
        files.push(name);
      }
    }
  }
  await walk(root, true);
  files.sort();
  for (const required of ['index.html', 'bio/index.html']) if (!files.includes(required)) throw new Error(`Página obrigatória ausente: ${required}`);
  return files;
}

function unescapeAttribute(value) { return value.replace(/&amp;/gi, '&').trim(); }
export function resourceTarget(root, source, raw, hyperlink = false) {
  const value = unescapeAttribute(raw);
  if (!value || value.startsWith('#')) return null;
  if (/^(?:https?:)?\/\//i.test(value)) {
    const url = new URL(value, 'https://paulovictorrn.tech');
    if (url.username || url.password) throw new Error(`URL com credenciais em ${source}`);
    if (!hyperlink) throw new Error(`Recurso externo não permitido em ${source}`);
    return null;
  }
  if (/^(?:mailto|tel):/i.test(value) && hyperlink && !/[\r\n]/.test(value)) return null;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) throw new Error(`Protocolo de URL não permitido em ${source}`);
  const path = value.split(/[?#]/, 1)[0];
  if (/\\|\0|%(?:2f|5c|00|25)/i.test(path)) throw new Error(`Caminho codificado ou inválido em ${source}`);
  let decoded;
  try { decoded = decodeURIComponent(path); } catch { throw new Error(`Caminho inválido em ${source}`); }
  const absolute = resolve(decoded.startsWith('/') ? root : dirname(join(root, source)), decoded.replace(/^\/+/, ''));
  if (!inside(root, absolute)) throw new Error(`Link sai da pasta pública em ${source}`);
  return posix(relative(root, absolute)) || 'index.html';
}

export async function validateSite(rawRoot = DEFAULT_ROOT) {
  const root = resolve(rawRoot), files = await publicFiles(root), known = new Set(files);
  function check(source, value, hyperlink = false) {
    const target = resourceTarget(root, source, value, hyperlink);
    if (target === null) return;
    if (!known.has(target) && !known.has(target.replace(/\/$/, '') + '/index.html')) throw new Error(`Referência local ausente em ${source}: ${value}`);
  }
  for (const name of files) {
    const extension = extname(name).toLowerCase();
    if (!['.html', '.css', '.js', '.svg'].includes(extension)) continue;
    const content = await readFile(join(root, name), 'utf8');
    if (extension === '.js') {
      const result = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: content, encoding: 'utf8' });
      if (result.status !== 0) throw new Error(`Sintaxe JavaScript inválida: ${name}`);
      for (const match of content.matchAll(/(?:\b(?:import|export)\s+(?:[^;\n]*?\s+from\s+)?|\bimport\s*\(\s*)['"]([^'"]+)['"]/g)) check(name, match[1]);
      if (name === 'site-data.js') {
        // Os destinos dos cartões devem ser literais revisáveis, sem execução do módulo durante o build.
        for (const field of content.matchAll(/\b(github|linkedin|whatsapp|instagram|website|demoUrl|demoPreviewPath|link|image|source)\s*:\s*/g)) {
          const literal = content.slice(field.index + field[0].length).match(/^(['"])([^'"\r\n]*)\1/);
          if (!literal || literal[2].includes('\\')) throw new Error(`Destino dinâmico ou escapado em site-data.js: ${field[1]}`);
          check(name, literal[2], field[1] !== 'image');
        }
      }
    }
    if (extension === '.html' || extension === '.svg') {
      for (const tag of content.matchAll(/<([a-zA-Z][\w:-]*)\b[^>]*>/g)) {
        const metadataLink = tag[1].toLowerCase() === 'link' && /\brel\s*=\s*(['"])canonical\1/i.test(tag[0]);
        for (const attribute of tag[0].matchAll(/\b(src|href|poster)\s*=\s*(["'])(.*?)\2/gi)) check(name, attribute[3], (tag[1].toLowerCase() === 'a' || metadataLink) && attribute[1].toLowerCase() === 'href');
      }
    }
    if (extension === '.css') for (const match of content.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)) check(name, match[1]);
  }
  return files;
}

export async function buildSite(rawRoot = DEFAULT_ROOT) {
  const root = resolve(rawRoot), output = resolve(root, 'build'), files = await validateSite(root);
  if (!inside(root, output) || output === root) throw new Error('Destino de geração inválido.');
  try { if ((await lstat(output)).isSymbolicLink()) throw new Error('A pasta build não pode ser um link simbólico.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  // Apenas o diretório gerado build, verificado acima, é substituído.
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const name of files) { const target = join(output, name); await mkdir(dirname(target), { recursive: true }); await copyFile(join(root, name), target); }
  return { root, output, files };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { const result = await buildSite(); console.log(`Publicação estática preparada: ${result.files.length} arquivos em build/. Nenhum envio foi feito.`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
