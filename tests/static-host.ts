/** Test-only loopback server. It has no RPC, credential, AUTH or inference routes. */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {once} from 'node:events';

export async function startUiHost(options: {port: number; output: string; rpc?: () => Promise<never>; clearance?: () => Promise<never>; indexer?: () => Promise<never>}) {
  const assets = new Map<string, {bytes: Buffer; type: string}>();
  for (const [name, type] of [['index.html', 'text/html'], ['app.js', 'text/javascript'], ['style.css', 'text/css'],
    ['worker.js', 'text/javascript'], ['demo.html', 'text/html'], ['demo.js', 'text/javascript'], ['demo.css', 'text/css']]) {
    try { assets.set('/' + name, {bytes: await readFile(join(options.output, name)), type}); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  const demoReady = ['demo.html', 'demo.js', 'demo.css'].every(name => assets.has('/' + name));
  const server = createServer((request, response) => {
    const path = request.url === '/' || request.url === '/live' ? '/index.html' : request.url === '/demo' ? '/demo.html' : request.url ?? '';
    const asset = assets.get(path);
    response.setHeader('Cache-Control', 'no-store'); response.setHeader('X-Content-Type-Options', 'nosniff');
    if (request.method !== 'GET' || !asset || path.startsWith('/demo.') && !demoReady) {response.writeHead(400).end(); return;}
    response.setHeader('Content-Type', asset.type); response.end(asset.bytes);
  });
  server.listen(options.port, '127.0.0.1'); await once(server, 'listening');
  return {origin: `http://127.0.0.1:${(server.address() as {port: number}).port}`,
    close: () => new Promise<void>((resolve, reject) => { server.close(error => error ? reject(error) : resolve()); server.closeIdleConnections(); })};
}
