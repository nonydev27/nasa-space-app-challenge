import React, { useState, useEffect, useRef } from 'react';
import {
  createInitialSimulationState,
  updateSimulationTick
} from './utils/simulationEngine';
import { MISSION_CAMPAIGNS, BADGE_DEFINITIONS } from './utils/nasaData';
import { soundFx } from './utils/soundEffects';

import { Navbar } from './components/Navbar';
import { VitalGauges } from './components/VitalGauges';
import { OutpostVisualizer } from './components/OutpostVisualizer';
import { PowerMatrix } from './components/PowerMatrix';
import { SubsystemDecks } from './components/SubsystemDecks';
import { IncidentAlertBanner } from './components/IncidentAlertBanner';
import { AstroBotGuide } from './components/AstroBotGuide';
import { NASADataModal } from './components/NASADataModal';
import { GlossaryModal } from './components/GlossaryModal';
import { MissionBriefingModal } from './components/MissionBriefingModal';
import { MissionDebriefModal } from './components/MissionDebriefModal';
import { TelemetryLog } from './components/TelemetryLog';

import './App.css';

export default function App() {
  const [activeMissionId, setActiveMissionId] = useState('mission-1');
  const [location, setLocation] = useState('moon');
  const [mode, setMode] = useState('cadet'); // 'cadet' | 'director'
  const [soundMuted, setSoundMuted] = useState(false);
  const [activeDeckTab, setActiveDeckTab] = useState('donki');

  // Modals state
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [glossaryInitialTerm, setGlossaryInitialTerm] = useState(null);
  const [nasaDataOpen, setNasaDataOpen] = useState(false);
  const [missionSelectOpen, setMissionSelectOpen] = useState(false);

  // Get active mission definition
  const activeMission = MISSION_CAMPAIGNS.find((m) => m.id === activeMissionId) || null;

  // Initialize simulation state
  const [simState, setSimState] = useState(() =>
    createInitialSimulationState(activeMission, location, mode)
  );

  // Keep a ref to state to avoid stale closures in tick
  const stateRef = useRef(simState);
  useEffect(() => {
    stateRef.current = simState;
  }, [simState]);

  // Main Simulation Tick Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSimState((prevState) => {
        const next = updateSimulationTick(prevState, 1);

        // Check mission victory conditions
        if (
          activeMission &&
          !next.completed &&
          !next.failed &&
          next.sol >= activeMission.goal.targetSols &&
          next.oxygenLevel >= activeMission.goal.minO2 &&
          next.batteryKWh >= (activeMission.goal.minBattery / 100) * next.batteryMaxKWh
        ) {
          next.completed = true;
          if (!next.unlockedBadges.includes('badge_flight_director')) {
            next.unlockedBadges.push('badge_flight_director');
          }
          soundFx.playSuccess();
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeMission]);

  // Mission Selection handler
  const handleSelectMission = (missionId, loc) => {
    setActiveMissionId(missionId);
    const chosenLoc = loc || (missionId === 'mission-2' || missionId === 'mission-4' || missionId === 'mission-5' ? 'mars' : 'moon');
    setLocation(chosenLoc);
    const mConfig = MISSION_CAMPAIGNS.find((m) => m.id === missionId) || null;
    setSimState(createInitialSimulationState(mConfig, chosenLoc, mode));
  };

  // Restart handler
  const handleRestart = () => {
    setSimState(createInitialSimulationState(activeMission, location, mode));
  };

  // Handlers
  const handleTogglePause = () => {
    setSimState((prev) => ({ ...prev, paused: !prev.paused }));
  };

  const handleSetSpeed = (spd) => {
    setSimState((prev) => ({ ...prev, speed: spd, paused: false }));
  };

  const handleToggleSound = () => {
    const muted = soundFx.toggleMute();
    setSoundMuted(muted);
  };

  const handleToggleMode = () => {
    const newMode = mode === 'cadet' ? 'director' : 'cadet';
    setMode(newMode);
    setSimState((prev) => ({ ...prev, mode: newMode }));
  };

  const handleUpdateAllocation = (subsystem, val) => {
    setSimState((prev) => ({
      ...prev,
      powerAllocations: {
        ...prev.powerAllocations,
        [subsystem]: val
      }
    }));
  };

  const handleToggleShield = () => {
    setSimState((prev) => {
      const nextActive = !prev.toggles.magneticShieldActive;
      return {
        ...prev,
        toggles: {
          ...prev.toggles,
          magneticShieldActive: nextActive
        },
        powerAllocations: {
          ...prev.powerAllocations,
          shields: nextActive ? Math.max(35, prev.powerAllocations.shields) : prev.powerAllocations.shields
        }
      };
    });
  };

  const handleToggleBunker = () => {
    setSimState((prev) => {
      const nextLocked = !prev.toggles.bunkerLockdown;
      return {
        ...prev,
        toggles: {
          ...prev.toggles,
          bunkerLockdown: nextLocked,
          // recall rover if bunker locked
          roverOnEVA: nextLocked ? false : prev.toggles.roverOnEVA
        }
      };
    });
  };

  const handleToggleWaterRationing = () => {
    setSimState((prev) => ({
      ...prev,
      toggles: {
        ...prev.toggles,
        waterRationing: !prev.toggles.waterRationing
      }
    }));
  };

  const handleToggleHighYieldCrops = () => {
    setSimState((prev) => ({
      ...prev,
      toggles: {
        ...prev.toggles,
        highYieldCropCycle: !prev.toggles.highYieldCropCycle
      }
    }));
  };

  const handleHarvestCrops = () => {
    setSimState((prev) => ({
      ...prev,
      foodStockpileSols: prev.foodStockpileSols + 2,
      cropGrowthProgress: 0,
      logs: [
        {
          id: Date.now(),
          sol: prev.sol,
          hour: "12:00",
          text: "Fresh space crop harvest stored! +2 Sols food stockpile added.",
          type: "success"
        },
        ...prev.logs.slice(0, 30)
      ]
    }));
  };

  const handleToggleRoverEVA = () => {
    setSimState((prev) => ({
      ...prev,
      toggles: {
        ...prev.toggles,
        roverOnEVA: !prev.toggles.roverOnEVA
      }
    }));
  };

  const handleResolveAlert = (actionType) => {
    if (actionType === 'bunker') {
      handleToggleBunker();
    } else if (actionType === 'shield') {
      handleToggleShield();
    }
  };

  const handleOpenGlossaryTerm = (term) => {
    setGlossaryInitialTerm(term);
    setGlossaryOpen(true);
  };

  const handleModuleClick = (moduleName) => {
    if (moduleName === 'eclss') setActiveDeckTab('eclss');
    else if (moduleName === 'greenhouse') setActiveDeckTab('greenhouse');
    else if (moduleName === 'comms' || moduleName === 'rover') setActiveDeckTab('comms');
    else if (moduleName === 'power') {
      // scroll to power matrix
      const el = document.getElementById('power-matrix-anchor');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="trainer-app">
      {/* 1. TOP NAVIGATION & TELEMETRY BAR */}
      <Navbar
        state={simState}
        onTogglePause={handleTogglePause}
        onSetSpeed={handleSetSpeed}
        onToggleSound={handleToggleSound}
        soundMuted={soundMuted}
        onOpenGlossary={() => handleOpenGlossaryTerm(null)}
        onOpenNASAData={() => setNasaDataOpen(true)}
        onOpenMissionSelect={() => setMissionSelectOpen(true)}
        onToggleMode={handleToggleMode}
        activeMission={activeMission}
      />

      <main className="trainer-main-layout">
        {/* 2. CORE VITAL TELEMETRY GAUGES */}
        <VitalGauges
          state={simState}
          onGlossaryClick={handleOpenGlossaryTerm}
        />

        {/* 3. INCIDENT ALERT BANNER (DONKI / SPACE WEATHER) */}
        <IncidentAlertBanner
          alert={simState.activeAlert}
          onResolveAlert={handleResolveAlert}
          onOpenDONKI={() => setNasaDataOpen(true)}
          state={simState}
        />

        {/* 4. INTERACTIVE 2D OUTPOST CUTAWAY VISUALIZER */}
        <OutpostVisualizer
          state={simState}
          onModuleClick={handleModuleClick}
        />

        {/* 5. POWER ROUTING MATRIX & TRADE-OFF ENGINE */}
        <div id="power-matrix-anchor">
          <PowerMatrix
            state={simState}
            onUpdateAllocation={handleUpdateAllocation}
            onToggleShield={handleToggleShield}
            onToggleBunker={handleToggleBunker}
            onGlossaryClick={handleOpenGlossaryTerm}
          />
        </div>

        {/* 6. SUBSYSTEM DECKS (DONKI, ECLSS, OSDR GREENHOUSE, COMMS & ROVER) */}
        <SubsystemDecks
          state={simState}
          activeTab={activeDeckTab}
          onSelectTab={setActiveDeckTab}
          onToggleWaterRationing={handleToggleWaterRationing}
          onToggleHighYieldCrops={handleToggleHighYieldCrops}
          onHarvestCrops={handleHarvestCrops}
          onToggleRoverEVA={handleToggleRoverEVA}
          onGlossaryClick={handleOpenGlossaryTerm}
          onOpenNASAData={() => setNasaDataOpen(true)}
        />

        {/* 7. MISSION CONTROL REAL-TIME TELEMETRY LOG */}
        <TelemetryLog logs={simState.logs} />
      </main>

      {/* 8. ASTROBOT INTERACTIVE CADET ADVISOR (HCI Scaffolding for kids) */}
      <AstroBotGuide
        state={simState}
        onGlossaryClick={handleOpenGlossaryTerm}
      />

      {/* 9. MODALS */}
      <NASADataModal
        isOpen={nasaDataOpen}
        onClose={() => setNasaDataOpen(false)}
      />

      <GlossaryModal
        isOpen={glossaryOpen}
        onClose={() => {
          setGlossaryOpen(false);
          setGlossaryInitialTerm(null);
        }}
        initialTerm={glossaryInitialTerm}
      />

      <MissionBriefingModal
        isOpen={missionSelectOpen}
        onClose={() => setMissionSelectOpen(false)}
        onSelectMission={handleSelectMission}
        currentMissionId={activeMissionId}
      />

      <MissionDebriefModal
        isOpen={simState.completed || simState.failed}
        state={simState}
        activeMission={activeMission}
        onRestart={handleRestart}
        onOpenMissions={() => {
          setSimState((prev) => ({ ...prev, completed: false, failed: false }));
          setMissionSelectOpen(true);
        }}
      />
    </div>
  );
}
