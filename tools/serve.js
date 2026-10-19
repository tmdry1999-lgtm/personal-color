import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
};

export function createStaticServer(root) {
  const base = resolve(root);
  return createServer(async (req, res) => {
    let file;
    try {
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      // 주소 끝에 / 를 빼먹어도 부스 앱이 열리게
      if (path === '/' || path === '/app') {
        res.writeHead(302, { location: '/app/' });
        res.end();
        return;
      }
      file = resolve(join(base, path));
      if (file !== base && !file.startsWith(base + sep)) throw new Error('outside root');
      if (path.endsWith('/')) file = join(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('not found');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.argv[2] ?? 8080);
  createStaticServer('.').listen(port, '127.0.0.1', () => {
    console.log(`부스 앱: http://localhost:${port}/app/`);
  });
}
