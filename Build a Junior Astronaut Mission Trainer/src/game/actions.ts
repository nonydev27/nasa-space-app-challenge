// Every player-initiated change to the simulation, as data. Solo play and the
// multiplayer host both run actions through `applyAction`, so a crewmate's button
// press over the network behaves exactly like a local one. The relay
// (server/protocol.js) validates the same shapes before forwarding.

import { findCard } from './decisions';
import { POWER, resolveDecision, SPEEDS } from '../utils/simulationEngine';
import type { SimState } from './simBridge';

export type AllocKey = 'eclss' | 'shields' | 'greenhouse' | 'scienceLab' | 'commsRover';

export type SimAction =
  | { type: 'pause' }
  | { type: 'speed'; value: number }
  | { type: 'alloc'; key: AllocKey; value: number }
  | { type: 'shield' }
  | { type: 'bunker' }
  | { type: 'ration' }
  | { type: 'crops' }
  | { type: 'eva' }
  | { type: 'harvest' }
  | { type: 'decide'; card: string; option: number };

// Mirrors the slider ranges in PowerMatrix.jsx
export const ALLOC_MAX: Record<AllocKey, number> = { eclss: 50, shields: 60, greenhouse: 40, scienceLab: 40, commsRover: 30 };

/** Host-only controls: crewmates can't pause or warp time for everyone. */
export const HOST_ONLY: ReadonlyArray<SimAction['type']> = ['pause', 'speed'];

const DESCRIBE: Record<SimAction['type'], (s: SimState) => string> = {
  pause: (s) => (s.paused ? 'paused the clock' : 'resumed the clock'),
  speed: () => 'changed time warp',
  alloc: () => 'rerouted power',
  shield: (s) => (s.toggles.magneticShieldActive ? 'raised the magnetic deflector' : 'lowered the magnetic deflector'),
  bunker: (s) => (s.toggles.bunkerLockdown ? 'sealed the crew in the bunker' : 'opened the bunker'),
  ration: (s) => (s.toggles.waterRationing ? 'started water rationing' : 'ended water rationing'),
  crops: (s) => (s.toggles.highYieldCropCycle ? 'switched crops to high-yield' : 'switched crops to normal cycle'),
  eva: (s) => (s.toggles.roverOnEVA ? 'sent the rover outside' : 'brought the rover back'),
  harvest: () => 'harvested the greenhouse (+2 Sols food)',
  decide: (s) => `made the call: "${s.decisions.at(-1)?.choice ?? ''}"`
};

/** Reject anything malformed (actions can arrive from the network). */
export function isValidAction(a: unknown): a is SimAction {
  if (!a || typeof a !== 'object') return false;
  const x = a as Record<string, unknown>;
  switch (x.type) {
    case 'pause': case 'shield': case 'bunker': case 'ration': case 'crops': case 'eva': case 'harvest':
      return true;
    case 'speed':
      return (SPEEDS as readonly number[]).includes(x.value as number);
    case 'alloc':
      return typeof x.key === 'string' && Object.hasOwn(ALLOC_MAX, x.key) && typeof x.value === 'number' && Number.isFinite(x.value);
    case 'decide': {
      const card = typeof x.card === 'string' ? findCard(x.card) : undefined;
      return Boolean(card) && Number.isInteger(x.option) && (x.option as number) >= 0 && (x.option as number) < card!.options.length;
    }
    default:
      return false;
  }
}

export function applyAction(s: SimState, a: SimAction, actor?: string): SimState {
  let next: SimState;
  switch (a.type) {
    case 'pause':
      next = { ...s, paused: !s.paused };
      break;
    case 'speed':
      next = { ...s, speed: a.value, paused: false };
      break;
    case 'alloc': {
      const value = Math.max(0, Math.min(ALLOC_MAX[a.key], Math.round(a.value)));
      next = { ...s, powerAllocations: { ...s.powerAllocations, [a.key]: value } };
      break;
    }
    case 'shield': {
      const on = !s.toggles.magneticShieldActive;
      next = {
        ...s,
        toggles: { ...s.toggles, magneticShieldActive: on },
        powerAllocations: { ...s.powerAllocations, shields: on ? Math.max(POWER.deflectorKW, s.powerAllocations.shields) : Math.min(5, s.powerAllocations.shields) }
      };
      break;
    }
    case 'bunker': {
      const locked = !s.toggles.bunkerLockdown;
      next = { ...s, toggles: { ...s.toggles, bunkerLockdown: locked, roverOnEVA: locked ? false : s.toggles.roverOnEVA } };
      break;
    }
    case 'ration':
      next = { ...s, toggles: { ...s.toggles, waterRationing: !s.toggles.waterRationing } };
      break;
    case 'crops':
      next = { ...s, toggles: { ...s.toggles, highYieldCropCycle: !s.toggles.highYieldCropCycle } };
      break;
    case 'eva':
      if (s.toggles.bunkerLockdown) return s;
      next = { ...s, toggles: { ...s.toggles, roverOnEVA: !s.toggles.roverOnEVA } };
      break;
    case 'harvest':
      if (s.cropGrowthProgress < 70) return s;
      next = { ...s, foodStockpileSols: s.foodStockpileSols + 2, cropGrowthProgress: 0, harvests: s.harvests + 1 };
      break;
    case 'decide':
      next = resolveDecision(s, a.card, a.option);
      if (next === s) return s;
      break;
  }
  if (actor && a.type !== 'alloc') {
    const hour = `${Math.floor(next.hour).toString().padStart(2, '0')}:${Math.floor((next.hour % 1) * 60).toString().padStart(2, '0')}`;
    next = { ...next, logs: [{ id: Date.now() + Math.random(), sol: next.sol, hour, text: `[CREW] ${actor} ${DESCRIBE[a.type](next)}.`, type: 'info' as const }, ...next.logs.slice(0, 40)] };
  }
  return next;
}
