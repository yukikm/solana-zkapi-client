// Build only the independently installed SDK package and local application sources.
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { copyFile, readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { parseReviewedDevnetProfile } from './load-deployment.ts';
const root = fileURLToPath(new URL('../', import.meta.url));
const options = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  const name = process.argv[i], value = process.argv[i + 1];
  if (!['--profile', '--profile-sha256', '--out-dir'].includes(name) || !value || value.startsWith('--') || options.has(name)) throw Error('Invalid browser build arguments');
  options.set(name, value);
}
const configured = options.has('--profile');
if (configured !== options.has('--profile-sha256') || configured && !options.has('--out-dir')) throw Error('Configured build requires profile, independent profile SHA256 and isolated output directory');
const output = resolve(root, options.get('--out-dir') ?? 'dist/browser-chat');
if (configured && output === resolve(root, 'dist/browser-chat')) throw Error('Keep the default unconfigured build separate');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
let profiles = [], profileSha256 = null;
if (configured) {
  const bytes = await readFile(resolve(root, options.get('--profile'))), expected = options.get('--profile-sha256');
  if (!/^[0-9a-f]{64}$/.test(expected) || bytes.length > 1024 * 1024 || sha(bytes) !== expected) throw Error('Reviewed public profile digest mismatch');
  profiles = [parseReviewedDevnetProfile(bytes)]; profileSha256 = expected;
}
await mkdir(output, {recursive: true});
await build({ absWorkingDir: root, entryPoints: ['browser-chat/integration.ts'],
  outfile: join(output, 'integration.js'), bundle: true, format: 'esm', platform: 'browser',
  target: 'chrome120', define: { 'process.env.NODE_ENV': '"production"' } });
await build({ absWorkingDir: root, entryPoints: ['@zkapi/solana-sdk/prover-worker'],
  outfile: join(output, 'worker.js'), bundle: true, format: 'esm', platform: 'browser', target: 'chrome120' });
await build({ absWorkingDir: root, entryPoints: ['browser-chat/main.ts'],
  outfile: join(output, 'app.js'), bundle: true, format: 'esm', platform: 'browser',
  target: 'chrome120', define: { 'process.env.NODE_ENV': '"production"', '__ZKAPI_INSTALLED_PROFILES__': JSON.stringify(profiles) } });
for (const name of ['index.html', 'styles.css']) await copyFile(`${root}browser-chat/${name}`, join(output, name));
const assets = {};
for (const name of ['index.html', 'styles.css', 'app.js', 'integration.js', 'worker.js']) assets[name] = sha(await readFile(join(output, name)));
await writeFile(join(output, 'profile-build.json'), JSON.stringify({schema: 1, profileSha256, assets}, null, 2) + '\n');
