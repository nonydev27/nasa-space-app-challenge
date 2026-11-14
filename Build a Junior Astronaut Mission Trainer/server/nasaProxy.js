// Same-origin proxy for NASA open data, used by both `vite` (dev/preview) and
// server/index.js (production).
//
//   GET /api/donki/:type?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD   type ∈ FLR|CME|GST|SEP
//   GET /api/osdr?term=words
//
// Why a proxy: the OSDR search API only allows osdr.nasa.gov in browsers (CORS),
// and keeping the NASA key on the server (NASA_API_KEY) keeps it out of page source.
// DONKI is tried via api.nasa.gov first, then CCMC's own DONKI service.
// Responses are cached in memory for 15 minutes so a classroom shares one request.

const DONKI_TYPES = new Set(['FLR', 'CME', 'GST', 'SEP']);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const CACHE_MS = 15 * 60 * 1000;
const MAX_CACHE = 200;
const TIMEOUT_MS = 8000;
const OSDR_TIMEOUT_MS = 15000; // the OSDR search API often takes 5–10 s

/** @type {Map<string, { at: number, status: number, body: string }>} */
const cache = new Map();

function apiKey() {
  return process.env.NASA_API_KEY || 'DEMO_KEY';
}

async function fetchText(url, fetchImpl, timeoutMs = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    const body = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return body;
  } finally {
    clearTimeout(t);
  }
}

async function cached(key, load) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit;
  const body = await load();
  const entry = { at: Date.now(), status: 200, body };
  cache.set(key, entry);
  if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
  return entry;
}

function json(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(typeof obj === 'string' ? obj : JSON.stringify(obj));
}

export async function donki(type, startDate, endDate, fetchImpl = fetch) {
  if (!DONKI_TYPES.has(type) || !DAY.test(startDate) || !DAY.test(endDate)) {
    const err = new Error('bad request');
    err.status = 400;
    throw err;
  }
  const qs = `startDate=${startDate}&endDate=${endDate}`;
  return cached(`donki:${type}:${qs}`, async () => {
    const errors = [];
    for (const url of [`https://api.nasa.gov/DONKI/${type}?${qs}&api_key=${encodeURIComponent(apiKey())}`, `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/${type}?${qs}`]) {
      try {
        const body = await fetchText(url, fetchImpl);
        return body.trim() ? body : '[]';
      } catch (e) {
        errors.push(String(e?.message ?? e));
      }
    }
    const err = new Error(`DONKI unavailable (${errors.join('; ')})`);
    err.status = 502;
    throw err;
  });
}

export async function osdr(term, fetchImpl = fetch) {
  const q = String(term ?? '').trim().slice(0, 60);
  if (!q) {
    const err = new Error('missing term');
    err.status = 400;
    throw err;
  }
  return cached(`osdr:${q.toLowerCase()}`, async () => {
    const raw = JSON.parse(await fetchText(`https://osdr.nasa.gov/osdr/data/search?term=${encodeURIComponent(q)}&type=cgene&size=8`, fetchImpl, OSDR_TIMEOUT_MS));
    const hits = (raw?.hits?.hits ?? []).map((h) => {
      const s = h?._source ?? {};
      const acc = String(s.Accession ?? '');
      return {
        accession: acc,
        title: String(s['Study Title'] ?? '').slice(0, 220),
        organism: String(s.organism ?? '').replace(/\s+/g, ' ').trim().slice(0, 80),
        summary: String(s['Study Description'] ?? '').replace(/\s+/g, ' ').trim().slice(0, 320),
        url: `https://osdr.nasa.gov/bio/repo/data/studies/${encodeURIComponent(acc)}`
      };
    });
    return JSON.stringify({ total: Number(raw?.hits?.total) || hits.length, hits });
  });
}

/** Connect-style middleware; also usable from a plain http server. Returns true if handled. */
export async function handleNasaApi(req, res) {
  let url;
  try {
    url = new URL(req.url ?? '/', 'http://localhost');
  } catch {
    return false;
  }
  if (!url.pathname.startsWith('/api/')) return false;
  if (req.method !== 'GET') {
    json(res, 405, { error: 'method not allowed' });
    return true;
  }
  try {
    const m = /^\/api\/donki\/([A-Z]{3})$/.exec(url.pathname);
    if (m) {
      const r = await donki(m[1], url.searchParams.get('startDate') ?? '', url.searchParams.get('endDate') ?? '');
      json(res, 200, r.body);
      return true;
    }
    if (url.pathname === '/api/osdr') {
      const r = await osdr(url.searchParams.get('term'));
      json(res, 200, r.body);
      return true;
    }
    json(res, 404, { error: 'not found' });
  } catch (e) {
    json(res, e?.status ?? 502, { error: String(e?.message ?? e) });
  }
  return true;
}

export function nasaProxyMiddleware() {
  return (req, res, next) => {
    handleNasaApi(req, res).then((handled) => {
      if (!handled) next();
    }, next);
  };
}

export function clearNasaCache() {
  cache.clear();
}
