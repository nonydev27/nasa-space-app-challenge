// Simulation Engine for Junior Astronaut Mission Trainer
// Models multi-variable trade-offs: Power, ECLSS, Radiation Shielding, Food, and Comms

export function createInitialSimulationState(missionConfig, location = 'moon', mode = 'cadet') {
  const isMars = location === 'mars';
  const init = missionConfig?.initialState || {};

  return {
    location,
    mode, // 'cadet' (simplified/guided) or 'director' (full telemetry)
    sol: 1,
    hour: 8, // 0 to 23.9
    paused: false,
    speed: 1, // 1x, 3x, 5x
    
    // Environment & Sun Angle
    isDaylight: true,
    sunAngleDeg: 45, // 0 to 180 (day), 180 to 360 (night)
    dustStormActive: init.activeDustStorm ?? false,
    dustOpticalDepthTau: isMars ? (init.activeDustStorm ? 3.8 : 0.6) : 0,
    solarIrradianceFlux: isMars ? 590 : 1361, // W/m^2 solar constant
    
    // Power Generation & Storage
    solarPanelsDeployed: true,
    solarOutputKW: 60,
    rtgNuclearOutputKW: isMars ? 40 : 25, // RTG baseload
    batteryKWh: init.batteryKWh ?? 80,
    batteryMaxKWh: init.batteryMaxKWh ?? 100,
    
    // Power Allocation Matrix (kW allocated to each subsystem)
    powerAllocations: {
      eclss: 30, // Life support & heaters
      shields: 15, // Active deflector / sensors
      greenhouse: 15, // LED grow lights & water pumps
      scienceLab: 10, // Experiments & drills
      commsRover: 5 // Transceiver & rover charging
    },

    // Subsystem States
    toggles: {
      magneticShieldActive: false,
      bunkerLockdown: false,
      waterRationing: false,
      highYieldCropCycle: false,
      roverOnEVA: false,
      autonomousMode: false
    },

    // Core Vitals
    oxygenLevel: init.oxygenLevel ?? 95, // %
    co2LevelPpm: 420, // 400 normal, >1000 hazardous
    waterLevel: init.waterLevel ?? 88, // %
    foodStockpileSols: init.foodStockpileSols ?? 7, // Sols of rations
    cropGrowthProgress: 40, // 0 - 100%
    cropHealth: 90, // %

    // Radiation & Crew Health
    radiationDoseRate: 0.08, // mSv / hour
    accumulatedDoseMSv: 0.5,
    shieldIntegrity: init.radiationShielding ?? 70, // %
    crewHealth: init.crewHealth ?? 100, // %
    crewMorale: init.crewMorale ?? 88, // %
    sciencePoints: init.sciencePoints ?? 0,

    // Active space weather alerts (DONKI)
    activeAlert: init.incomingSolarFlare
      ? {
          id: "DONKI-X9-2024",
          source: "DONKI",
          severity: "critical",
          title: "DONKI Alert: Extreme X9.3 Solar Flare Detected!",
          message: "A coronal mass ejection traveling at 2,150 km/s will impact in 45 seconds. Evacuate crew or boost shields immediately!",
          countdownSec: 45,
          impactHandled: false
        }
      : null,

    // Crew Roster
    crew: [
      { name: "Maya", role: "Commander", status: "Active in Hab", avatar: "👩‍🚀" },
      { name: "Leo", role: "Systems Engineer", status: "Monitoring Grid", avatar: "👨‍🚀" },
      { name: "Zara", role: "Flight Surgeon", status: "Checking Vitals", avatar: "👩‍⚕️" },
      { name: "Kai", role: "Astro-Botanist", status: "Tending Crops", avatar: "🧑‍🌾" }
    ],

    // Telemetry log history
    logs: [
      { id: 1, sol: 1, hour: "08:00", text: "Systems online. All ECLSS and power circuits nominal.", type: "info" }
    ],

    // Game Completion status
    completed: false,
    failed: false,
    failureReason: "",
    unlockedBadges: []
  };
}

export function updateSimulationTick(state, dtSeconds = 1) {
  if (state.paused || state.completed || state.failed) {
    return state;
  }

  const s = { ...state };
  const dtHour = (dtSeconds / 60) * s.speed; // scaled game time

  // Advance time
  s.hour += dtHour;
  if (s.hour >= 24) {
    s.sol += Math.floor(s.hour / 24);
    s.hour = s.hour % 24;
    // Consume daily food ration
    s.foodStockpileSols = Math.max(0, s.foodStockpileSols - 1);
    s.logs = [
      { id: Date.now(), sol: s.sol, hour: "00:00", text: `Sol ${s.sol} started. Daily food rations consumed.`, type: "info" },
      ...s.logs.slice(0, 30)
    ];
  }

  // Calculate Sun Angle & Daylight
  // 0h = midnight, 6h = sunrise, 12h = noon, 18h = sunset
  const sunPos = (s.hour / 24) * 360;
  s.sunAngleDeg = sunPos;
  s.isDaylight = s.hour >= 6 && s.hour <= 18;
  const daylightFactor = s.isDaylight ? Math.sin(((s.hour - 6) / 12) * Math.PI) : 0;

  // Solar generation with dust attenuation
  let dustLoss = s.dustStormActive ? 0.8 : 0.05;
  if (s.location === 'moon') dustLoss = 0.02; // Moon has no atmospheric dust storms
  const baseSolarKW = s.location === 'moon' ? 95 : 65;
  s.solarOutputKW = s.solarPanelsDeployed ? Math.max(0, baseSolarKW * daylightFactor * (1 - dustLoss)) : 0;

  // Total generation = Solar + RTG Nuclear
  const totalGenKW = s.solarOutputKW + s.rtgNuclearOutputKW;

  // Power Consumption
  let eclssPowerReq = s.toggles.bunkerLockdown ? 18 : 28;
  if (!s.isDaylight && s.location === 'moon') {
    eclssPowerReq += 15; // Cryogenic night heating
  }

  let shieldPowerReq = 0;
  if (s.toggles.magneticShieldActive) shieldPowerReq += 45;
  if (s.toggles.bunkerLockdown) shieldPowerReq += 10;

  let greenhousePowerReq = s.toggles.highYieldCropCycle ? 28 : 16;
  if (s.toggles.bunkerLockdown) greenhousePowerReq = 5; // Minimal standby

  let labPowerReq = s.powerAllocations.scienceLab;
  let commsPowerReq = s.powerAllocations.commsRover;
  if (s.toggles.roverOnEVA) commsPowerReq += 12;

  const totalConsKW =
    s.powerAllocations.eclss +
    s.powerAllocations.shields +
    s.powerAllocations.greenhouse +
    s.powerAllocations.scienceLab +
    s.powerAllocations.commsRover;

  // Battery charging / draining
  const netPowerKW = totalGenKW - totalConsKW;
  const batteryDelta = (netPowerKW * dtHour);
  s.batteryKWh = Math.min(s.batteryMaxKWh, Math.max(0, s.batteryKWh + batteryDelta));

  // Check Power Deficit
  const isPowerBlackout = s.batteryKWh <= 0 && netPowerKW < 0;

  // --- ECLSS & Life Support calculations ---
  const eclssSufficiency = isPowerBlackout ? 0.2 : Math.min(1.2, s.powerAllocations.eclss / Math.max(1, eclssPowerReq));
  if (eclssSufficiency < 0.8) {
    // Air scrubbers struggling
    s.oxygenLevel = Math.max(0, s.oxygenLevel - (0.4 * (1 - eclssSufficiency) * dtHour * 5));
    s.co2LevelPpm = Math.min(2500, s.co2LevelPpm + (80 * dtHour));
  } else {
    // Air scrubbers healthy
    s.oxygenLevel = Math.min(100, s.oxygenLevel + (0.2 * dtHour));
    s.co2LevelPpm = Math.max(390, s.co2LevelPpm - (50 * dtHour));
  }

  // Water Recycling Loop
  if (s.toggles.waterRationing) {
    s.waterLevel = Math.max(10, s.waterLevel - (0.05 * dtHour));
    s.crewMorale = Math.max(30, s.crewMorale - (0.1 * dtHour));
  } else {
    s.waterLevel = Math.max(0, s.waterLevel - (0.12 * dtHour));
  }

  // --- Hydroponics / Food Bay (OSDR Model) ---
  const greenhouseSufficiency = isPowerBlackout ? 0.1 : Math.min(1.2, s.powerAllocations.greenhouse / Math.max(1, greenhousePowerReq));
  if (greenhouseSufficiency >= 0.8 && s.waterLevel > 15) {
    const growthRate = s.toggles.highYieldCropCycle ? 1.8 : 1.0;
    s.cropGrowthProgress += growthRate * dtHour;
    s.cropHealth = Math.min(100, s.cropHealth + 0.1 * dtHour);

    if (s.cropGrowthProgress >= 100) {
      s.cropGrowthProgress = 0;
      s.foodStockpileSols += 2; // Harvest!
      s.logs = [
        { id: Date.now(), sol: s.sol, hour: formatHour(s.hour), text: "Hydroponic harvest complete! +2 Sols of fresh space crops added.", type: "success" },
        ...s.logs.slice(0, 30)
      ];
    }
  } else {
    s.cropHealth = Math.max(0, s.cropHealth - 0.4 * dtHour);
  }

  // --- Radiation & Space Weather (DONKI + RadLab calibration) ---
  // Baseline dose rates calibrated against real ISS dosimeter measurements in
  // NASA's RadLab database (~0.9-1.2 mSv/day crew average ≈ 0.04 mSv/hr); the
  // lunar surface (no magnetosphere) runs higher, Mars' thin atmosphere a bit
  // lower. See RADLAB_MEASUREMENTS in nasaData.js.
  let envRadiationRate = s.location === 'moon' ? 0.07 : 0.045; // mSv/hr calibrated baseline
  if (s.activeAlert && s.activeAlert.source === 'DONKI') {
    // SEP event spike — Matroshka phantom torso EVA benchmark (~2.1 mSv/day)
    envRadiationRate *= 12; // Massive solar flare spike!
  }

  // Shield attenuation
  let shieldFactor = 1.0;
  if (s.toggles.bunkerLockdown) shieldFactor *= 0.1; // Regolith absorbs 90%
  if (s.toggles.magneticShieldActive && s.powerAllocations.shields >= 35) shieldFactor *= 0.2; // Deflector
  if (s.shieldIntegrity > 50) shieldFactor *= (1 - (s.shieldIntegrity / 200));

  const actualDoseRate = envRadiationRate * shieldFactor;
  s.radiationDoseRate = actualDoseRate;
  s.accumulatedDoseMSv += actualDoseRate * dtHour;

  // Radiation impact on crew health
  if (actualDoseRate > 0.5) {
    s.crewHealth = Math.max(0, s.crewHealth - (actualDoseRate * 0.8 * dtHour));
    s.crewMorale = Math.max(10, s.crewMorale - (0.3 * dtHour));
  } else if (s.oxygenLevel > 90 && s.foodStockpileSols > 2 && s.crewHealth < 100) {
    // Healing via good rest & nutrition (OSD-137 findings)
    s.crewHealth = Math.min(100, s.crewHealth + (0.15 * dtHour));
  }

  // --- Science Lab & EVA Exploration ---
  if (s.powerAllocations.scienceLab >= 10 && !isPowerBlackout) {
    let scienceRate = 0.5;
    if (s.toggles.roverOnEVA) {
      scienceRate = 1.8;
      // EVA hazard check
      if (s.activeAlert?.source === 'DONKI' || s.dustStormActive) {
        s.crewHealth = Math.max(0, s.crewHealth - (0.5 * dtHour));
      }
    }
    s.sciencePoints += scienceRate * dtHour;
  }

  // --- Handle Active Alert Countdown ---
  if (s.activeAlert && s.activeAlert.countdownSec > 0) {
    s.activeAlert.countdownSec = Math.max(0, s.activeAlert.countdownSec - dtSeconds);
    if (s.activeAlert.countdownSec <= 0 && !s.activeAlert.impactHandled) {
      s.activeAlert.impactHandled = true;
      // Evaluate if player shielded in time
      const properlyShielded = s.toggles.bunkerLockdown || (s.toggles.magneticShieldActive && s.powerAllocations.shields >= 30);
      if (properlyShielded) {
        s.logs = [
          { id: Date.now(), sol: s.sol, hour: formatHour(s.hour), text: "DONKI Solar Storm struck the base! Regolith shielding neutralized 92% of energetic protons. Crew is safe!", type: "success" },
          ...s.logs.slice(0, 30)
        ];
        if (!s.unlockedBadges.includes("badge_solar_survivor")) {
          s.unlockedBadges.push("badge_solar_survivor");
        }
      } else {
        s.crewHealth = Math.max(20, s.crewHealth - 35);
        s.logs = [
          { id: Date.now(), sol: s.sol, hour: formatHour(s.hour), text: "DONKI Solar Storm struck unshielded modules! Severe radiation absorbed. Medical bay administering anti-radiation therapy.", type: "danger" },
          ...s.logs.slice(0, 30)
        ];
      }
    }
  }

  // --- Check Victory or Failure Conditions ---
  if (s.oxygenLevel <= 15) {
    s.failed = true;
    s.failureReason = "ECLSS Life Support Depletion: Oxygen levels dropped below critical threshold (15%). Air recycling was starved of power.";
  } else if (s.crewHealth <= 10) {
    s.failed = true;
    s.failureReason = "Crew Incapacitation: Severe cumulative radiation and environmental stress overwhelmed the crew.";
  } else if (s.foodStockpileSols <= 0 && s.cropHealth <= 10) {
    s.failed = true;
    s.failureReason = "Starvation Crisis: Outpost ran out of stored food and greenhouse crops withered due to water/power rationing.";
  }

  return s;
}

export function formatHour(hourFloat) {
  const h = Math.floor(hourFloat);
  const m = Math.floor((hourFloat - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
