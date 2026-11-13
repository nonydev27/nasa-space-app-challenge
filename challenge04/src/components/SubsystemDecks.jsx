import React, { useState } from 'react';
import { soundFx } from '../utils/soundEffects';
import { REAL_DONKI_EVENTS, REAL_OSDR_STUDIES } from '../utils/nasaData';

export function SubsystemDecks({
  state,
  activeTab,
  onSelectTab,
  onToggleWaterRationing,
  onToggleHighYieldCrops,
  onHarvestCrops,
  onToggleRoverEVA,
  onGlossaryClick,
  onOpenNASAData
}) {
  const [selectedCrop, setSelectedCrop] = useState('microgreens');

  const CROPS = {
    microgreens: {
      name: "Radish & Mustard Microgreens",
      icon: "🌱",
      growthSpeed: "Fast (4 Sols)",
      waterUsage: "Low",
      nutrition: "Rich in Vitamin C & Antioxidants (Mitigates SANS eye damage)",
      osdrRef: "OSD-379: High germination rate in regolith simulant"
    },
    potatoes: {
      name: "Martian Russet Potatoes",
      icon: "🥔",
      growthSpeed: "Slow (8 Sols)",
      waterUsage: "High",
      nutrition: "High Caloric Energy (Protects bone/muscle mass)",
      osdrRef: "OSD-204: Caloric density crucial for resistive workout recovery"
    },
    spirulina: {
      name: "Spirulina Cyanobacteria Algae",
      icon: "🧪",
      growthSpeed: "Ultra-Fast (2 Sols)",
      waterUsage: "Recycled Closed Loop",
      nutrition: "70% Protein by dry weight & generates pure O2",
      osdrRef: "ECLSS Bio-regenerative oxygen loop test"
    }
  };

  return (
    <div className="subsystem-decks-container">
      {/* DECK TABS */}
      <div className="subsystem-tabs-bar">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'donki' ? 'active' : ''}`}
          onClick={() => {
            soundFx.playClick();
            onSelectTab('donki');
          }}
        >
          <span className="tab-icon">☀️</span>
          <span>Space Weather (DONKI)</span>
          {state.activeAlert?.source === 'DONKI' && <span className="tab-alert-badge">ALERT</span>}
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'eclss' ? 'active' : ''}`}
          onClick={() => {
            soundFx.playClick();
            onSelectTab('eclss');
          }}
        >
          <span className="tab-icon">🫁</span>
          <span>Life Support (ECLSS)</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'greenhouse' ? 'active' : ''}`}
          onClick={() => {
            soundFx.playClick();
            onSelectTab('greenhouse');
          }}
        >
          <span className="tab-icon">🌱</span>
          <span>Food Bay (OSDR)</span>
          {state.cropGrowthProgress >= 99 && <span className="tab-ready-badge">HARVEST</span>}
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'comms' ? 'active' : ''}`}
          onClick={() => {
            soundFx.playClick();
            onSelectTab('comms');
          }}
        >
          <span className="tab-icon">📡</span>
          <span>Comms & Rover</span>
          {state.toggles.roverOnEVA && <span className="tab-eva-badge">EVA</span>}
        </button>
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="tab-panel-body">
        {/* ================= 1. SPACE WEATHER & DONKI ================= */}
        {activeTab === 'donki' && (
          <div className="deck-panel donki-panel">
            <div className="panel-header-row">
              <div>
                <h4>☀️ NASA DONKI Space Weather Telemetry</h4>
                <p className="panel-sub">
                  Solar wind speed, Coronal Mass Ejection (CME) trajectories, and radiation storm alarms.
                </p>
              </div>
              <button
                type="button"
                className="nasa-dataset-link"
                onClick={onOpenNASAData}
              >
                Inspect NASA DONKI Archive ↗
              </button>
            </div>

            <div className="donki-telemetry-grid">
              <div className="telemetry-box">
                <span className="box-title">CURRENT RADIATION RATE</span>
                <span className={`box-value ${state.radiationDoseRate > 0.3 ? 'red' : 'green'}`}>
                  {state.radiationDoseRate.toFixed(2)} mSv/h
                </span>
                <span className="box-note">
                  {state.radiationDoseRate < 0.1 ? 'Normal deep space background' : '⚠️ Elevated solar particle storm'}
                </span>
              </div>

              <div className="telemetry-box">
                <span className="box-title">TOTAL CREW DOSE</span>
                <span className="box-value">{state.accumulatedDoseMSv.toFixed(1)} mSv</span>
                <span className="box-note">NASA Career Limit: 600 mSv</span>
              </div>

              <div className="telemetry-box">
                <span className="box-title">SHIELD STATUS</span>
                <span className="box-value">
                  {state.toggles.bunkerLockdown ? '90% Regolith' : state.toggles.magneticShieldActive ? '75% Magnetic' : '30% Passive'}
                </span>
                <span className="box-note">Regolith soil absorbs heavy ions</span>
              </div>
            </div>

            {/* Live or Simulated Event Card */}
            <div className={`donki-event-card ${state.activeAlert?.source === 'DONKI' ? 'alerting' : 'calm'}`}>
              <div className="event-badge-row">
                <span className="event-type-tag">
                  {state.activeAlert?.source === 'DONKI' ? '🚨 LIVE SOLAR EVENT' : 'ARCHIVED DONKI EVENT LOG'}
                </span>
                <span className="event-id">AR3664 / X9.3 Flare</span>
              </div>
              <h5>Coronal Mass Ejection (CME) Velocity: 2,150 km/s</h5>
              <p className="event-desc">
                When a giant solar flare bursts, X-rays arrive at the speed of light (8 minutes to Earth/Moon, 12 minutes to Mars). High-energy protons follow within 30 to 90 minutes. 
                Astronauts caught outside without shielding face acute radiation sickness!
              </p>
              <div className="recommended-action-box">
                <strong>Recommended Protocol:</strong> Seal crew inside the underground regolith storm bunker until proton flux normalizes.
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. LIFE SUPPORT (ECLSS) ================= */}
        {activeTab === 'eclss' && (
          <div className="deck-panel eclss-panel">
            <div className="panel-header-row">
              <div>
                <h4>🫁 ECLSS: Environmental Control & Life Support</h4>
                <p className="panel-sub">
                  Circular air revitalizer, Sabatier carbon scrubber, and closed-loop water processor.
                </p>
              </div>
              <button
                type="button"
                className="nasa-dataset-link"
                onClick={() => onGlossaryClick('ECLSS')}
              >
                What is ECLSS? ↗
              </button>
            </div>

            <div className="eclss-meters-row">
              <div className="eclss-meter">
                <span className="meter-label">Cabin Oxygen</span>
                <span className="meter-val">{Math.round(state.oxygenLevel)}%</span>
                <div className="meter-bar-track">
                  <div
                    className={`meter-bar-fill ${state.oxygenLevel < 50 ? 'red' : 'cyan'}`}
                    style={{ width: `${state.oxygenLevel}%` }}
                  />
                </div>
                <span className="meter-hint">Target: 21% Partial Pressure (Safe)</span>
              </div>

              <div className="eclss-meter">
                <span className="meter-label">Carbon Dioxide</span>
                <span className="meter-val">{Math.round(state.co2LevelPpm)} ppm</span>
                <div className="meter-bar-track">
                  <div
                    className={`meter-bar-fill ${state.co2LevelPpm > 1000 ? 'red' : 'green'}`}
                    style={{ width: `${Math.min(100, (state.co2LevelPpm / 2000) * 100)}%` }}
                  />
                </div>
                <span className="meter-hint">&lt;600 ppm ideal, &gt;1000 causes headache</span>
              </div>

              <div className="eclss-meter">
                <span className="meter-label">Water Recycled</span>
                <span className="meter-val">{Math.round(state.waterLevel)}%</span>
                <div className="meter-bar-track">
                  <div
                    className="meter-bar-fill blue"
                    style={{ width: `${state.waterLevel}%` }}
                  />
                </div>
                <span className="meter-hint">Recycles moisture from air & hygiene</span>
              </div>
            </div>

            {/* ECLSS Controls */}
            <div className="eclss-controls-card">
              <div className="control-desc-col">
                <strong>Water Conservation Mode:</strong>
                <p>
                  Rations water usage across the habitat. Reduces water consumption by 50%, but slightly lowers crew morale over time.
                </p>
              </div>
              <button
                type="button"
                className={`toggle-action-btn ${state.toggles.waterRationing ? 'active-glow' : ''}`}
                onClick={() => {
                  soundFx.playToggle(!state.toggles.waterRationing);
                  onToggleWaterRationing();
                }}
              >
                {state.toggles.waterRationing ? '💧 WATER RATIONING ACTIVE' : 'RATION WATER RESERVES'}
              </button>
            </div>
          </div>
        )}

        {/* ================= 3. HYDROPONICS & OSDR ================= */}
        {activeTab === 'greenhouse' && (
          <div className="deck-panel greenhouse-panel">
            <div className="panel-header-row">
              <div>
                <h4>🌱 Hydroponic Food Bay (NASA OSDR Space Biology)</h4>
                <p className="panel-sub">
                  Cultivate crops in lunar/martian regolith using LED spectrum optimization.
                </p>
              </div>
              <button
                type="button"
                className="nasa-dataset-link"
                onClick={onOpenNASAData}
              >
                Inspect NASA OSDR Botany Studies ↗
              </button>
            </div>

            {/* Crop Selector */}
            <div className="crop-selector-row">
              {Object.entries(CROPS).map(([key, crop]) => (
                <div
                  key={key}
                  className={`crop-card ${selectedCrop === key ? 'selected' : ''}`}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedCrop(key);
                  }}
                >
                  <span className="crop-icon">{crop.icon}</span>
                  <div className="crop-details">
                    <span className="crop-name">{crop.name}</span>
                    <span className="crop-meta">Speed: {crop.growthSpeed}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Crop Deep-Dive */}
            <div className="selected-crop-info">
              <div className="crop-info-text">
                <strong>Nutrition & Health Benefit:</strong> {CROPS[selectedCrop].nutrition}
                <div className="osdr-badge">
                  🔬 <strong>NASA OSDR Finding:</strong> {CROPS[selectedCrop].osdrRef}
                </div>
              </div>

              {/* Harvest progress bar */}
              <div className="harvest-progress-section">
                <div className="harvest-bar-header">
                  <span>Growth Progress: <strong>{Math.round(state.cropGrowthProgress)}%</strong></span>
                  <span>Health: {Math.round(state.cropHealth)}%</span>
                </div>
                <div className="growth-track">
                  <div
                    className="growth-fill"
                    style={{ width: `${Math.min(100, state.cropGrowthProgress)}%` }}
                  />
                </div>
                <button
                  type="button"
                  className="harvest-btn"
                  onClick={() => {
                    soundFx.playSuccess();
                    onHarvestCrops();
                  }}
                  disabled={state.cropGrowthProgress < 95}
                >
                  🌾 {state.cropGrowthProgress >= 95 ? 'HARVEST CROPS (+2 Sols Food)' : 'GROWING (Requires Power & Water)'}
                </button>
              </div>
            </div>

            {/* High-Yield Toggle */}
            <div className="high-yield-control">
              <div>
                <strong>High-Yield Nutrient Boost:</strong>
                <p>Pumps extra water and turns LED lights to 100% intensity. Speeds up growth by 80%, but draws +12 kW power and extra water.</p>
              </div>
              <button
                type="button"
                className={`toggle-action-btn ${state.toggles.highYieldCropCycle ? 'active-glow' : ''}`}
                onClick={() => {
                  soundFx.playToggle(!state.toggles.highYieldCropCycle);
                  onToggleHighYieldCrops();
                }}
              >
                {state.toggles.highYieldCropCycle ? '⚡ HIGH-YIELD BOOST ON' : 'ENABLE HIGH-YIELD BOOST'}
              </button>
            </div>
          </div>
        )}

        {/* ================= 4. COMMS & ROVER ================= */}
        {activeTab === 'comms' && (
          <div className="deck-panel comms-panel">
            <div className="panel-header-row">
              <div>
                <h4>📡 Deep Space Network & Surface Rover</h4>
                <p className="panel-sub">
                  Simulate speed-of-light radio delay and command autonomous exploration rovers.
                </p>
              </div>
              <button
                type="button"
                className="nasa-dataset-link"
                onClick={() => onGlossaryClick('Lag / Latency')}
              >
                Why is there delay? ↗
              </button>
            </div>

            <div className="latency-demonstrator">
              <div className="latency-box">
                <span className="lat-title">ROUND-TRIP SIGNAL DELAY (SPEED OF LIGHT)</span>
                <span className="lat-val">
                  {state.location === 'moon' ? '1.3 Seconds (Moon to Earth)' : '14 Minutes, 20 Seconds (Mars to Earth)'}
                </span>
                <p className="lat-explanation">
                  {state.location === 'moon'
                    ? 'Because the Moon is only 384,000 km away, astronauts can talk to Earth Houston with almost no delay.'
                    : 'Mars is up to 400 million km away! If an emergency happens on Mars, you CANNOT wait for Earth to help — you must make local decisions!'}
                </p>
              </div>
            </div>

            {/* Surface Rover Control */}
            <div className="rover-mission-card">
              <div className="rover-header">
                <span className="rover-badge-icon">🚜</span>
                <div>
                  <h5>Autonomous Surface Exploration Rover</h5>
                  <p>Send the rover across the crater to drill samples and map water ice.</p>
                </div>
              </div>

              <div className="rover-stats-row">
                <span>Status: <strong>{state.toggles.roverOnEVA ? '🚀 Surface Sortie (Drilling Samples)' : '🔋 Docked at Airlock (Recharging)'}</strong></span>
                <span>Power Draw: {state.toggles.roverOnEVA ? '12 kW' : '0 kW'}</span>
                <span>Research Rate: {state.toggles.roverOnEVA ? '+1.8 Science/hr' : '+0.5 Science/hr'}</span>
              </div>

              <div className="rover-action-row">
                <button
                  type="button"
                  className={`toggle-action-btn ${state.toggles.roverOnEVA ? 'active-danger' : 'active-glow'}`}
                  onClick={() => {
                    soundFx.playToggle(!state.toggles.roverOnEVA);
                    onToggleRoverEVA();
                  }}
                  disabled={state.activeAlert?.source === 'DONKI'}
                >
                  {state.toggles.roverOnEVA ? 'RECALL ROVER TO DOCK' : 'DEPLOY ROVER ON SURFACE EVA'}
                </button>
                {state.activeAlert?.source === 'DONKI' && (
                  <span className="rover-hazard-note">⚠️ Cannot deploy during DONKI Solar Storm!</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
