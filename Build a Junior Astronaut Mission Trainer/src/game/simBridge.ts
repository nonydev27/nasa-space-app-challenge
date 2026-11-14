import type { SimState as EngineState } from '../utils/simulationEngine';
import type { Location, SceneEffects, SceneViewState } from './types';

export type SimState = EngineState;

/** Project the simulation into the flat state the 3D scene renders, applying story overrides. */
export function toSceneView(sim: SimState, fx?: SceneEffects): SceneViewState {
  const dust = fx?.dust ?? sim.dustStormActive;
  return {
    location: sim.location as Location,
    hour: fx?.hour ?? sim.hour,
    dust,
    dustTau: dust ? Math.max(sim.dustOpticalDepthTau, 3.8) : sim.dustOpticalDepthTau,
    flare: fx?.flare ?? sim.activeAlert?.source === 'DONKI',
    shield: fx?.shield ?? sim.toggles.magneticShieldActive,
    bunker: fx?.bunker ?? sim.toggles.bunkerLockdown,
    eva: fx?.eva ?? sim.toggles.roverOnEVA,
    solarKW: sim.solarOutputKW,
    rtgKW: sim.rtgNuclearOutputKW,
    batteryPct: (sim.batteryKWh / sim.batteryMaxKWh) * 100,
    oxygen: sim.oxygenLevel,
    cropGrowth: sim.cropGrowthProgress,
    cropHealth: sim.cropHealth,
    greenhouseKW: sim.powerAllocations.greenhouse,
    crewHealth: sim.crewHealth
  };
}

/** Science counts most, then keeping the crew healthy and happy. Never negative. */
export function missionScore(sim: Pick<SimState, 'sciencePoints' | 'crewHealth' | 'crewMorale'>): number {
  return Math.max(0, Math.round(sim.sciencePoints * 10) + Math.round(sim.crewHealth * 5) + Math.round(sim.crewMorale * 3));
}
