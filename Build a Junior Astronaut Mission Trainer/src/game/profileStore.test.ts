import { beforeEach, describe, expect, it } from 'vitest';

// Minimal localStorage so the store runs under Node, and survives a "reload" (module re-import).
const mem = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k)
  }
};

const store = await import('./profileStore');
const { isValidAction, applyAction } = await import('./actions');
const { createInitialSimulationState } = await import('../utils/simulationEngine');
const { missionScore } = await import('./simBridge');

beforeEach(() => mem.clear());

describe('profile store', () => {
  it('creates a pilot without asking for a real name', () => {
    const p = store.createPilot('StarHopper', 'cadet');
    expect(p).not.toHaveProperty('fullName');
    expect(store.loadActivePilot()?.callsign).toBe('StarHopper');
  });

  it('unlocks missions in order, and the sandbox after the campaign', () => {
    let p = store.createPilot('A', 'cadet');
    expect(store.isMissionUnlocked(p, 'mission-1')).toBe(true);
    expect(store.isMissionUnlocked(p, 'mission-2')).toBe(false);
    for (const id of store.MISSION_ORDER) {
      expect(store.isMissionUnlocked(p, id)).toBe(true);
      p = store.recordMissionComplete(p, id, { bestScore: 100, sols: 3, badges: [] });
    }
    expect(store.isMissionUnlocked(p, store.SANDBOX_ID)).toBe(true);
  });

  it('keeps the best score and merges badges on retry', () => {
    let p = store.createPilot('B', 'director');
    p = store.recordMissionComplete(p, 'mission-1', { bestScore: 900, sols: 3, badges: ['badge_solar_survivor'] });
    p = store.recordMissionComplete(p, 'mission-1', { bestScore: 500, sols: 3, badges: ['badge_power_master'] });
    expect(p.completed['mission-1'].bestScore).toBe(900);
    expect(store.allBadges(p).sort()).toEqual(['badge_power_master', 'badge_solar_survivor']);
  });

  it('progress persists across a reload', () => {
    const p = store.recordMissionComplete(store.createPilot('C', 'cadet'), 'mission-1', { bestScore: 1, sols: 3, badges: [] });
    const reloaded = store.loadPilots().find((x) => x.id === p.id)!;
    expect(reloaded.completed['mission-1']).toBeTruthy();
    expect(store.loadActivePilot()?.id).toBe(p.id);
  });

  it('survives corrupted storage', () => {
    mem.set('outpost-commander.pilots.v1', '{not json');
    expect(store.loadPilots()).toEqual([]);
  });

  it('rejects duplicate callsigns case-insensitively', () => {
    store.createPilot('Nova', 'cadet');
    expect(store.callsignTaken('nova ')).toBe(true);
  });
});

describe('actions', () => {
  it('validates network actions', () => {
    expect(isValidAction({ type: 'alloc', key: 'eclss', value: 20 })).toBe(true);
    expect(isValidAction({ type: 'alloc', key: 'constructor', value: 20 })).toBe(false);
    expect(isValidAction({ type: 'speed', value: 20 })).toBe(false);
    expect(isValidAction({ type: 'decide', card: 'ridge-sample', option: 1 })).toBe(true);
    expect(isValidAction({ type: 'decide', card: 'ridge-sample', option: 2 })).toBe(false);
    expect(isValidAction({ type: 'decide', card: 'not-a-card', option: 0 })).toBe(false);
  });

  it('clamps power allocations', () => {
    const s = createInitialSimulationState(null, 'moon');
    expect(applyAction(s, { type: 'alloc', key: 'eclss', value: 999 }).powerAllocations.eclss).toBe(50);
    expect(applyAction(s, { type: 'alloc', key: 'eclss', value: -5 }).powerAllocations.eclss).toBe(0);
  });

  it('logs crewmate actions by name', () => {
    const s = applyAction(createInitialSimulationState(null, 'moon'), { type: 'bunker' }, 'Lee');
    expect(s.logs[0].text).toContain('Lee sealed the crew in the bunker');
  });

  it('cannot go on EVA while sealed in the bunker', () => {
    const s = applyAction(createInitialSimulationState(null, 'moon'), { type: 'bunker' });
    expect(applyAction(s, { type: 'eva' })).toBe(s);
  });

  it('score rewards science, health and morale and is never negative', () => {
    expect(missionScore({ sciencePoints: 10, crewHealth: 100, crewMorale: 50 })).toBe(100 + 500 + 150);
    expect(missionScore({ sciencePoints: -100, crewHealth: 0, crewMorale: 0 })).toBe(0);
  });
});
