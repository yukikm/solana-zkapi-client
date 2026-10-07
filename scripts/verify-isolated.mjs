/** Reproduce external consumption without the core checkout or workspace links. */
import {createHash} from 'node:crypto';
import {mkdtemp, readdir, readFile, writeFile, mkdir, copyFile, lstat, realpath, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npmCli = process.env.npm_execpath;
if (!npmCli) throw Error('Run npm run verify:isolated');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sdkTarball = 'vendor/zkapi-solana-sdk-0.2.0-devnet.1.tgz';
const provenanceFile = 'vendor/provenance-0.2.0-devnet.1.json';
const provenance = JSON.parse(await readFile(join(root, provenanceFile), 'utf8'));
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
if (packageJson.dependencies['@zkapi/solana-sdk'] !== 'file:' + sdkTarball
    || sha(await readFile(join(root, sdkTarball))) !== provenance.sha256) throw Error('Reviewed SDK dependency or digest mismatch');
const files = ['package.json', 'package-lock.json', 'tsconfig.json', 'LICENSE', sdkTarball, provenanceFile, 'scripts/verify-isolated.mjs'];
async function collect(dir) {
  for (const entry of await readdir(join(root, dir), {withFileTypes: true})) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (entry.isFile()) files.push(path);
    else throw Error('Source symlinks are not accepted');
  }
}
for (const dir of ['browser-chat', 'legacy-wallet', 'tests']) await collect(dir);
files.sort();
const before = Object.fromEntries(await Promise.all(files.map(async name => [name, sha(await readFile(join(root, name)))])));
const temp = await mkdtemp(join(tmpdir(), 'zkapi-client-independent-'));
const result = {schema: 1, scope: 'isolated browser application consumption of SDK tarball; synthetic UI/provider tests only',
  started_at: new Date().toISOString(), node: process.version, source_sha256: before,
  sdk_version: provenance.version, sdk_tarball_sha256: before[sdkTarball], stages: [], source_unchanged: false, success: false};
async function stage(name, args) {
  const started = performance.now(); let output = '';
  const child = spawn(process.execPath, [npmCli, ...args], {cwd: temp, env: {...process.env, NODE_PATH: '', npm_config_workspaces: 'false'}, stdio: ['ignore', 'pipe', 'pipe']});
  for (const stream of [child.stdout, child.stderr]) stream.on('data', bytes => { output = (output + bytes).slice(-1_048_576); });
  const code = await new Promise((resolve, reject) => {child.on('error', reject); child.on('close', resolve);});
  result.stages.push({name, command: ['npm', ...args], exit_code: code, elapsed_ms: Math.round(performance.now() - started), output});
  console.log(`${name}: ${code === 0 ? 'passed' : 'failed'}`);
  if (code !== 0) throw Error(`${name} failed\n${output}`);
}
try {
  for (const name of files) {await mkdir(dirname(join(temp, name)), {recursive: true}); await copyFile(join(root, name), join(temp, name));}
  await stage('clean-install', ['ci', '--ignore-scripts', '--no-audit', '--no-fund']);
  const installed = join(temp, 'node_modules/@zkapi/solana-sdk');
  if ((await lstat(installed)).isSymbolicLink() || !relative(await realpath(temp), await realpath(installed)).startsWith('node_modules/')) throw Error('SDK must be a local extracted package');
  result.sdk_installed_as_extracted_package = true;
  const installedLock = JSON.parse(await readFile(join(temp, 'package-lock.json'), 'utf8'));
  if (Object.keys(installedLock.packages ?? {}).some(name => name.endsWith('node_modules/@solana/web3.js')))
    throw Error('Legacy Solana runtime found in the installed dependency graph');
  result.kit_version = JSON.parse(await readFile(join(temp, 'node_modules/@solana/kit/package.json'), 'utf8')).version;
  result.legacy_solana_runtime_absent = true;
  await stage('typecheck', ['run', 'typecheck']);
  await stage('standalone-build', ['run', 'build']);
  await stage('legacy-build', ['run', 'build:legacy']);
  await stage('ui-tests', ['test']);
  const summary = result.stages.at(-1).output;
  const counts = {};
  for (const name of ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']) {
    const match = summary.match(new RegExp('(?:ℹ|#) ' + name + ' (\\d+)', 'u'));
    if (!match) throw Error('Missing test count: ' + name);
    counts[name] = Number(match[1]);
  }
  result.tests = counts;
  if (!counts.tests || counts.pass !== counts.tests || ['fail','cancelled','skipped','todo'].some(name => counts[name] !== 0)) throw Error('UI acceptance requires all tests and zero skips');
  result.source_unchanged = (await Promise.all(files.map(async name => sha(await readFile(join(root, name))) === before[name]))).every(Boolean);
  if (!result.source_unchanged) throw Error('Source changed while acceptance ran');
  result.success = true;
} catch (error) {
  result.failure = error.message; process.exitCode = 1;
} finally {
  result.finished_at = new Date().toISOString();
  await mkdir(join(root, 'docs/evidence'), {recursive: true});
  await writeFile(join(root, 'docs/evidence/kit-migration-isolated-results.json'), JSON.stringify(result, null, 2) + '\n');
  await rm(temp, {recursive: true, force: true, maxRetries: 10, retryDelay: 100});
}
