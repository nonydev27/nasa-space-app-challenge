import { afterEach, describe, expect, it, vi } from 'vitest';
import { archiveWeather, fastestCme, flareRank, mapFlares, maxKp, riskFrom, summarize } from './donki';
import { donkiSources, fetchSpaceWeather, searchOsdr } from './liveData';
import { DONKI_ARCHIVE } from './nasaFacts';

const ok = (body: unknown) => Promise.resolve(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status: 200 }));

const FLR = [
  { flrID: 'a', classType: 'M2.1', peakTime: '2026-11-02T10:00Z', activeRegionNum: 14201 },
  { flrID: 'b', classType: 'X1.4', peakTime: '2026-11-05T03:10Z', activeRegionNum: 14210 },
  { flrID: 'c', classType: 'C9.9', beginTime: '2026-11-07T01:00Z', sourceLocation: 'S10E20' }
];

describe('DONKI mapping', () => {
  it('ranks flare classes correctly', () => {
    expect(flareRank('X1.0')).toBeGreaterThan(flareRank('M9.9'));
    expect(flareRank('M1.0')).toBeGreaterThan(flareRank('C9.9'));
    expect(flareRank('garbage')).toBe(0);
  });

  it('maps and sorts flares, tolerating missing fields', () => {
    const f = mapFlares([...FLR, null, 'x', { flrID: 'd' }]);
    expect(f.map((x) => x.id)).toEqual(['b', 'a', 'c']);
    expect(f[0].region).toBe('active region 14210');
    expect(f[2].region).toBe('location S10E20');
    expect(f[2].peak).toBe('2026-11-07T01:00Z'); // falls back to beginTime
  });

  it('reads CME speed from the most accurate analysis, and handles missing/partial CME data', () => {
    expect(fastestCme([{ cmeAnalyses: [{ speed: 500 }, { speed: 900, isMostAccurate: true }] }, { cmeAnalyses: [{ speed: 700 }] }])).toBe(900);
    expect(fastestCme([{ cmeAnalyses: null }, { cmeAnalyses: [{ speed: 'n/a' }] }, {}])).toBeNull();
    expect(fastestCme(undefined)).toBeNull();
  });

  it('finds the strongest Kp', () => {
    expect(maxKp([{ allKpIndex: [{ kpIndex: 5.33 }, { kpIndex: 7 }] }, { allKpIndex: null }])).toBe(7);
    expect(maxKp([])).toBeNull();
  });

  it('turns activity into storm risk', () => {
    expect(riskFrom({ X: 1, M: 0 }, null, 0).risk).toBe('high');
    expect(riskFrom({ X: 0, M: 0 }, null, 2).risk).toBe('high');
    expect(riskFrom({ X: 0, M: 0 }, 8, 0).risk).toBe('high');
    expect(riskFrom({ X: 0, M: 3 }, null, 0).risk).toBe('moderate');
    expect(riskFrom({ X: 0, M: 0 }, 5, 0).risk).toBe('moderate');
    expect(riskFrom({ X: 0, M: 0 }, 3, 0).risk).toBe('low');
  });

  it('summarizes live data, with live events first and archive events as backup', () => {
    const w = summarize({ FLR, CME: [{ cmeAnalyses: [{ speed: 1200 }] }], GST: [], SEP: undefined }, 'proxy', 30, new Date('2026-11-14T00:00Z'));
    expect(w).toMatchObject({ status: 'live', via: 'proxy', counts: { X: 1, M: 1, C: 1 }, cmeCount: 1, fastestCmeKms: 1200, sepCount: 0, risk: 'high' });
    expect(w.basis[0]).toMatchObject({ live: true, hazard: 'Critical', date: '2026-11-05' });
    expect(w.basis.some((b) => !b.live)).toBe(true);
  });

  it('a quiet month is live with low risk, not an error', () => {
    const w = summarize({ FLR: [] }, 'api.nasa.gov', 30);
    expect(w.status).toBe('live');
    expect(w.risk).toBe('low');
  });

  it('rejects a non-list flare response', () => expect(() => summarize({ FLR: { error: 'x' } }, 'proxy', 30)).toThrow());

  it('the archive is labelled as archive and cites DONKI', () => {
    const a = archiveWeather('offline');
    expect(a.status).toBe('archive');
    expect(a.basis).toHaveLength(DONKI_ARCHIVE.length);
    expect(a.basis.every((b) => !b.live && b.url.startsWith('https://'))).toBe(true);
  });
});

describe('fetchSpaceWeather fallback chain', () => {
  afterEach(() => vi.useRealTimers());
  const now = new Date('2026-11-14T12:00Z');

  it('uses the same-origin proxy first', async () => {
    const f = vi.fn((url: string) => ok(url.includes('/FLR') ? FLR : []));
    const w = await fetchSpaceWeather(f as unknown as typeof fetch, now);
    expect(w.via).toBe('proxy');
    expect(f.mock.calls[0][0]).toMatch(/^\/api\/donki\/FLR\?startDate=2026-10-15&endDate=2026-11-14$/);
  });

  it('falls through proxy HTTP errors to CCMC', async () => {
    const f = vi.fn((url: string) => {
      if (url.startsWith('/api') || url.includes('api.nasa.gov')) return Promise.resolve(new Response('nope', { status: 404 }));
      return ok(url.includes('/FLR') ? FLR : []);
    });
    const w = await fetchSpaceWeather(f as unknown as typeof fetch, now);
    expect(w.via).toBe('ccmc');
    expect(w.status).toBe('live');
  });

  it('treats an empty DONKI body as "no events"', async () => {
    const w = await fetchSpaceWeather((() => ok('')) as unknown as typeof fetch, now);
    expect(w).toMatchObject({ status: 'live', risk: 'low', flares: [] });
  });

  it('still works when only the CME/GST/SEP calls fail', async () => {
    const f = (url: string) => (url.includes('/FLR') ? ok(FLR) : Promise.reject(new Error('down')));
    const w = await fetchSpaceWeather(f as unknown as typeof fetch, now);
    expect(w).toMatchObject({ status: 'live', cmeCount: 0, fastestCmeKms: null });
  });

  it('falls back to the labelled archive when every source fails', async () => {
    const w = await fetchSpaceWeather((() => Promise.reject(new TypeError('Failed to fetch'))) as unknown as typeof fetch, now);
    expect(w.status).toBe('archive');
    expect(w.error).toMatch(/proxy.*ccmc/);
  });

  it('times out hung requests (5 s each) and ends on the archive', async () => {
    vi.useFakeTimers();
    const hang = (_url: string, init?: RequestInit) =>
      new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
    const p = fetchSpaceWeather(hang as unknown as typeof fetch, now, 5000);
    await vi.advanceTimersByTimeAsync(3 * 5000 + 10);
    const w = await p;
    expect(w.status).toBe('archive');
  });

  it('keeps API keys out of browser requests', () => {
    const sources = donkiSources(now);
    expect(sources.map((source) => source.via)).toEqual(['proxy', 'ccmc']);
    expect(sources.every((source) => !source.url('FLR').includes('api_key='))).toBe(true);
  });
});

describe('OSDR search fallback', () => {
  it('uses the same-origin proxy and reports live results', async () => {
    const f = vi.fn((_url: string) => ok({ total: 1, hits: [{ accession: 'OSD-476', title: 'Moon soil plants', organism: 'Arabidopsis', summary: 'Study', url: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-476' }] }));
    const result = await searchOsdr('moon soil', f as unknown as typeof fetch);
    expect(f.mock.calls[0][0]).toBe('/api/osdr?term=moon%20soil');
    expect(result).toMatchObject({ status: 'live', total: 1, hits: [{ accession: 'OSD-476' }] });
  });

  it('uses saved studies when the live OSDR search is unavailable', async () => {
    const result = await searchOsdr('lettuce', (() => Promise.reject(new TypeError('offline'))) as unknown as typeof fetch);
    expect(result.status).toBe('saved');
    expect(result.hits.length).toBeGreaterThan(0);
    expect(result.hits.every((hit) => hit.url.startsWith('https://osdr.nasa.gov/'))).toBe(true);
  });
});
