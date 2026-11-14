import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearNasaCache, donki, osdr } from './nasaProxy.js';

const ok = (body) => Promise.resolve(new Response(body, { status: 200 }));
beforeEach(() => clearNasaCache());

describe('DONKI proxy', () => {
  it('validates the type and dates', async () => {
    await expect(donki('XYZ', '2026-01-01', '2026-01-02')).rejects.toMatchObject({ status: 400 });
    await expect(donki('FLR', '2026-1-1', '2026-01-02')).rejects.toMatchObject({ status: 400 });
    await expect(donki('FLR', '2026-01-01', '2026-01-02&api_key=x')).rejects.toMatchObject({ status: 400 });
  });

  it('tries api.nasa.gov then CCMC, and caches the answer', async () => {
    const f = vi.fn((url) => (url.includes('api.nasa.gov') ? Promise.resolve(new Response('', { status: 404 })) : ok('[{"flrID":"1"}]')));
    const r = await donki('FLR', '2026-10-01', '2026-11-01', f);
    expect(r.body).toBe('[{"flrID":"1"}]');
    expect(f).toHaveBeenCalledTimes(2);
    await donki('FLR', '2026-10-01', '2026-11-01', f);
    expect(f).toHaveBeenCalledTimes(2); // cached
  });

  it('uses the server-only NASA key for the upstream request', async () => {
    const previous = process.env.NASA_API_KEY;
    process.env.NASA_API_KEY = 'server-only-test-key';
    const f = vi.fn(() => ok('[]'));
    try {
      await donki('FLR', '2026-10-01', '2026-11-01', f);
      expect(f.mock.calls[0][0]).toContain('api_key=server-only-test-key');
    } finally {
      if (previous === undefined) delete process.env.NASA_API_KEY;
      else process.env.NASA_API_KEY = previous;
    }
  });

  it('returns 502 when both upstreams fail', async () => {
    await expect(donki('CME', '2026-10-01', '2026-11-01', () => Promise.reject(new Error('down')))).rejects.toMatchObject({ status: 502 });
  });

  it('turns an empty upstream body into an empty list', async () => {
    expect((await donki('SEP', '2026-10-01', '2026-11-01', () => ok(''))).body).toBe('[]');
  });
});

describe('OSDR proxy', () => {
  it('trims OSDR search hits to what the game shows', async () => {
    const raw = { hits: { total: 1, hits: [{ _source: { Accession: 'OSD-476', 'Study Title': 'Plants grown in Apollo lunar regolith', organism: 'Arabidopsis  thaliana', 'Study Description': 'x'.repeat(1000) } }] } };
    const r = JSON.parse((await osdr('lunar', () => ok(JSON.stringify(raw)))).body);
    expect(r.total).toBe(1);
    expect(r.hits[0]).toMatchObject({ accession: 'OSD-476', organism: 'Arabidopsis thaliana', url: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-476' });
    expect(r.hits[0].summary.length).toBeLessThanOrEqual(320);
  });
  it('requires a search term', async () => expect(osdr('  ')).rejects.toMatchObject({ status: 400 }));
});
