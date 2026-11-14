// Pure mapping from raw NASA DONKI JSON to the game's space-weather summary.
// Kept free of fetch/DOM so it is unit-tested (src/data/donki.test.ts).

import type { Risk, StormBasis } from '../utils/simulationEngine';
import { DONKI_ARCHIVE } from './nasaFacts';

export interface Flare {
  id: string;
  classType: string;
  peak: string; // ISO time
  region: string;
}

export interface SpaceWeather {
  status: 'live' | 'archive';
  /** Which endpoint answered: 'proxy' | 'api.nasa.gov' | 'ccmc' | 'archive' */
  via: string;
  fetchedAt: string;
  windowDays: number;
  flares: Flare[];
  counts: { X: number; M: number; C: number };
  cmeCount: number;
  fastestCmeKms: number | null;
  maxKp: number | null;
  sepCount: number;
  risk: Risk;
  reason: string;
  basis: StormBasis[];
  error?: string;
}

type Raw = Record<string, unknown>;
const arr = (v: unknown): Raw[] => (Array.isArray(v) ? (v.filter((x) => x && typeof x === 'object') as Raw[]) : []);
const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);

export function donkiDayUrl(type: string, isoDay: string): string {
  return `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/${type}?startDate=${isoDay}&endDate=${isoDay}`;
}

/** "X1.2" → 1201.2, "M5" → 105, "C3.4" → 3.4. Unknown → 0. */
export function flareRank(classType: string): number {
  const m = /^([ABCMX])(\d+(?:\.\d+)?)/i.exec(classType?.trim() ?? '');
  if (!m) return 0;
  const base = { A: -2, B: -1, C: 0, M: 100, X: 1200 }[m[1].toUpperCase() as 'A'];
  return base + Number(m[2]);
}

export function flareHazard(classType: string): StormBasis['hazard'] {
  const letter = classType?.trim()[0]?.toUpperCase();
  return letter === 'X' ? 'Critical' : letter === 'M' ? 'Moderate' : 'Low';
}

export function mapFlares(raw: unknown): Flare[] {
  return arr(raw)
    .map((f) => ({
      id: str(f.flrID, 'unknown'),
      classType: str(f.classType, '?').trim(),
      peak: str(f.peakTime) || str(f.beginTime),
      region: typeof f.activeRegionNum === 'number' ? `active region ${f.activeRegionNum}` : str(f.sourceLocation) ? `location ${str(f.sourceLocation)}` : 'an unnamed region'
    }))
    .filter((f) => flareRank(f.classType) > 0 || /^[CMX]/i.test(f.classType))
    .sort((a, b) => flareRank(b.classType) - flareRank(a.classType));
}

/** Fastest CME speed in km/s, preferring the "most accurate" analysis; null when none reported. */
export function fastestCme(raw: unknown): number | null {
  let best: number | null = null;
  for (const c of arr(raw)) {
    const analyses = arr(c.cmeAnalyses);
    const pick = analyses.find((a) => a.isMostAccurate === true) ?? analyses[0];
    const v = Number(pick?.speed);
    if (Number.isFinite(v) && v > 0) best = Math.max(best ?? 0, v);
  }
  return best === null ? null : Math.round(best);
}

export function maxKp(raw: unknown): number | null {
  let best: number | null = null;
  for (const g of arr(raw)) {
    for (const k of arr(g.allKpIndex)) {
      const v = Number(k.kpIndex);
      if (Number.isFinite(v)) best = Math.max(best ?? 0, v);
    }
  }
  return best;
}

export function riskFrom(counts: { X: number; M: number }, kp: number | null, seps: number): { risk: Risk; reason: string } {
  if (counts.X > 0) return { risk: 'high', reason: `${counts.X} X-class flare${counts.X > 1 ? 's' : ''} in the last month` };
  if (seps > 0) return { risk: 'high', reason: `${seps} solar particle storm${seps > 1 ? 's' : ''} in the last month` };
  if ((kp ?? 0) >= 7) return { risk: 'high', reason: `a severe geomagnetic storm (Kp ${kp})` };
  if (counts.M > 0) return { risk: 'moderate', reason: `${counts.M} M-class flare${counts.M > 1 ? 's' : ''} in the last month` };
  if ((kp ?? 0) >= 5) return { risk: 'moderate', reason: `a geomagnetic storm (Kp ${kp})` };
  return { risk: 'low', reason: 'the Sun has been quiet this month' };
}

export function archiveWeather(error?: string): SpaceWeather {
  return {
    status: 'archive',
    via: 'archive',
    fetchedAt: new Date().toISOString(),
    windowDays: 0,
    flares: [],
    counts: { X: 0, M: 0, C: 0 },
    cmeCount: 0,
    fastestCmeKms: null,
    maxKp: null,
    sepCount: 0,
    risk: 'moderate',
    reason: 'there was no connection to NASA, so storms are modelled on six real past events from the DONKI archive',
    basis: DONKI_ARCHIVE.map((e) => ({ label: `${e.classType}: ${e.headline}`, date: e.date, hazard: e.hazard, live: false, url: e.sources[0].url })),
    error
  };
}

/** Build the summary from raw DONKI arrays. FLR is required; the others may be missing. */
export function summarize(raw: { FLR: unknown; CME?: unknown; GST?: unknown; SEP?: unknown }, via: string, windowDays: number, now = new Date()): SpaceWeather {
  if (!Array.isArray(raw.FLR)) throw new Error('DONKI flare response was not a list');
  const flares = mapFlares(raw.FLR);
  const counts = { X: 0, M: 0, C: 0 };
  for (const f of flares) {
    const l = f.classType[0]?.toUpperCase() as 'X' | 'M' | 'C';
    if (l in counts) counts[l] += 1;
  }
  const kp = maxKp(raw.GST);
  const seps = arr(raw.SEP).length;
  const { risk, reason } = riskFrom(counts, kp, seps);
  const live: StormBasis[] = flares.slice(0, 3).map((f) => ({
    label: `${f.classType} solar flare from ${f.region}`,
    date: f.peak.slice(0, 10),
    hazard: flareHazard(f.classType),
    live: true,
    url: donkiDayUrl('FLR', f.peak.slice(0, 10))
  }));
  const archive = archiveWeather().basis;
  return {
    status: 'live',
    via,
    fetchedAt: now.toISOString(),
    windowDays,
    flares,
    counts,
    cmeCount: arr(raw.CME).length,
    fastestCmeKms: fastestCme(raw.CME),
    maxKp: kp,
    sepCount: seps,
    risk,
    reason,
    // live events first; archive ones keep the drills varied when the month was quiet
    basis: [...live, ...archive]
  };
}
