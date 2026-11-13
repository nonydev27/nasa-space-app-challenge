import React from 'react';

export function OutpostVisualizer({ state, onModuleClick }) {
  const isMoon = state.location === 'moon';
  const isBunkerLocked = state.toggles.bunkerLockdown;
  const isShieldActive = state.toggles.magneticShieldActive;
  const isSolarStorm = state.activeAlert?.source === 'DONKI';
  const isDustStorm = state.dustStormActive;
  const isRoverEVA = state.toggles.roverOnEVA;

  // Sun position normalized across the sky arc
  const sunX = Math.max(10, Math.min(90, ((state.hour / 24) * 100)));
  const sunY = state.isDaylight
    ? Math.max(15, 65 - Math.sin(((state.hour - 6) / 12) * Math.PI) * 50)
    : 85;

  return (
    <div className={`outpost-visualizer-container ${isMoon ? 'theme-moon' : 'theme-mars'}`}>
      {/* SKY BACKGROUND */}
      <div className="sky-canvas">
        {/* Starfield */}
        <div className="stars-layer" />

        {/* Celestial Bodies */}
        {isMoon ? (
          /* Earth floating in the lunar sky */
          <div className="celestial-earth" title="Earth (384,400 km away)">
            <div className="earth-swirls" />
          </div>
        ) : (
          /* Phobos moon in Martian sky */
          <div className="celestial-phobos" title="Phobos (Mars Moon)" />
        )}

        {/* The Sun */}
        {state.isDaylight && (
          <div
            className={`celestial-sun ${isSolarStorm ? 'sun-flaring' : ''}`}
            style={{ left: `${sunX}%`, top: `${sunY}%` }}
            title={isSolarStorm ? 'DONKI Solar Flare in progress!' : 'The Sun'}
          >
            {isSolarStorm && <div className="solar-flare-prominence" />}
          </div>
        )}

        {/* Dust Storm Particle Layer for Mars */}
        {isDustStorm && (
          <div className="dust-storm-overlay" title="Martian Dust Storm (Slashing Solar Output)">
            <div className="dust-haze" />
          </div>
        )}

        {/* Magnetic Deflector Forcefield */}
        {isShieldActive && (
          <div className="magnetic-forcefield-dome" title="Active Magnetic Radiation Shield Deflector" />
        )}
      </div>

      {/* TERRAIN SURFACE */}
      <div className="terrain-surface">
        <div className="terrain-horizon" />
        <div className="terrain-crater-1" />
        <div className="terrain-crater-2" />
        {isMoon && <div className="ice-deposit-glow" title="Permanently Shadowed Crater Ice" />}
      </div>

      {/* OUTPOST STRUCTURES (SVG/DOM COMPOSITE) */}
      <div className="outpost-structures">
        {/* 1. SOLAR ARRAY BANK */}
        <div
          className={`structure-solar-array ${state.solarPanelsDeployed ? 'deployed' : 'stowed'}`}
          style={{ transform: `rotate(${state.isDaylight ? (state.hour - 12) * 3 : 0}deg)` }}
          title={`Solar Array (${Math.round(state.solarOutputKW)} kW Generation)`}
          onClick={() => onModuleClick?.('power')}
        >
          <div className="solar-panel-wing left" />
          <div className="solar-mast" />
          <div className="solar-panel-wing right" />
          <span className="structure-tag">☀️ {Math.round(state.solarOutputKW)} kW</span>
        </div>

        {/* 2. NUCLEAR RTG / KILOPOWER */}
        <div
          className="structure-rtg"
          title={`RTG Nuclear Reactor (${Math.round(state.rtgNuclearOutputKW)} kW Continuous Baseload)`}
          onClick={() => onModuleClick?.('power')}
        >
          <div className="rtg-core-glow" />
          <div className="rtg-cylinder" />
          <div className="rtg-cooling-fins" />
          <span className="structure-tag">⚛️ RTG</span>
        </div>

        {/* 3. MAIN COMMAND HABITAT DOME */}
        <div
          className="structure-main-dome"
          title="Command Hub & ECLSS Life Support"
          onClick={() => onModuleClick?.('eclss')}
        >
          <div className="dome-glass">
            <div className="dome-interior">
              {/* Crew avatars inside dome if not in bunker */}
              {!isBunkerLocked && (
                <div className="crew-in-dome">
                  <span className="crew-figure" title="Cmdr Maya">👩‍🚀</span>
                  <span className="crew-figure" title="Engineer Leo">👨‍🚀</span>
                </div>
              )}
              <div className="console-lights" />
            </div>
          </div>
          <div className="airlock-chamber" />
          <span className="structure-tag">🫁 ECLSS</span>
        </div>

        {/* 4. HYDROPONIC GREENHOUSE BIODOME */}
        <div
          className={`structure-greenhouse ${state.cropHealth < 50 ? 'unhealthy' : 'flourishing'}`}
          title={`Hydroponic Greenhouse (${Math.round(state.cropGrowthProgress)}% Growth)`}
          onClick={() => onModuleClick?.('greenhouse')}
        >
          <div className="greenhouse-glass">
            <div className="grow-lights-purple" />
            <div className="crop-beds">
              <span className="plant-leaf">🌱</span>
              <span className="plant-leaf">🥬</span>
              <span className="plant-leaf">🥔</span>
            </div>
          </div>
          <span className="structure-tag">🌱 Food Bay</span>
        </div>

        {/* 5. DEEP SPACE COMMS DISH */}
        <div
          className="structure-comms-dish"
          title={`Deep Space Network Dish (${isMoon ? '1.3s ping to Earth' : '12m latency to Earth'})`}
          onClick={() => onModuleClick?.('comms')}
        >
          <div className="dish-parabolic" />
          <div className="dish-emitter">
            <div className="radio-pulse-wave" />
          </div>
          <span className="structure-tag">📡 Comms</span>
        </div>

        {/* 6. SURFACE EXPLORATION ROVER */}
        <div
          className={`structure-rover ${isRoverEVA ? 'rover-on-eva' : 'rover-docked'}`}
          title={isRoverEVA ? 'Rover exploring surface (Generating Science)' : 'Rover docked & recharging'}
          onClick={() => onModuleClick?.('rover')}
        >
          <div className="rover-body">
            <div className="rover-chassis" />
            <div className="rover-mast-cam" />
            <div className="rover-wheels">
              <span className="wheel" />
              <span className="wheel" />
              <span className="wheel" />
            </div>
          </div>
          {isRoverEVA && <span className="rover-eva-status">🔬 EVA</span>}
        </div>
      </div>

      {/* SUBTERRANEAN REGOLITH BUNKER (UNDERGROUND CUTAWAY) */}
      <div className="underground-cross-section">
        <div className="regolith-layer-label">
          <span className="regolith-depth-marker">▼ 2.5 METERS REGOLITH SHIELDING</span>
          <span className="bunker-status-indicator">
            {isBunkerLocked ? '🔒 BUNKER SEALED & PRESSURIZED' : 'STANDBY BUNKER'}
          </span>
        </div>

        <div className={`storm-bunker-chamber ${isBunkerLocked ? 'occupied' : 'vacant'}`}>
          <div className="bunker-blast-door left" />
          <div className="bunker-interior">
            {isBunkerLocked ? (
              <div className="bunker-crew-shelter">
                <span className="crew-sheltered" title="Crew safe under regolith">👩‍🚀</span>
                <span className="crew-sheltered" title="Crew safe under regolith">👨‍🚀</span>
                <span className="crew-sheltered" title="Crew safe under regolith">👩‍⚕️</span>
                <span className="crew-sheltered" title="Crew safe under regolith">🧑‍🌾</span>
                <span className="bunker-secure-text">✨ 90% RADIATION SHIELDED</span>
              </div>
            ) : (
              <div className="bunker-empty-hint">
                Emergency Storm Shelter (Evacuate here during DONKI Solar Storms)
              </div>
            )}
          </div>
          <div className="bunker-blast-door right" />
        </div>
      </div>

      {/* OVERLAY NOTIFICATION STATUS */}
      <div className="visualizer-hud-overlay">
        <div className="location-hud-pill">
          {isMoon ? '🌕 ARTEMIS BASE CAMP (LUNAR SOUTH POLE)' : '🔴 JEZERO CRATER OUTPOST (MARS)'}
        </div>
        {isSolarStorm && (
          <div className="solar-storm-hud-flash">
            ⚠️ DONKI SOLAR EVENT IN PROGRESS: {state.activeAlert?.title}
          </div>
        )}
      </div>
    </div>
  );
}
