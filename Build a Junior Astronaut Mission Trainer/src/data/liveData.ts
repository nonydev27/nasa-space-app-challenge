// Live NASA data with honest fallbacks.
//
// DONKI: same-origin proxy (server/nasaProxy.js) → api.nasa.gov → CCMC directly →
// curated archive. Whatever answers is reported in `via`; the UI labels the result
// LIVE or ARCHIVE and never presents archive data as live.
//
// OSDR: the OSDR search API only allows its own website in the browser (CORS), so
// live search needs the proxy. Without it we search the studies saved in the game.

import { archiveWeather, summarize, type SpaceWeather } from './donki';
import { OSDR_STUDIES } from './nasaFacts';

const WINDOW_DAYS = 30;
const CACHE_KEY = 'astrolab.spaceweather.v2';
const CACHE_MS = 30 * 60 * 1000;
export const TIMEOUT_MS = 5000;

type Fetch = typeof fetch;

async function getJson(fetchImpl: Fetch, url: string, timeoutMs: number): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return text.trim() ? JSON.parse(text) : []; // DONKI returns an empty body for "no events"
  } finally {
    clearTimeout(t);
  }
}

const day = (d: Date) => d.toISOString().slice(0, 10);

export function donkiSources(now: Date): Array<{ via: string; url: (type: string) => string }> {
  const qs = `startDate=${day(new Date(now.getTime() - WINDOW_DAYS * 864e5))}&endDate=${day(now)}`;
  return [
    { via: 'proxy', url: (t) => `/api/donki/${t}?${qs}` },
    { via: 'ccmc', url: (t) => `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/${t}?${qs}` }
  ];
}

/** Try each source in order. Flares are required; CME/GST/SEP are best-effort. */
export async function fetchSpaceWeather(fetchImpl: Fetch = fetch, now = new Date(), timeoutMs = TIMEOUT_MS): Promise<SpaceWeather> {
  const errors: string[] = [];
  for (const src of donkiSources(now)) {
    try {
      const [FLR, CME, GST, SEP] = await Promise.all(
        ['FLR', 'CME', 'GST', 'SEP'].map((t, i) =>
          getJson(fetchImpl, src.url(t), timeoutMs).catch((e) => {
            if (i === 0) throw e;
            return undefined;
          })
        )
      );
      return summarize({ FLR, CME, GST, SEP }, src.via, WINDOW_DAYS, now);
    } catch (e) {
      errors.push(`${src.via}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return archiveWeather(errors.join('; '));
}

let inflight: Promise<SpaceWeather> | null = null;

/** Cached for 30 minutes per browser session so every screen agrees. */
export function getSpaceWeather(): Promise<SpaceWeather> {
  if (inflight) return inflight;
  try {
    const cached = JSON.parse(window.sessionStorage.getItem(CACHE_KEY) ?? 'null') as SpaceWeather | null;
    if (cached?.status === 'live' && Date.now() - Date.parse(cached.fetchedAt) < CACHE_MS) return (inflight = Promise.resolve(cached));
  } catch {
    /* storage blocked: fetch fresh */
  }
  inflight = fetchSpaceWeather().then((w) => {
    try {
      if (w.status === 'live') window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(w));
    } catch {
      /* ignore */
    }
    // Don't hammer NASA (the shared DEMO_KEY allows only a few calls per hour): retry after 5 minutes.
    if (w.status !== 'live') window.setTimeout(() => (inflight = null), 5 * 60 * 1000);
    return w;
  });
  return inflight;
}

// ------------------------------------------------------------------ OSDR search
export interface OsdrHit {
  accession: string;
  title: string;
  organism: string;
  summary: string;
  url: string;
}

export interface OsdrResult {
  status: 'live' | 'saved';
  total: number;
  hits: OsdrHit[];
}

export async function searchOsdr(term: string, fetchImpl: Fetch = fetch): Promise<OsdrResult> {
  const q = term.trim().slice(0, 60);
  if (!q) return { status: 'saved', total: OSDR_STUDIES.length, hits: OSDR_STUDIES.map(savedHit) };
  try {
    const data = (await getJson(fetchImpl, `/api/osdr?term=${encodeURIComponent(q)}`, 18000)) as { total?: number; hits?: OsdrHit[] };
    if (!Array.isArray(data.hits)) throw new Error('bad response');
    return { status: 'live', total: Number(data.total) || data.hits.length, hits: data.hits };
  } catch {
    const words = q.toLowerCase().split(/\s+/);
    const hits = OSDR_STUDIES.filter((s) => words.every((w) => `${s.title} ${s.organism} ${s.kidFinding} ${s.accession}`.toLowerCase().includes(w))).map(savedHit);
    return { status: 'saved', total: hits.length, hits };
  }
}

function savedHit(s: (typeof OSDR_STUDIES)[number]): OsdrHit {
  return { accession: s.accession, title: s.title, organism: s.organism, summary: s.kidFinding, url: s.url };
}
