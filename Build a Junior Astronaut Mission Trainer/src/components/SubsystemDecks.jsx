import { useState } from 'react';
import {
  Sun,
  Wind,
  Sprout,
  Radio,
  AlertTriangle,
  AlertOctagon,
  Droplets,
  Zap,
  FlaskConical,
  Car,
  BatteryCharging,
  Wheat
} from 'lucide-react';
import { soundFx } from '../utils/soundEffects';

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
  const [selectedCrop, setSelectedCrop] = useState('lettuce');

  const CROPS = {
    lettuce: {
      name: "Red romaine lettuce (Veggie)",
      icon: <Sprout size={20} color="#3ddc97" />,
      growthSpeed: "Normal cycle: 10 kW",
      waterUsage: "Steady",
      nutrition: "Fresh vitamins and a morale boost from eating something green.",
      osdrRef: "OSD-268: lettuce grown in the ISS Veggie garden was tested on Earth and found safe to eat."
    },
    cress: {
      name: "Thale cress in lunar soil",
      icon: <Wheat size={20} color="#ffb547" />,
      growthSpeed: "Slow and stressed",
      waterUsage: "Steady",
      nutrition: "An experiment, not a meal yet.",
      osdrRef: "OSD-476: seeds grew in real Apollo Moon soil, but slowly and with signs of stress."
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
          <span className="tab-icon"><Sun size={16} /></span>
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
          <span className="tab-icon"><Wind size={16} /></span>
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
          <span className="tab-icon"><Sprout size={16} /></span>
          <span>Food Bay (OSDR)</span>
          {state.cropGrowthProgress >= 70 && <span className="tab-ready-badge">HARVEST</span>}
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'comms' ? 'active' : ''}`}
          onClick={() => {
            soundFx.playClick();
            onSelectTab('comms');
          }}
        >
          <span className="tab-icon"><Radio size={16} /></span>
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
                <h4>
                  <Sun size={17} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  NASA DONKI Space Weather Telemetry
                </h4>
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
                  {state.radiationDoseRate < 0.1 ? (
                    'Normal deep space background'
                  ) : (
                    <>
                      <AlertTriangle size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                      Elevated solar particle storm
                    </>
                  )}
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
                  {state.activeAlert ? (
                    <>
                      <AlertOctagon size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                      STORM DRILL · {state.activeAlert.basedOn.live ? 'LIVE DONKI EVENT' : 'ARCHIVED DONKI EVENT'}
                    </>
                  ) : (
                    'NO STORM RIGHT NOW'
                  )}
                </span>
                <span className="event-id">{state.activeAlert ? state.activeAlert.basedOn.date : 'Watching the Sun'}</span>
              </div>
              <h5>{state.activeAlert ? `Modelled on a real event: ${state.activeAlert.basedOn.label}` : `Storm risk this month: ${state.weatherRisk} (${state.weatherLive ? 'live NASA data' : 'archive'})`}</h5>
              <p className="event-desc">
                When the Sun flares, its light reaches the Moon in about 8 minutes and Mars in about 13. The fastest particles follow soon after. Astronauts
                caught outside without shielding get a big radiation dose, so crews shelter as soon as forecasters warn them.
              </p>

              <div className="donki-facts-accordion">
                <strong>Real NASA Data Connection:</strong>
                <ul>
                  <li>NASA DONKI monitors Coronal Mass Ejections and Solar Energetic Particle (SEP) events worldwide.</li>
                  <li>Spacecraft such as SOHO and SDO watch the Sun all day so forecasters can warn crews early.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. ECLSS LIFE SUPPORT ================= */}
        {activeTab === 'eclss' && (
          <div className="deck-panel eclss-panel">
            <div className="panel-header-row">
              <div>
                <h4>
                  <Wind size={17} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  Environmental Control & Life Support System (ECLSS)
                </h4>
                <p className="panel-sub">
                  Atmospheric loop, Bosch/Sabatier CO2 reduction, and water purification processors.
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

            <div className="eclss-meters-grid">
              <div className="eclss-card">
                <span className="eclss-card-label">OXYGEN CONCENTRATION</span>
                <span className={`eclss-card-val ${state.oxygenLevel < 75 ? 'red' : 'green'}`}>
                  {Math.round(state.oxygenLevel)}%
                </span>
                <span className="eclss-card-detail">Nominal: 90–98% | Target: 21 kPa ppO2</span>
              </div>

              <div className="eclss-card">
                <span className="eclss-card-label">CARBON DIOXIDE LEVEL</span>
                <span className={`eclss-card-val ${state.co2LevelPpm > 1200 ? 'red' : 'green'}`}>
                  {Math.round(state.co2LevelPpm)} ppm
                </span>
                <span className="eclss-card-detail">Toxicity threshold: 2,000 ppm</span>
              </div>

              <div className="eclss-card">
                <span className="eclss-card-label">CABIN PRESSURE</span>
                <span className="eclss-card-val">{state.cabinPressureKPa.toFixed(1)} kPa</span>
                <span className="eclss-card-detail">Standard Sea Level: 101.3 kPa</span>
              </div>

              <div className="eclss-card">
                <span className="eclss-card-label">RECYCLED WATER STORAGE</span>
                <span className={`eclss-card-val ${state.waterLevel < 35 ? 'red' : 'green'}`}>
                  {Math.round(state.waterLevel)}%
                </span>
                <span className="eclss-card-detail">Urine Processor Assembly (UPA) recovery: 98%</span>
              </div>
            </div>

            {/* Water Rationing Toggle */}
            <div className="rationing-control-row">
              <div>
                <strong>Water Rationing Policy:</strong>
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
                <Droplets size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                {state.toggles.waterRationing ? 'WATER RATIONING ACTIVE' : 'RATION WATER RESERVES'}
              </button>
            </div>
          </div>
        )}

        {/* ================= 3. HYDROPONICS & OSDR ================= */}
        {activeTab === 'greenhouse' && (
          <div className="deck-panel greenhouse-panel">
            <div className="panel-header-row">
              <div>
                <h4>
                  <Sprout size={17} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  Hydroponic Food Bay (NASA OSDR Space Biology)
                </h4>
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
                  <FlaskConical size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  <strong>NASA OSDR Finding:</strong> {CROPS[selectedCrop].osdrRef}
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
                  disabled={state.cropGrowthProgress < 70}
                >
                  <Wheat size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  {state.cropGrowthProgress >= 70 ? 'HARVEST CROPS (+2 Sols Food)' : 'GROWING (Requires Power & Water)'}
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
                <Zap size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                {state.toggles.highYieldCropCycle ? 'HIGH-YIELD BOOST ON' : 'ENABLE HIGH-YIELD BOOST'}
              </button>
            </div>
          </div>
        )}

        {/* ================= 4. COMMS & ROVER ================= */}
        {activeTab === 'comms' && (
          <div className="deck-panel comms-panel">
            <div className="panel-header-row">
              <div>
                <h4>
                  <Radio size={17} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  Deep Space Network & Surface Rover
                </h4>
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
                <span className="lat-title">ONE-WAY SIGNAL DELAY (SPEED OF LIGHT)</span>
                <span className="lat-val">
                  {state.location === 'moon' ? 'About 1.3 seconds (Moon to Earth)' : 'About 3 to 22 minutes (Mars to Earth)'}
                </span>
                <p className="lat-explanation">
                  {state.location === 'moon'
                    ? 'Because the Moon is only 384,000 km away, astronauts can talk to Earth Houston with almost no delay.'
                    : 'Mars can be up to about 400 million km away. In an emergency the crew cannot wait for Earth, so they must decide for themselves.'}
                </p>
              </div>
            </div>

            {/* Surface Rover Control */}
            <div className="rover-mission-card">
              <div className="rover-header">
                <span className="rover-badge-icon">
                  <Car size={24} color="#38d9ff" />
                </span>
                <div>
                  <h5>Autonomous Surface Exploration Rover</h5>
                  <p>Send the rover across the crater to drill samples and map water ice.</p>
                </div>
              </div>

              <div className="rover-stats-row">
                <span>
                  Status:{' '}
                  <strong>
                    {state.toggles.roverOnEVA ? (
                      <>
                        <Car size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                        Surface Sortie (Drilling Samples)
                      </>
                    ) : (
                      <>
                        <BatteryCharging size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                        Docked at Airlock (Recharging)
                      </>
                    )}
                  </strong>
                </span>
                <span>Power Draw: {state.toggles.roverOnEVA ? '10 kW' : '0 kW'}</span>
                <span>Rover science: {state.toggles.roverOnEVA ? '+1.2 per hour, plus extra radiation' : 'none (docked)'}</span>
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
                  <span className="rover-hazard-note">
                    <AlertTriangle size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    Cannot deploy during DONKI Solar Storm!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
