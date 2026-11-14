import { describe, expect, it } from 'vitest';
import { MISSION_CAMPAIGNS } from './nasaData';
import { archiveBasis, createInitialSimulationState, eclssNeedKW, planMission, updateSimulationTick, type SimState, type SpaceWeatherInput } from './simulationEngine';
import { applyAction, type SimAction } from '../game/actions';
import { DECISION_DECK, validateDeck } from '../game/decisions';
import { SURFACE_DOSE_MSV_PER_HOUR } from '../data/nasaFacts';

const WEATHER: Record<'low' | 'moderate' | 'high', SpaceWeatherInput> = {
  low: { risk: 'low', live: false, basis: archiveBasis() },
  moderate: { risk: 'moderate', live: false, basis: archiveBasis() },
  high: { risk: 'high', live: false, basis: archiveBasis() }
};

type Bot = (s: SimState) => SimAction[];

/** A careful player: shelters from storms, feeds life support first, does science when it is safe. */
const attentive = (s: SimState): SimAction[] => {
  const out: SimAction[] = [];
  const set = (key: 'eclss' | 'shields' | 'greenhouse' | 'scienceLab' | 'commsRover', v: number) => { if (s.powerAllocations[key] !== v) out.push({ type: 'alloc', key, value: v }); };
  if (s.pendingDecision) out.push({ type: 'decide', card: s.pendingDecision, option: 0 });
  const storm = Boolean(s.activeAlert);
  if (storm !== s.toggles.bunkerLockdown) out.push({ type: 'bunker' });
  const batt = (s.batteryKWh / s.batteryMaxKWh) * 100;
  set('eclss', eclssNeedKW(s) + 2);
  set('shields', 0);
  set('commsRover', batt < 30 ? 0 : 3);
  const hungry = s.foodStockpileSols < 4;
  if (hungry !== s.toggles.highYieldCropCycle && batt > 25) out.push({ type: 'crops' });
  set('greenhouse', batt < 20 ? 3 : s.toggles.highYieldCropCycle ? 18 : 10);
  set('scienceLab', !s.isDaylight ? (batt > 85 ? 10 : 0) : batt > 60 ? 20 : batt > 40 ? 8 : 0);
  const evaOk = !storm && !s.dustStormActive && batt > 55 && s.isDaylight && !s.toggles.bunkerLockdown;
  const evaDust = s.dustStormActive && s.isDaylight && !storm && batt > 35 && s.crewHealth > 85 && s.sciencePoints < s.goal.scienceTarget + 3;
  if ((evaOk || evaDust) !== s.toggles.roverOnEVA) out.push({ type: 'eva' });
  if (s.cropGrowthProgress >= 70) out.push({ type: 'harvest' });
  return out;
};

/** Never touches anything; picks the "easy" option on every card. */
const handsOff: Bot = (s) => (s.pendingDecision ? [{ type: 'decide', card: s.pendingDecision, option: 1 }] : []);

function run(missionId: string, bot: Bot, weather: SpaceWeatherInput, seed: number, speed = 4) {
  const m = MISSION_CAMPAIGNS.find((x) => x.id === missionId)!;
  let s = createInitialSimulationState(m, m.location, 'cadet', weather, seed);
  s = { ...s, speed };
  for (let i = 0; i < 20000 && !s.completed && !s.failed; i++) {
    for (const a of bot(s)) s = applyAction(s, a);
    s = updateSimulationTick(s, 1);
  }
  return s;
}

describe('decision deck', () => {
  it('has no free choices: every option has a gain and a cost', () => expect(validateDeck()).toEqual([]));
  it('every card cites a source', () => {
    for (const c of DECISION_DECK) expect(c.fact.source.url).toMatch(/^https:\/\//);
  });
});

describe('mission balance', () => {
  for (const m of MISSION_CAMPAIGNS) {
    it(`${m.id}: an attentive player can win in every space-weather condition`, () => {
      for (const w of Object.values(WEATHER)) {
        for (const seed of [1, 2, 3, 42, 99]) {
          const s = run(m.id, attentive, w, seed);
          expect({ seed, risk: w.risk, ok: s.completed, why: s.failureReason }).toEqual({ seed, risk: w.risk, ok: true, why: '' });
        }
      }
    });
  }

  it('a hands-off player fails most missions (choices matter)', () => {
    const results = MISSION_CAMPAIGNS.map((m) => run(m.id, handsOff, WEATHER.moderate, 7).completed);
    expect(results.filter(Boolean).length).toBeLessThanOrEqual(1);
  });
});

describe('engine rules', () => {
  const base = (): SimState => {
    const s = createInitialSimulationState(MISSION_CAMPAIGNS[0], 'moon', 'cadet', WEATHER.low, 5);
    return { ...s, powerAllocations: { ...s.powerAllocations, scienceLab: 10 } };
  };

  it('uses the published surface radiation baseline (Moon 1.37 mSv/day)', () => {
    let s = base();
    s = { ...s, events: [] };
    s = updateSimulationTick(s, 1);
    expect(s.radiationDoseRate).toBeCloseTo(SURFACE_DOSE_MSV_PER_HOUR.moon * 0.5, 5);
    expect(SURFACE_DOSE_MSV_PER_HOUR.moon * 24).toBeCloseTo(1.37, 5);
  });

  it('going outside (EVA) costs power and radiation but earns science', () => {
    const quiet = { ...base(), events: [] };
    const inside = updateSimulationTick(quiet, 6);
    const outside = updateSimulationTick(applyAction(quiet, { type: 'eva' }), 6);
    expect(outside.sciencePoints).toBeGreaterThan(inside.sciencePoints);
    expect(outside.batteryKWh).toBeLessThan(inside.batteryKWh);
    expect(outside.accumulatedDoseMSv).toBeGreaterThan(inside.accumulatedDoseMSv);
  });

  it('the bunker blocks radiation but stops science and lowers morale', () => {
    const quiet = { ...base(), events: [] };
    const open = updateSimulationTick(quiet, 6);
    const sealed = updateSimulationTick(applyAction(quiet, { type: 'bunker' }), 6);
    expect(sealed.radiationDoseRate).toBeLessThan(open.radiationDoseRate);
    expect(sealed.sciencePoints).toBeLessThan(open.sciencePoints);
    expect(sealed.crewMorale).toBeLessThan(open.crewMorale);
  });

  it('turning the deflector off releases its power', () => {
    const on = applyAction(base(), { type: 'shield' });
    expect(on.powerAllocations.shields).toBeGreaterThanOrEqual(30);
    expect(applyAction(on, { type: 'shield' }).powerAllocations.shields).toBeLessThanOrEqual(5);
  });

  it('starving life support of power drains oxygen', () => {
    let s = applyAction({ ...base(), events: [] }, { type: 'alloc', key: 'eclss', value: 0 });
    for (let i = 0; i < 30; i++) s = updateSimulationTick(s, 1);
    expect(s.oxygenLevel).toBeLessThan(90);
  });

  it('pauses on a decision card until the crew chooses', () => {
    let s: SimState = { ...base(), events: [{ atHour: 0, kind: 'card', ref: 'ridge-sample', done: false }] };
    s = updateSimulationTick(s, 1);
    expect(s.pendingDecision).toBe('ridge-sample');
    const frozen = updateSimulationTick(s, 5);
    expect(frozen).toBe(s);
    const after = applyAction(s, { type: 'decide', card: 'ridge-sample', option: 0 });
    expect(after.pendingDecision).toBeNull();
    expect(after.decisions.at(-1)).toMatchObject({ cardId: 'ridge-sample', choice: 'Go get it' });
    expect(applyAction(after, { type: 'decide', card: 'ridge-sample', option: 0 })).toBe(after); // no double-apply
  });

  it('storms hurt an unshielded crew and award a badge to a shielded one', () => {
    const storm = (shield: boolean) => {
      let s = createInitialSimulationState(MISSION_CAMPAIGNS[2], 'moon', 'cadet', WEATHER.low, 3);
      s = { ...s, events: [] };
      if (shield) s = applyAction(s, { type: 'bunker' });
      for (let i = 0; i < 60; i++) s = updateSimulationTick(s, 1);
      return s;
    };
    const unsafe = storm(false);
    const safe = storm(true);
    expect(unsafe.stormsHit).toBe(1);
    expect(unsafe.crewHealth).toBeLessThan(safe.crewHealth);
    expect(safe.unlockedBadges).toContain('badge_solar_survivor');
  });

  it('plans differ between runs (replayability) and scale with real storm risk', () => {
    const a = planMission('mission-4', 'mars', 5, WEATHER.moderate, 1).map((e) => e.ref).join();
    const b = planMission('mission-4', 'mars', 5, WEATHER.moderate, 2).map((e) => e.ref).join();
    expect(a).not.toEqual(b);
    const storms = (w: SpaceWeatherInput) => [1, 2, 3, 4, 5, 6, 7, 8].reduce((n, seed) => n + planMission('mission-4', 'mars', 5, w, seed).filter((e) => e.kind === 'storm').length, 0);
    expect(storms(WEATHER.high)).toBeGreaterThan(storms(WEATHER.low));
  });

  it('mission 5 forces the air-scrubber card and mission 1 the lunar-night card', () => {
    expect(planMission('mission-5', 'mars', 5, WEATHER.low, 1).some((e) => e.ref === 'scrubber-fault')).toBe(true);
    expect(planMission('mission-1', 'moon', 3, WEATHER.low, 1).some((e) => e.ref === 'night-prep')).toBe(true);
  });

  it('reports which goals were missed', () => {
    let s = createInitialSimulationState(MISSION_CAMPAIGNS[0], 'moon', 'cadet', WEATHER.low, 1);
    s = { ...s, events: [], sciencePoints: 0, sol: s.goal.targetSols, hour: 23.99, powerAllocations: { ...s.powerAllocations, scienceLab: 0 } };
    s = updateSimulationTick(s, 1);
    expect(s.failed).toBe(true);
    expect(s.missedGoals.join()).toMatch(/Science/);
  });

  it('records history for the debrief chart', () => {
    let s: SimState = { ...base(), events: [], speed: 4 };
    for (let i = 0; i < 30; i++) s = updateSimulationTick(s, 1);
    expect(s.history.length).toBeGreaterThan(15);
    expect(s.history[0]).toHaveProperty('battery');
  });
});
