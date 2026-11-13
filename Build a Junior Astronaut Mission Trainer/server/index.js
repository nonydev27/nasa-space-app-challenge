// Production server: serves the built game from ./dist and hosts the crew relay
// on the same origin, so multiplayer works anywhere you can run Node.
//
//   npm run build && npm start        → http://localhost:8080
//   PORT=3000 npm start

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attachCrewRelay } from './relay.js';

const ROOT = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

async function serveFile(res, file, cache) {
  const body = await readFile(file);
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': cache ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    const file = resolve(join(ROOT, rel));
    if (file !== ROOT && !file.startsWith(ROOT + sep)) {
      res.writeHead(403).end();
      return;
    }
    const s = await stat(file).catch(() => null);
    if (s?.isFile()) return await serveFile(res, file, rel.startsWith('assets/'));
    // SPA fallback
    return await serveFile(res, join(ROOT, 'index.html'), false);
  } catch {
    res.writeHead(500).end('Server error');
  }
});

attachCrewRelay(server);
server.listen(PORT, () => console.log(`AstroLab running on http://localhost:${PORT} (crew relay at /crew)`));
