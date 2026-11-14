// Simulation engine for AstroLab.
//
// Three core resources drive every decision: POWER (battery), AIR (oxygen from
// life support) and RADIATION (dose). Food is the fourth, slower pressure.
// Every lever trades one of them against another; nothing is free.
//
// Real numbers used here (see src/data/nasaFacts.ts for sources):
//  - surface radiation: Moon 1.37 mSv/day (Chang'e-4 LND), Mars 0.64 mSv/day (Curiosity RAD)
//  - Moon has no dust storms; Mars dust storms cut sunlight (Opportunity, 2018)
//  - cabin pressure 101.3 kPa (ISS sea-level atmosphere)
// Everything else (kW sizes, drain rates, shield factors) is a GAME MODEL, tuned
// for play and labelled as such in the UI.

import { DONKI_ARCHIVE, SURFACE_DOSE_MSV_PER_HOUR } from '../data/nasaFacts';
import { DECISION_DECK, findCard, type EffectKey, type Effects, type Modifier } from '../game/decisions';

export type Location = 'moon' | 'mars';
export type Mode = 'cadet' | 'director';
export type Risk = 'low' | 'moderate' | 'high';

/**
 * Power model (GAME MODEL, kW). The Moon's 40 kW baseload matches NASA's Fission
 * Surface Power target; everything else is sized so the trade-offs are playable.
 */
export const POWER = {
  solarPeakKW: { moon: 60, mars: 70 },
  baseloadKW: { moon: 40, mars: 35 },
  eclssDayKW: 20,
  eclssNightExtraKW: { moon: 8, mars: 4 },
  eclssBunkerKW: 14,
  greenhouseKW: 10,
  greenhouseHighKW: 18,
  greenhouseBunkerKW: 3,
  evaKW: 10,
  deflectorKW: 30
} as const;

/** Science per kW-hour of lab power, and per hour of rover EVA. */
export const SCIENCE = { perLabKWh: 0.08, evaPerHour: 1.2 } as const;

/** How long a solar particle storm keeps radiation high after it arrives (game hours). */
export const STORM_HOURS = 10;

/** Game hours that pass per real second at 1× (1 sol ≈ 2.4 min). */
export const HOURS_PER_SECOND = 1 / 6;
export const SPEEDS = [1, 2, 4] as const;

export interface MissionGoal {
  targetSols: number;
  minO2: number;
  minBattery: number;
  scienceTarget: number;
  minFoodDays: number;
  /** crew health needed at the end (%) */
  minHealth: number;
}

export interface MissionConfigLike {
  id: string;
  goal: MissionGoal & Record<string, unknown>;
  initialState: Record<string, number | boolean | undefined>;
}

/** Real event a storm drill is modelled on. */
export interface StormBasis {
  label: string;
  date: string;
  hazard: 'Low' | 'Moderate' | 'Critical';
  live: boolean;
  url: string;
}

export interface SpaceWeatherInput {
  risk: Risk;
  live: boolean;
  /** Real events to model storms on, strongest first */
  basis: StormBasis[];
}

export interface Alert {
  id: string;
  source: 'DONKI';
  severity: 'critical' | 'moderate';
  title: string;
  message: string;
  countdownSec: number;
  impactHandled: boolean;
  /** game hours of storm left after impact */
  stormHoursLeft?: number;
  basedOn: StormBasis;
}

export interface ScheduledEvent {
  atHour: number;
  kind: 'storm' | 'card';
  ref: string;
  done: boolean;
}

export interface LogEntry {
  id: number;
  sol: number;
  hour: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export interface DecisionRecord {
  sol: number;
  cardId: string;
  title: string;
  icon: string;
  choice: string;
  lesson: string;
}

export interface HistoryPoint {
  t: number;
  battery: number;
  oxygen: number;
  food: number;
  dose: number;
  health: number;
  science: number;
}

const CREW = [
  { name: 'Maya', role: 'Commander', status: 'Active in Hab', avatar: '👩‍🚀' },
  { name: 'Leo', role: 'Systems Engineer', status: 'Monitoring Grid', avatar: '👨‍🚀' },
  { name: 'Zara', role: 'Flight Surgeon', status: 'Checking Vitals', avatar: '👩‍⚕️' },
  { name: 'Kai', role: 'Astro-Botanist', status: 'Tending Crops', avatar: '🧑‍🌾' }
];

const DEFAULT_GOAL: MissionGoal = { targetSols: 5, minO2: 50, minBattery: 10, scienceTarget: 60, minFoodDays: 1, minHealth: 50 };

export function formatHour(hourFloat: number): string {
  const h = Math.floor(hourFloat);
  const m = Math.floor((hourFloat - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/** Small deterministic RNG so a run's schedule is reproducible from its seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Archive basis used when no live DONKI data is available. */
export function archiveBasis(): StormBasis[] {
  return DONKI_ARCHIVE.map((e) => ({ label: `${e.classType}: ${e.headline}`, date: e.date, hazard: e.hazard, live: false, url: e.sources[0].url }));
}

const ARCHIVE_WEATHER: SpaceWeatherInput = { risk: 'moderate', live: false, basis: archiveBasis() };

function stormCount(missionId: string, risk: Risk, sols: number, rnd: () => number): number {
  if (missionId === 'mission-1') return risk === 'high' && rnd() < 0.5 ? 1 : 0;
  if (missionId === 'mission-3') return sols > 4 && risk !== 'low' ? 1 : 0; // plus the opening storm
  const base = risk === 'high' ? 2 : risk === 'moderate' ? 1 : rnd() < 0.35 ? 1 : 0;
  return Math.min(base, Math.max(0, sols - 2));
}

/** Plan this run's decision cards and storms. Different every playthrough. */
export function planMission(missionId: string, location: Location, sols: number, weather: SpaceWeatherInput, seed: number): ScheduledEvent[] {
  const rnd = mulberry32(seed);
  const events: ScheduledEvent[] = [];
  const pool = DECISION_DECK.filter((c) => !c.where || c.where === location);
  const forced: string[] = [];
  if (missionId === 'mission-1') forced.push('night-prep');
  if (missionId === 'mission-5') forced.push('scrubber-fault');
  if (missionId === 'mission-4') forced.push('grow-lights');
  const rest = pool.map((c) => c.id).filter((id) => !forced.includes(id));
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const cards = [...forced, ...rest].slice(0, Math.max(2, sols));
  cards.forEach((ref, i) => {
    const at = ref === 'scrubber-fault' && missionId === 'mission-5' ? 2 : ref === 'night-prep' ? 7 : 3 + i * 24 * ((sols - 0.4) / cards.length) + rnd() * 6;
    events.push({ atHour: at, kind: 'card', ref, done: false });
  });
  const n = stormCount(missionId, weather.risk, sols, rnd);
  for (let i = 0; i < n; i++) {
    const sol = 1 + Math.floor(rnd() * Math.max(1, sols - 1)) + (i > 0 ? 1 : 0);
    const basis = weather.basis.length ? weather.basis[Math.floor(rnd() * Math.min(3, weather.basis.length))] : archiveBasis()[0];
    events.push({ atHour: Math.min((sols - 0.6) * 24, sol * 24 + 1 + rnd() * 10), kind: 'storm', ref: `${basis.date}|${i}`, done: false });
  }
  return events.sort((a, b) => a.atHour - b.atHour);
}

function makeAlert(basis: StormBasis, countdownSec: number): Alert {
  const critical = basis.hazard === 'Critical';
  return {
    id: `storm-${basis.date}-${Math.round(countdownSec)}`,
    source: 'DONKI',
    severity: critical ? 'critical' : 'moderate',
    title: critical ? 'Solar particle storm warning!' : 'Solar storm watch',
    message: `${critical ? 'Fast solar particles are on the way.' : 'A smaller burst of particles may reach the base.'} Get the crew into the bunker or raise the deflector before it hits.`,
    countdownSec,
    impactHandled: false,
    basedOn: basis
  };
}

export function createInitialSimulationState(
  missionConfig: MissionConfigLike | null,
  location: Location = 'moon',
  mode: Mode = 'cadet',
  weather: SpaceWeatherInput = ARCHIVE_WEATHER,
  seed: number = Date.now()
) {
  const isMars = location === 'mars';
  const init = missionConfig?.initialState ?? {};
  const goal: MissionGoal = missionConfig?.goal ? { ...DEFAULT_GOAL, ...missionConfig.goal } : { ...DEFAULT_GOAL, targetSols: 999 };
  const num = (k: string, d: number) => (typeof init[k] === 'number' ? (init[k] as number) : d);
  const missionId = missionConfig?.id ?? 'sandbox';
  const basis = weather.basis.length ? weather.basis : archiveBasis();
  const opening = init.incomingSolarFlare ? makeAlert({ ...basis[0], hazard: 'Critical' }, 45) : null;

  return {
    missionId,
    location,
    mode,
    seed,
    weatherLive: weather.live,
    weatherRisk: weather.risk,
    stormBasis: basis,
    goal,
    sol: 1,
    hour: 8,
    absHours: 0,
    paused: false,
    speed: 1 as number,

    isDaylight: true,
    sunAngleDeg: 45,
    dustStormActive: Boolean(init.activeDustStorm),
    dustOpticalDepthTau: isMars ? (init.activeDustStorm ? 3.8 : 0.6) : 0,
    solarIrradianceFlux: isMars ? 590 : 1361,

    solarPanelsDeployed: true,
    solarOutputKW: 60,
    rtgNuclearOutputKW: POWER.baseloadKW[location] as number,
    batteryKWh: num('batteryKWh', 80),
    batteryMaxKWh: num('batteryMaxKWh', 100),

    // The lab starts OFF: powering it is the player's first science-vs-battery choice.
    powerAllocations: { eclss: 22, shields: 5, greenhouse: 10, scienceLab: 0, commsRover: 3 },

    toggles: {
      magneticShieldActive: false,
      bunkerLockdown: false,
      waterRationing: false,
      highYieldCropCycle: false,
      roverOnEVA: false,
      autonomousMode: false
    },

    oxygenLevel: num('oxygenLevel', 95),
    co2LevelPpm: 420,
    cabinPressureKPa: 101.3,
    waterLevel: num('waterLevel', 88),
    foodStockpileSols: num('foodStockpileSols', 7),
    cropGrowthProgress: 40,
    cropHealth: 90,

    radiationDoseRate: 0,
    accumulatedDoseMSv: 0,
    shieldIntegrity: num('radiationShielding', 70),
    crewHealth: num('crewHealth', 100),
    crewMorale: num('crewMorale', 88),
    sciencePoints: num('sciencePoints', 0),

    activeAlert: opening as Alert | null,
    events: planMission(missionId, location, goal.targetSols, { ...weather, basis }, seed),
    pendingDecision: null as string | null,
    modifiers: [] as Modifier[],
    decisions: [] as DecisionRecord[],
    history: [] as HistoryPoint[],
    stormsSurvived: 0,
    stormsHit: 0,
    harvests: 0,
    blackoutHours: 0,

    crew: CREW.map((c) => ({ ...c })),
    logs: [{ id: 1, sol: 1, hour: '08:00', text: 'Systems online. Life support and power are working normally.', type: 'info' }] as LogEntry[],

    completed: false,
    failed: false,
    failureReason: '',
    missedGoals: [] as string[],
    unlockedBadges: [] as string[]
  };
}

export type SimState = ReturnType<typeof createInitialSimulationState>;

function log(s: SimState, text: string, type: LogEntry['type'] = 'info'): void {
  s.logs = [{ id: Date.now() + Math.random(), sol: s.sol, hour: formatHour(s.hour), text, type }, ...s.logs.slice(0, 40)];
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Apply a one-off effect bundle (from a decision card). Mutates `s`. */
export function applyEffects(s: SimState, e: Effects): void {
  const f: Record<EffectKey, (v: number) => void> = {
    battery: (v) => (s.batteryKWh = clamp(s.batteryKWh + v, 0, s.batteryMaxKWh)),
    oxygen: (v) => (s.oxygenLevel = clamp(s.oxygenLevel + v, 0, 100)),
    food: (v) => (s.foodStockpileSols = Math.max(0, Math.round((s.foodStockpileSols + v) * 10) / 10)),
    science: (v) => (s.sciencePoints = Math.max(0, s.sciencePoints + v)),
    health: (v) => (s.crewHealth = clamp(s.crewHealth + v, 0, 100)),
    morale: (v) => (s.crewMorale = clamp(s.crewMorale + v, 0, 100)),
    water: (v) => (s.waterLevel = clamp(s.waterLevel + v, 0, 100)),
    dose: (v) => (s.accumulatedDoseMSv = Math.max(0, s.accumulatedDoseMSv + v)),
    crops: (v) => (s.cropGrowthProgress = clamp(s.cropGrowthProgress + v, 0, 99))
  };
  for (const [k, v] of Object.entries(e) as [EffectKey, number][]) f[k]?.(v);
}

/** Resolve the pending decision card. */
export function resolveDecision(state: SimState, cardId: string, optionIndex: number): SimState {
  if (state.pendingDecision !== cardId) return state;
  const card = findCard(cardId);
  const opt = card?.options[optionIndex];
  if (!card || !opt) return state;
  const s: SimState = { ...state, modifiers: [...state.modifiers], decisions: [...state.decisions], pendingDecision: null };
  applyEffects(s, opt.effects);
  if (opt.modifier) s.modifiers.push({ ...opt.modifier, id: `${card.id}-${Date.now()}` });
  s.decisions.push({ sol: s.sol, cardId: card.id, title: card.title, icon: card.icon, choice: opt.label, lesson: opt.lesson });
  log(s, `Decision: ${card.title}. You chose "${opt.label}".`, 'info');
  return s;
}

/** Total electrical load right now, kW (allocations + extra loads). */
export function totalLoadKW(s: SimState): number {
  const a = s.powerAllocations;
  const evaKW = s.toggles.roverOnEVA ? POWER.evaKW : 0;
  const modKW = s.modifiers.reduce((t, m) => t + (m.loadKW ?? 0), 0);
  return a.eclss + a.shields + a.greenhouse + a.scienceLab + a.commsRover + evaKW + modKW;
}

/** Life support power needed right now, kW. */
export function eclssNeedKW(s: SimState): number {
  if (s.toggles.bunkerLockdown) return POWER.eclssBunkerKW;
  return POWER.eclssDayKW + (s.isDaylight ? 0 : POWER.eclssNightExtraKW[s.location]); // heaters at night
}

export function updateSimulationTick(state: SimState, dtSeconds = 1): SimState {
  if (state.paused || state.completed || state.failed || state.pendingDecision) return state;

  const s: SimState = {
    ...state,
    activeAlert: state.activeAlert ? { ...state.activeAlert } : null,
    unlockedBadges: [...state.unlockedBadges],
    modifiers: state.modifiers.map((m) => ({ ...m })),
    events: state.events.map((e) => ({ ...e })),
    history: state.history
  };
  const dtHour = dtSeconds * HOURS_PER_SECOND * s.speed;
  const prevAbs = s.absHours;

  // ---- time
  s.absHours += dtHour;
  s.hour += dtHour;
  if (s.hour >= 24) {
    s.sol += Math.floor(s.hour / 24);
    s.hour %= 24;
    s.foodStockpileSols = Math.max(0, Math.round((s.foodStockpileSols - 1) * 10) / 10);
    log(s, `Sol ${s.sol} begins. The crew ate one day of food.`);
  }
  s.sunAngleDeg = (s.hour / 24) * 360;
  s.isDaylight = s.hour >= 6 && s.hour <= 18;
  const daylight = s.isDaylight ? Math.sin(((s.hour - 6) / 12) * Math.PI) : 0;

  // ---- modifiers
  let solarMult = 1;
  let eclssMult = 1;
  for (const m of s.modifiers) {
    solarMult *= m.solarMult ?? 1;
    eclssMult *= m.eclssMult ?? 1;
    if (m.perHour) applyEffects(s, Object.fromEntries(Object.entries(m.perHour).map(([k, v]) => [k, v * dtHour])));
    m.hoursLeft -= dtHour;
  }
  const expired = s.modifiers.filter((m) => m.hoursLeft <= 0);
  if (expired.length) {
    s.modifiers = s.modifiers.filter((m) => m.hoursLeft > 0);
    for (const m of expired) log(s, `${m.label} has worn off.`);
  }

  // ---- power
  const dustLoss = s.location === 'moon' ? 0.02 : s.dustStormActive ? 0.8 : 0.05;
  s.solarOutputKW = s.solarPanelsDeployed ? Math.max(0, POWER.solarPeakKW[s.location] * daylight * (1 - dustLoss) * solarMult) : 0;
  const net = s.solarOutputKW + s.rtgNuclearOutputKW - totalLoadKW(s);
  s.batteryKWh = clamp(s.batteryKWh + net * dtHour, 0, s.batteryMaxKWh);
  const blackout = s.batteryKWh <= 0 && net < 0;
  if (blackout) s.blackoutHours += dtHour;

  // ---- air (life support)
  const eclssSuff = (blackout ? 0.2 : Math.min(1.2, s.powerAllocations.eclss / Math.max(1, eclssNeedKW(s)))) * eclssMult;
  if (eclssSuff < 0.8) {
    s.oxygenLevel = Math.max(0, s.oxygenLevel - 2 * (1 - eclssSuff) * dtHour);
    s.co2LevelPpm = Math.min(2500, s.co2LevelPpm + 80 * dtHour);
  } else {
    s.oxygenLevel = Math.min(100, s.oxygenLevel + 0.6 * dtHour); // scrubbers catch up
    s.co2LevelPpm = Math.max(390, s.co2LevelPpm - 50 * dtHour);
  }

  // ---- water
  if (s.toggles.waterRationing) {
    s.waterLevel = Math.max(10, s.waterLevel - 0.05 * dtHour);
    s.crewMorale = Math.max(20, s.crewMorale - 0.15 * dtHour);
  } else {
    s.waterLevel = Math.max(0, s.waterLevel - 0.12 * dtHour);
  }

  // ---- food
  const ghNeed = s.toggles.bunkerLockdown ? POWER.greenhouseBunkerKW : s.toggles.highYieldCropCycle ? POWER.greenhouseHighKW : POWER.greenhouseKW;
  const ghSuff = blackout ? 0.1 : Math.min(1.2, s.powerAllocations.greenhouse / ghNeed);
  if (!s.toggles.bunkerLockdown && ghSuff >= 0.8 && s.waterLevel > 15) {
    s.cropGrowthProgress += (s.toggles.highYieldCropCycle ? 1.8 : 1.0) * dtHour;
    s.cropHealth = Math.min(100, s.cropHealth + 0.1 * dtHour);
    if (s.cropGrowthProgress >= 100) {
      s.cropGrowthProgress = 0;
      s.foodStockpileSols += 2;
      s.harvests += 1;
      log(s, 'Automatic harvest! +2 Sols of fresh food.', 'success');
    }
  } else if (s.toggles.bunkerLockdown) {
    s.cropHealth = Math.max(0, s.cropHealth - 0.2 * dtHour); // nobody tending the plants
  } else {
    s.cropHealth = Math.max(0, s.cropHealth - 0.4 * dtHour);
  }
  if (s.toggles.bunkerLockdown) s.crewMorale = Math.max(20, s.crewMorale - 0.4 * dtHour); // cramped shelter

  // ---- radiation (real surface baselines; shielding factors are a game model)
  const alert = s.activeAlert;
  const stormOn = Boolean(alert && alert.impactHandled);
  const stormMult = stormOn ? (alert!.severity === 'critical' ? 40 : 15) : 1;
  const env = SURFACE_DOSE_MSV_PER_HOUR[s.location] * stormMult;
  let shield = s.toggles.roverOnEVA ? 1 : 0.5; // habitat walls block some
  if (s.toggles.bunkerLockdown) shield = 0.1;
  else if (s.toggles.magneticShieldActive && s.powerAllocations.shields >= POWER.deflectorKW) shield *= 0.3;
  s.radiationDoseRate = env * shield;
  s.accumulatedDoseMSv += s.radiationDoseRate * dtHour;
  if (s.radiationDoseRate > 0.5) {
    s.crewHealth = Math.max(0, s.crewHealth - s.radiationDoseRate * 0.8 * dtHour);
    s.crewMorale = Math.max(10, s.crewMorale - 0.3 * dtHour);
  } else if (s.oxygenLevel > 85 && s.foodStockpileSols > 1 && s.crewHealth < 100) {
    s.crewHealth = Math.min(100, s.crewHealth + 0.15 * dtHour);
  }
  if (s.foodStockpileSols <= 0) s.crewHealth = Math.max(0, s.crewHealth - 1.2 * dtHour);

  // ---- science: lab power buys research, the rover buys more
  if (!blackout && !s.toggles.bunkerLockdown) {
    let rate = s.powerAllocations.scienceLab * SCIENCE.perLabKWh;
    if (s.toggles.roverOnEVA) {
      rate += SCIENCE.evaPerHour;
      if (stormOn || s.dustStormActive) s.crewHealth = Math.max(0, s.crewHealth - 0.5 * dtHour);
    }
    s.sciencePoints += rate * dtHour * (s.crewMorale < 40 ? 0.6 : 1);
  }

  // ---- storms: countdown (real seconds), impact, all-clear
  if (alert && !alert.impactHandled) {
    alert.countdownSec = Math.max(0, alert.countdownSec - dtSeconds);
    if (alert.countdownSec <= 0) {
      alert.impactHandled = true;
      alert.stormHoursLeft = STORM_HOURS;
      const safe = s.toggles.bunkerLockdown || (s.toggles.magneticShieldActive && s.powerAllocations.shields >= POWER.deflectorKW);
      if (safe) {
        s.stormsSurvived += 1;
        log(s, 'The solar storm hit, and your shielding protected the crew!', 'success');
        if (!s.unlockedBadges.includes('badge_solar_survivor')) s.unlockedBadges.push('badge_solar_survivor');
      } else {
        s.stormsHit += 1;
        s.crewHealth = Math.max(15, s.crewHealth - (alert.severity === 'critical' ? 35 : 18));
        log(s, 'The solar storm hit an unshielded crew. They absorbed a big radiation dose.', 'danger');
      }
    }
  } else if (alert && alert.impactHandled) {
    alert.stormHoursLeft = (alert.stormHoursLeft ?? STORM_HOURS) - dtHour;
    if (alert.stormHoursLeft <= 0) {
      s.activeAlert = null;
      log(s, 'All clear: radiation is back to normal. It is safe to leave the bunker.', 'success');
    }
  }

  // ---- scheduled events
  for (const ev of s.events) {
    if (ev.done || ev.atHour > s.absHours) continue;
    if (ev.kind === 'storm') {
      if (s.activeAlert) continue;
      ev.done = true;
      const date = ev.ref.split('|')[0];
      const basis = s.stormBasis.find((b) => b.date === date) ?? archiveBasis().find((b) => b.date === date) ?? archiveBasis()[0];
      s.activeAlert = makeAlert(basis, basis.hazard === 'Critical' ? 40 : 55);
      s.speed = 1; // give the crew the full real-time warning
      log(s, `Space weather alert! Modelled on a real event: ${basis.label} (${basis.date}).`, 'warning');
      break;
    }
    if (s.activeAlert || s.pendingDecision) continue;
    ev.done = true;
    s.pendingDecision = ev.ref;
    break;
  }

  // ---- history (once per game hour)
  if (Math.floor(s.absHours) > Math.floor(prevAbs) || s.history.length === 0) {
    s.history = [
      ...s.history,
      {
        t: Math.round(s.absHours * 10) / 10,
        battery: Math.round((s.batteryKWh / s.batteryMaxKWh) * 100),
        oxygen: Math.round(s.oxygenLevel),
        food: s.foodStockpileSols,
        dose: Math.round(s.accumulatedDoseMSv * 100) / 100,
        health: Math.round(s.crewHealth),
        science: Math.round(s.sciencePoints)
      }
    ].slice(-240);
  }

  // ---- failure
  if (s.oxygenLevel <= 15) {
    s.failed = true;
    s.failureReason = 'The air ran out. Life support did not get enough power to make oxygen.';
  } else if (s.crewHealth <= 10) {
    s.failed = true;
    s.failureReason = 'The crew got too sick to work. Radiation, hunger or stress added up.';
  } else if (s.foodStockpileSols <= 0 && s.cropHealth <= 10) {
    s.failed = true;
    s.failureReason = 'The food ran out and the greenhouse plants died.';
  }

  // ---- mission end (midnight closing the last sol), graded on every goal
  if (!s.failed && s.sol > s.goal.targetSols) {
    const g = s.goal;
    const batt = (s.batteryKWh / s.batteryMaxKWh) * 100;
    const missed: string[] = [];
    if (s.oxygenLevel < g.minO2) missed.push(`Oxygen ${Math.round(s.oxygenLevel)}% (needed ${g.minO2}%)`);
    if (batt < g.minBattery) missed.push(`Battery ${Math.round(batt)}% (needed ${g.minBattery}%)`);
    if (s.sciencePoints < g.scienceTarget) missed.push(`Science ${Math.round(s.sciencePoints)} (needed ${g.scienceTarget})`);
    if (s.crewHealth < g.minHealth) missed.push(`Crew health ${Math.round(s.crewHealth)}% (needed ${g.minHealth}%)`);
    if (s.foodStockpileSols < g.minFoodDays) missed.push(`Food ${s.foodStockpileSols} sols left (needed ${g.minFoodDays})`);
    s.missedGoals = missed;
    if (missed.length) {
      s.failed = true;
      s.failureReason = `Your crew survived ${g.targetSols} sols, but missed a goal: ${missed.join(', ')}.`;
    } else {
      s.completed = true;
      if (!s.unlockedBadges.includes('badge_flight_director')) s.unlockedBadges.push('badge_flight_director');
      if (s.blackoutHours === 0 && !s.unlockedBadges.includes('badge_power_master')) s.unlockedBadges.push('badge_power_master');
      if (s.harvests >= 1 && !s.unlockedBadges.includes('badge_botanist')) s.unlockedBadges.push('badge_botanist');
    }
  }

  return s;
}
