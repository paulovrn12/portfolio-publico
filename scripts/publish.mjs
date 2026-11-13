import { readFile, writeFile, lstat, rm, mkdtemp } from 'node:fs/promises';
import { resolve, join, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildSite, DEFAULT_ROOT } from './build.mjs';

export const DEPLOY_REF = 'refs/heads/hostinger-deploy';
export const SITE_ID = 'paulovictorrn-portfolio';
const MARKER = 'deployment-info.json';
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/i.test(value);
export function assertPublishContext(env) {
  if (env.GITHUB_ACTIONS !== 'true' || !['push', 'workflow_dispatch'].includes(env.GITHUB_EVENT_NAME) || env.GITHUB_REF !== 'refs/heads/main' || !sha(env.GITHUB_SHA)) throw new Error('Publicação permitida somente pelo workflow da branch main.');
}
export function assertManagedMarker(value) {
  if (!value || value.siteId !== SITE_ID || value.version !== 1 || value.managedBy !== 'github-actions-static-publisher' || !sha(value.sourceCommit)) throw new Error('A branch de destino não tem a identificação esperada. Nenhum push foi feito.');
}
function git(root, args, options = {}) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', ...options });
  if (result.status !== 0) throw new Error(`Falha no comando Git (${args[0]}). Confira permissões e estado remoto; detalhes sensíveis não são impressos.`);
  return result.stdout.trim();
}

export async function publishSite(root = DEFAULT_ROOT, env = process.env) {
  assertPublishContext(env);
  root = resolve(root);
  if (resolve(git(root, ['rev-parse', '--show-toplevel'])) !== root) throw new Error('Use um repositório isolado cuja raiz seja public-site; o Radar não pode ser publicado.');
  if (git(root, ['rev-parse', 'HEAD']) !== env.GITHUB_SHA) throw new Error('Checkout não corresponde ao commit autorizado.');
  const built = await buildSite(root);
  const lookup = spawnSync('git', ['-C', root, 'ls-remote', '--exit-code', '--heads', 'origin', DEPLOY_REF], { encoding: 'utf8' });
  if (![0, 2].includes(lookup.status)) throw new Error('Não foi possível consultar a branch de publicação.');
  let previous = '';
  if (lookup.status === 0) {
    previous = lookup.stdout.split(/\s+/)[0];
    if (!sha(previous)) throw new Error('Resposta Git inesperada.');
    git(root, ['fetch', '--no-tags', 'origin', `+${DEPLOY_REF}:refs/remotes/origin/hostinger-deploy`]);
    if (git(root, ['rev-parse', 'refs/remotes/origin/hostinger-deploy']) !== previous) throw new Error('A branch remota mudou durante a consulta. Execute novamente.');
    let marker;
    try { marker = JSON.parse(git(root, ['show', `${previous}:${MARKER}`])); }
    catch { throw new Error('Branch já existente sem marcador válido; publicação interrompida para preservar seu conteúdo.'); }
    assertManagedMarker(marker);
    git(root, ['merge-base', '--is-ancestor', marker.sourceCommit, env.GITHUB_SHA]);
  }
  const marker = { version: 1, siteId: SITE_ID, managedBy: 'github-actions-static-publisher', sourceCommit: env.GITHUB_SHA };
  await writeFile(join(built.output, MARKER), JSON.stringify(marker, null, 2) + '\n');
  const temporary = await mkdtemp(join(tmpdir(), 'portfolio-publish-'));
  const indexEnv = { ...process.env, GIT_INDEX_FILE: join(temporary, 'index'), GIT_AUTHOR_NAME: 'github-actions[bot]', GIT_COMMITTER_NAME: 'github-actions[bot]', GIT_AUTHOR_EMAIL: '41898282+github-actions[bot]@users.noreply.github.com', GIT_COMMITTER_EMAIL: '41898282+github-actions[bot]@users.noreply.github.com' };
  try {
    git(root, ['read-tree', '--empty'], { env: indexEnv });
    for (const name of [...built.files, MARKER].sort()) {
      const target = join(built.output, name);
      if (!(await lstat(target)).isFile()) throw new Error('Recurso de publicação inválido.');
      const blob = git(root, ['hash-object', '-w', '--stdin'], { input: await readFile(target), env: indexEnv });
      git(root, ['update-index', '--add', '--cacheinfo', `100644,${blob},${name}`], { env: indexEnv });
    }
    const tree = git(root, ['write-tree'], { env: indexEnv });
    const oldTree = previous ? git(root, ['rev-parse', `${previous}^{tree}`]) : '';
    if (tree === oldTree) { console.log('Arquivos já publicados nesta versão; nenhum novo push.'); return { changed: false }; }
    const commit = git(root, ['commit-tree', tree, ...(previous ? ['-p', previous] : [])], { env: indexEnv, input: `Publish validated static portfolio\n\nSource-Commit: ${env.GITHUB_SHA}\n` });
    // A lease protege apenas a branch gerada; main nunca é reescrita.
    git(root, ['push', 'origin', `--force-with-lease=${DEPLOY_REF}:${previous}`, `${commit}:${DEPLOY_REF}`]);
    console.log(`Branch hostinger-deploy atualizada com ${built.files.length} recursos públicos. A publicação Hostinger ainda deve ser verificada.`);
    return { changed: true, commit };
  } finally {
    if (!resolve(temporary).startsWith(resolve(tmpdir()) + sep) || !temporary.includes('portfolio-publish-')) throw new Error('Caminho temporário inesperado.');
    await rm(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { await publishSite(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
