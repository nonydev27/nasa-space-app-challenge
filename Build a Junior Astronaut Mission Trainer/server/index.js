// Production server: serves the built game from ./dist, the NASA data proxy at
// /api/*, a health check at /healthz, and the crew relay (WebSocket) at /crew,
// all on one origin so multiplayer and live data work anywhere you can run Node.
//
//   npm run build && npm start        → http://localhost:8080
//   PORT=3000 NASA_API_KEY=... npm start

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attachCrewRelay } from './relay.js';
import { handleNasaApi } from './nasaProxy.js';

const ROOT = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
const PORT = Number(process.env.PORT) || 8080;
const STARTED = Date.now();
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
const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'SAMEORIGIN'
};

async function serveFile(res, file, cache) {
  const body = await readFile(file);
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': cache ? 'public, max-age=31536000, immutable' : 'no-cache',
    ...SECURITY
  });
  res.end(body);
}

let relay;

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ ok: true, uptimeSec: Math.round((Date.now() - STARTED) / 1000), crew: relay?.stats() }));
      return;
    }
    if (await handleNasaApi(req, res)) return;
    const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    const file = resolve(join(ROOT, rel));
    if (file !== ROOT && !file.startsWith(ROOT + sep)) {
      res.writeHead(403).end();
      return;
    }
    const s = await stat(file).catch(() => null);
    if (s?.isFile()) return await serveFile(res, file, rel.startsWith('assets/'));
    return await serveFile(res, join(ROOT, 'index.html'), false); // SPA fallback
  } catch {
    if (!res.headersSent) res.writeHead(500);
    res.end('Server error');
  }
});

// Proxies (nginx, Render, Fly…) often close idle sockets at ~60 s; the relay pings every 25 s.
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

relay = attachCrewRelay(server);
server.listen(PORT, () => console.log(`AstroLab running on http://localhost:${PORT} (crew relay /crew, health /healthz)`));

function shutdown(signal) {
  console.log(`${signal} received: closing crew rooms and stopping server…`);
  relay.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
