import React from 'react';
import { soundFx } from '../utils/soundEffects';

export function PowerMatrix({
  state,
  onUpdateAllocation,
  onToggleShield,
  onToggleBunker,
  onGlossaryClick
}) {
  const totalGen = Math.round(state.solarOutputKW + state.rtgNuclearOutputKW);
  const totalCons = Math.round(
    Object.values(state.powerAllocations).reduce((a, b) => a + b, 0)
  );
  const netPower = totalGen - totalCons;
  const batteryPct = Math.round((state.batteryKWh / state.batteryMaxKWh) * 100);

  // Time to empty or full
  let batteryHoursRemaining = 'Balanced';
  if (netPower < 0) {
    const hours = (state.batteryKWh / Math.abs(netPower)).toFixed(1);
    batteryHoursRemaining = `${hours} hrs to empty`;
  } else if (netPower > 0 && batteryPct < 100) {
    const hours = ((state.batteryMaxKWh - state.batteryKWh) / netPower).toFixed(1);
    batteryHoursRemaining = `${hours} hrs to full`;
  }

  const handleSliderChange = (subsystem, val) => {
    soundFx.playTone(400 + val * 10, 'sine', 0.03, 0.04);
    onUpdateAllocation(subsystem, Number(val));
  };

  const handleStep = (subsystem, delta) => {
    soundFx.playClick();
    const current = state.powerAllocations[subsystem] || 0;
    const next = Math.max(0, Math.min(60, current + delta));
    onUpdateAllocation(subsystem, next);
  };

  return (
    <div className="power-matrix-deck">
      <div className="deck-header">
        <div className="deck-title-area">
          <span className="deck-icon">⚡</span>
          <div>
            <h3>POWER ROUTING MATRIX</h3>
            <p className="deck-subtitle">
              Balance electrical kilowatts between survival, shielding, food, and science.
            </p>
          </div>
        </div>

        {/* Battery Telemetry Capsule */}
        <div className={`battery-status-capsule ${netPower < 0 ? 'draining' : 'charging'}`}>
          <div className="capsule-metric">
            <span className="metric-label">BATTERY RESERVE</span>
            <span className="metric-val">{batteryPct}% ({Math.round(state.batteryKWh)} / {state.batteryMaxKWh} kWh)</span>
          </div>
          <div className="capsule-rate">
            <span className={`rate-arrow ${netPower < 0 ? 'arrow-down' : 'arrow-up'}`}>
              {netPower >= 0 ? `▲ +${netPower} kW` : `▼ ${netPower} kW`}
            </span>
            <span className="hours-hint">{batteryHoursRemaining}</span>
          </div>
        </div>
      </div>

      {/* GENERATION SUMMARY BAR */}
      <div className="power-budget-bar-section">
        <div className="budget-bar-labels">
          <span>Total Generation: <strong>{totalGen} kW</strong> (☀️ Solar {Math.round(state.solarOutputKW)} kW + ⚛️ RTG {Math.round(state.rtgNuclearOutputKW)} kW)</span>
          <span>Allocated Load: <strong>{totalCons} kW</strong></span>
        </div>
        <div className="generation-vs-load-track">
          <div
            className={`gen-load-fill ${totalCons > totalGen ? 'overload' : 'sustainable'}`}
            style={{ width: `${Math.min(100, (totalCons / Math.max(totalGen, 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* 5 SUBSYSTEM ALLOCATION CONTROLS */}
      <div className="allocation-sliders-grid">
        {/* 1. ECLSS LIFE SUPPORT */}
        <div className="allocation-card">
          <div className="alloc-header">
            <span className="alloc-icon">🫁</span>
            <div className="alloc-text">
              <span className="alloc-title">
                ECLSS Life Support & Heaters
                <button
                  type="button"
                  className="inline-help-btn"
                  onClick={() => onGlossaryClick('ECLSS')}
                >
                  ?
                </button>
              </span>
              <span className="alloc-desc">Air scrubbers, thermal heaters, water loop</span>
            </div>
            <span className="alloc-kw">{state.powerAllocations.eclss} kW</span>
          </div>
          <div className="alloc-control-row">
            <button
              type="button"
              className="step-btn"
              onClick={() => handleStep('eclss', -5)}
              disabled={state.powerAllocations.eclss <= 0}
            >
              -5
            </button>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={state.powerAllocations.eclss}
              onChange={(e) => handleSliderChange('eclss', e.target.value)}
              className="alloc-slider"
            />
            <button
              type="button"
              className="step-btn"
              onClick={() => handleStep('eclss', 5)}
              disabled={state.powerAllocations.eclss >= 50}
            >
              +5
            </button>
          </div>
          <div className="trade-off-consequence">
            {state.powerAllocations.eclss < 25 ? (
              <span className="warning-text">⚠️ Below 25 kW: O2 levels will decline and CO2 will accumulate!</span>
            ) : (
              <span className="safe-text">✅ Nominal oxygen generation and cabin temperature</span>
            )}
          </div>
        </div>

        {/* 2. RADIATION SHIELDS & DEFLECTOR */}
        <div className="allocation-card">
          <div className="alloc-header">
            <span className="alloc-icon">🛡️</span>
            <div className="alloc-text">
              <span className="alloc-title">
                Radiation Shields & Deflector
                <button
                  type="button"
                  className="inline-help-btn"
                  onClick={() => onGlossaryClick('DONKI')}
                >
                  ?
                </button>
              </span>
              <span className="alloc-desc">Magnetic deflector coil & storm bunker power</span>
            </div>
            <span className="alloc-kw">{state.powerAllocations.shields} kW</span>
          </div>
          <div className="alloc-control-row">
            <button
              type="button"
              className="step-btn"
              onClick={() => handleStep('shields', -5)}
              disabled={state.powerAllocations.shields <= 0}
            >
              -5
            </button>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={state.powerAllocations.shields}
              onChange={(e) => handleSliderChange('shields', e.target.value)}
              className="alloc-slider"
            />
            <button
              type="button"
              className="step-btn"
              onClick={() => handleStep('shields', 5)}
              disabled={state.powerAllocations.shields >= 60}
            >
              +5
            </button>
          </div>
          <div className="trade-off-consequence">
            {state.powerAllocations.shields >= 35 ? (
              <span className="safe-text">🛡️ Magnetic forcefield active — protects from solar protons</span>
            ) : (
              <span className="neutral-text">Passive regolith shielding only</span>
            )}
          </div>
        </div>

        {/* 3. HYDROPONIC GREENHOUSE */}
        <div className="allocation-card">
          <div className="alloc-header">
            <span className="alloc-icon">🌱</span>
            <div className="alloc-text">
              <span className="alloc-title">
                Hydroponic Greenhouse
                <button
                  type="button"
                  className="inline-help-btn"
                  onClick={() => onGlossaryClick('OSDR')}
                >
                  ?
                </button>
              </span>
              <span className="alloc-desc">LED photosynthetic spectrum & nutrient pumps</span>
            </div>
            <span className="alloc-kw">{state.powerAllocations.greenhouse} kW</span>
          </div>
          <div className="alloc-control-row">
            <button
              type="button"
              className="step-btn"
              onClick={() => handleStep('greenhouse', -5)}
              disabled={state.powerAllocations.greenhouse <= 0}
            >
              -5
            </button>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={state.powerAllocations.greenhouse}
              onChange={(e) => handleSliderChange('greenhouse', e.target.value)}
              className="alloc-slider"
            />
            <button
              type="button"
              className="step-btn"
              onClick={() => handleStep('greenhouse', 5)}
              disabled={state.powerAllocations.greenhouse >= 40}
            >
              +5
            </button>
          </div>
          <div className="trade-off-consequence">
            {state.powerAllocations.greenhouse < 15 ? (
              <span className="warning-text">⚠️ Low light: Crop growth stalls; plants may wither</span>
            ) : (
              <span className="safe-text">🌿 Healthy photosynthesis (+Food & fresh O2)</span>
            )}
          </div>
        </div>

        {/* 4. SCIENCE LAB & SAMPLE DRILLS */}
        <div className="allocation-card">
          <div className="alloc-header">
            <span className="alloc-icon">🔬</span>
            <div className="alloc-text">
              <span className="alloc-title">Science Lab & Drills</span>
              <span className="alloc-desc">Sample spectroscopy, ice coring, mission research</span>
            </div>
            <span className="alloc-kw">{state.powerAllocations.scienceLab} kW</span>
          </div>
          <div className="alloc-control-row">
            <button
              type="button"
              className="step-btn"
              onClick={() => handleStep('scienceLab', -5)}
              disabled={state.powerAllocations.scienceLab <= 0}
            >
              -5
            </button>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={state.powerAllocations.scienceLab}
              onChange={(e) => handleSliderChange('scienceLab', e.target.value)}
              className="alloc-slider"
            />
            <button
              type="button"
              className="step-btn"
              onClick={() => handleStep('scienceLab', 5)}
              disabled={state.powerAllocations.scienceLab >= 40}
            >
              +5
            </button>
          </div>
          <div className="trade-off-consequence">
            {state.powerAllocations.scienceLab > 0 ? (
              <span className="safe-text">✨ Discoveries generating +{((state.powerAllocations.scienceLab / 10) * 0.5).toFixed(1)} pts/hr</span>
            ) : (
              <span className="neutral-text">Science on hold to conserve battery</span>
            )}
          </div>
        </div>

        {/* 5. COMMS & ROVER DOCK */}
        <div className="allocation-card">
          <div className="alloc-header">
            <span className="alloc-icon">📡</span>
            <div className="alloc-text">
              <span className="alloc-title">Comms & Rover Recharge</span>
              <span className="alloc-desc">Deep Space Network uplink & rover battery charging</span>
            </div>
            <span className="alloc-kw">{state.powerAllocations.commsRover} kW</span>
          </div>
          <div className="alloc-control-row">
            <button
              type="button"
              className="step-btn"
              onClick={() => handleStep('commsRover', -5)}
              disabled={state.powerAllocations.commsRover <= 0}
            >
              -5
            </button>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={state.powerAllocations.commsRover}
              onChange={(e) => handleSliderChange('commsRover', e.target.value)}
              className="alloc-slider"
            />
            <button
              type="button"
              className="step-btn"
              onClick={() => handleStep('commsRover', 5)}
              disabled={state.powerAllocations.commsRover >= 30}
            >
              +5
            </button>
          </div>
          <div className="trade-off-consequence">
            {state.powerAllocations.commsRover >= 10 ? (
              <span className="safe-text">📡 DSN downlink connected to NASA Houston</span>
            ) : (
              <span className="warning-text">⚠️ Telemetry packets delayed</span>
            )}
          </div>
        </div>
      </div>

      {/* QUICK EMERGENCY TOGGLE ROW */}
      <div className="emergency-toggles-bar">
        <button
          type="button"
          className={`toggle-action-btn ${state.toggles.bunkerLockdown ? 'active-danger' : ''}`}
          onClick={() => {
            soundFx.playShieldActivate();
            onToggleBunker();
          }}
          title="Evacuate crew 2.5m under regolith during solar storms"
        >
          <span className="action-icon">🏰</span>
          <span>
            {state.toggles.bunkerLockdown ? 'SEALED IN BUNKER (90% Shielding)' : 'EVACUATE TO REGOLITH BUNKER'}
          </span>
        </button>

        <button
          type="button"
          className={`toggle-action-btn ${state.toggles.magneticShieldActive ? 'active-glow' : ''}`}
          onClick={() => {
            soundFx.playToggle(!state.toggles.magneticShieldActive);
            onToggleShield();
          }}
          title="Deploy electromagnetic deflector field"
        >
          <span className="action-icon">🌐</span>
          <span>
            {state.toggles.magneticShieldActive ? 'DEFLECTOR FORCEFIELD ONLINE' : 'ACTIVATE MAGNETIC DEFLECTOR'}
          </span>
        </button>
      </div>
    </div>
  );
}
