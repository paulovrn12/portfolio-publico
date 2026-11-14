import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, symlink, rm } from 'node:fs/promises';
import { join, dirname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { buildSite, resourceTarget, validateSite } from './build.mjs';
import { assertPublishContext, assertManagedMarker, publishSite, DEPLOY_REF } from './publish.mjs';

async function temporary(t) {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-test-'));
  t.after(async () => {
    assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep));
    await rm(directory, { recursive: true, force: true });
  });
  return directory;
}
async function put(root, path, content = '') {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), content);
}
async function fixture(t) {
  const root = await temporary(t);
  await put(root, 'index.html', '<a href="/bio/">Bio</a><script type="module" src="site.js"></script>');
  await put(root, 'bio/index.html', '<a href="../">Início</a>');
  await put(root, 'site.js', "import './site-data.js';");
  await put(root, 'site-data.js', "export const siteData = { github: 'https://github.com/example', demoPreviewPath: '/bio/' };");
  return root;
}
function git(root, ...args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  assert.equal(result.status, 0, `Git ${args[0]}: ${result.stderr}`);
  return result.stdout.trim();
}
const actionContext = commit => ({ GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/heads/main', GITHUB_SHA: commit });

test('build publica somente recursos estáticos e preserva as fontes', async t => {
  const root = await fixture(t);
  await put(root, 'README.md', 'Documentação de desenvolvimento');
  await put(root, 'docs/NOTES.md', 'Instruções sem publicação');
  await put(root, 'scripts/example.js', 'Código de ferramentas, fora do site');
  const result = await buildSite(root);
  assert.deepEqual(result.files, ['bio/index.html', 'index.html', 'site-data.js', 'site.js']);
  assert.deepEqual((await readdir(result.output)).sort(), ['bio', 'index.html', 'site-data.js', 'site.js']);
  assert.equal(await readFile(join(root, 'README.md'), 'utf8'), 'Documentação de desenvolvimento');
});

test('privados, banco de dados e diretórios desconhecidos interrompem a geração', async t => {
  const root = await fixture(t);
  for (const file of ['.env', 'assets/export.sql', 'assets/clientes.db']) {
    await put(root, file, 'fixture sem dados reais');
    await assert.rejects(buildSite(root), /Arquivo privado/);
    await rm(join(root, file));
  }
  await put(root, 'crm/contacts.js', 'export default [];');
  await assert.rejects(buildSite(root), /Diretório de raiz não publicável/);
});

test('links locais devem existir; JavaScript e destinos de cartões devem ser válidos', async t => {
  const root = await fixture(t);
  await put(root, 'index.html', '<img src="missing.svg">');
  await assert.rejects(validateSite(root), /Referência local ausente/);
  await put(root, 'index.html', '<a href="/bio/">Bio</a>');
  await put(root, 'site.js', 'const = invalid');
  await assert.rejects(validateSite(root), /Sintaxe JavaScript inválida/);
  await put(root, 'site.js', "import './site-data.js';");
  await put(root, 'site-data.js', "export const siteData = { link: 'javascript:alert(1)' };");
  await assert.rejects(validateSite(root), /Protocolo de URL não permitido/);
  await put(root, 'site-data.js', "export const siteData = { link: buildUrl() };");
  await assert.rejects(validateSite(root), /Destino dinâmico/);
  await put(root, 'site-data.js', "export const siteData = { secondaryLink: 'https://user:secret@example.invalid/' };");
  await assert.rejects(validateSite(root), /credenciais/);
  await put(root, 'site-data.js', "export const siteData = { secondaryLink: 'javascript:alert(1)' };");
  await assert.rejects(validateSite(root), /Protocolo de URL não permitido/);
});

test('URLs impedem saída da raiz, credenciais, esquemas ativos e recursos remotos', () => {
  const root = resolve(tmpdir(), 'portfolio-url-fixture');
  for (const value of ['../outside.html', '%2e%2e/outside.html', 'folder%2fsecret', '//user:password@example.com', 'javascript:alert(1)', 'data:text/html,test']) {
    assert.throws(() => resourceTarget(root, 'index.html', value, true));
  }
  assert.throws(() => resourceTarget(root, 'index.html', 'https://example.com/remote.js'));
  assert.equal(resourceTarget(root, 'bio/index.html', '../index.html#sobre', true), 'index.html');
  assert.equal(resourceTarget(root, 'index.html', 'https://github.com/example', true), null);
});

test('links simbólicos e destinos build simbólicos nunca são seguidos', async t => {
  const root = await fixture(t);
  const outside = await temporary(t);
  try { await symlink(outside, join(root, 'assets'), process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) { if (['EPERM', 'EACCES', 'ENOSYS'].includes(error.code)) return t.skip('Ambiente não permite criar symlinks.'); throw error; }
  await assert.rejects(buildSite(root), /Link simbólico/);
  await rm(join(root, 'assets'));
  await symlink(outside, join(root, 'build'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(buildSite(root), /build não pode ser/);
  assert.deepEqual(await readdir(outside), []);
});

test('publicação exige evento main e marcador de branch gerada', () => {
  const valid = actionContext('a'.repeat(40));
  assert.doesNotThrow(() => assertPublishContext(valid));
  for (const change of [{ GITHUB_REF: 'refs/heads/feature' }, { GITHUB_ACTIONS: 'false' }, { GITHUB_EVENT_NAME: 'pull_request' }]) assert.throws(() => assertPublishContext({ ...valid, ...change }));
  assert.throws(() => assertManagedMarker({ sourceCommit: 'a'.repeat(40) }));
});

test('publicação local isolada gera somente static, mantém main e recusa branch alheia', async t => {
  const root = await fixture(t), remote = await temporary(t);
  git(root, 'init', '-b', 'main');
  git(remote, 'init', '--bare');
  git(root, 'config', 'user.name', 'Portfolio test');
  git(root, 'config', 'user.email', 'test@example.invalid');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'Static fixture');
  git(root, 'remote', 'add', 'origin', remote);
  git(root, 'push', 'origin', 'main');
  const original = git(root, 'rev-parse', 'HEAD');
  const context = actionContext(original);
  await publishSite(root, context);
  assert.equal(git(root, 'rev-parse', 'main'), original);
  assert.deepEqual(git(remote, 'ls-tree', '-r', '--name-only', DEPLOY_REF).split('\n'), ['bio/index.html', 'deployment-info.json', 'index.html', 'site-data.js', 'site.js']);
  assert.equal((await publishSite(root, context)).changed, false);
  // A branch alheia é simulada somente num repositório bare temporário local.
  git(remote, 'update-ref', DEPLOY_REF, original);
  await assert.rejects(publishSite(root, context), /sem marcador válido/);
  assert.equal(git(remote, 'rev-parse', DEPLOY_REF), original);
});
