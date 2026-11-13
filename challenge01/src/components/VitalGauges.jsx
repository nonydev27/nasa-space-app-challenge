import React from 'react';

export function VitalGauges({ state, onGlossaryClick }) {
  // Power Status
  const batteryPct = Math.round((state.batteryKWh / state.batteryMaxKWh) * 100);
  const totalGen = Math.round(state.solarOutputKW + state.rtgNuclearOutputKW);
  const totalCons = Math.round(
    Object.values(state.powerAllocations).reduce((a, b) => a + b, 0)
  );
  const netPower = totalGen - totalCons;
  const isPowerDraining = netPower < 0;

  // Oxygen Status
  const o2Safe = state.oxygenLevel >= 80;
  const o2Warn = state.oxygenLevel < 80 && state.oxygenLevel >= 40;

  // Radiation Status
  const isHighRadiation = state.radiationDoseRate > 0.3;

  // Water & Food
  const foodWarning = state.foodStockpileSols <= 2;

  return (
    <div className="vital-gauges-container">
      {/* 1. POWER & BATTERY */}
      <div className={`vital-card power-card ${batteryPct < 25 ? 'critical' : batteryPct < 50 ? 'warning' : 'nominal'}`}>
        <div className="vital-header">
          <span className="vital-icon">⚡</span>
          <div className="vital-title-group">
            <span className="vital-label">
              POWER GRID{' '}
              <button
                type="button"
                className="glossary-term-pill"
                onClick={() => onGlossaryClick('RTG')}
                title="Learn about RTG Space Batteries"
              >
                RTG info
              </button>
            </span>
            <span className="vital-sub">
              {netPower >= 0 ? `+${netPower} kW Net` : `${netPower} kW Drain`}
            </span>
          </div>
          <span className="vital-value">{batteryPct}%</span>
        </div>
        <div className="gauge-track">
          <div
            className={`gauge-bar ${batteryPct < 25 ? 'bar-red' : batteryPct < 50 ? 'bar-yellow' : 'bar-green'}`}
            style={{ width: `${Math.max(4, Math.min(100, batteryPct))}%` }}
          />
        </div>
        <div className="vital-footer">
          <span>Gen: {totalGen} kW (☀️ {Math.round(state.solarOutputKW)} + ⚛️ {Math.round(state.rtgNuclearOutputKW)})</span>
          <span>Load: {totalCons} kW</span>
        </div>
      </div>

      {/* 2. OXYGEN & ECLSS */}
      <div className={`vital-card oxygen-card ${state.oxygenLevel < 40 ? 'critical' : state.oxygenLevel < 80 ? 'warning' : 'nominal'}`}>
        <div className="vital-header">
          <span className="vital-icon">🫁</span>
          <div className="vital-title-group">
            <span className="vital-label">
              OXYGEN (ECLSS){' '}
              <button
                type="button"
                className="glossary-term-pill"
                onClick={() => onGlossaryClick('ECLSS')}
                title="Learn about ECLSS Life Support"
              >
                ?
              </button>
            </span>
            <span className="vital-sub">CO2: {Math.round(state.co2LevelPpm)} ppm</span>
          </div>
          <span className="vital-value">{Math.round(state.oxygenLevel)}%</span>
        </div>
        <div className="gauge-track">
          <div
            className={`gauge-bar ${!o2Safe ? (o2Warn ? 'bar-yellow' : 'bar-red') : 'bar-cyan'}`}
            style={{ width: `${Math.max(4, Math.min(100, state.oxygenLevel))}%` }}
          />
        </div>
        <div className="vital-footer">
          <span>{o2Safe ? '✨ Breathable Cabin' : '⚠️ Air Scrubbers Starved'}</span>
          <span>Cabin: 101.3 kPa</span>
        </div>
      </div>

      {/* 3. RADIATION SHIELDING */}
      <div className={`vital-card radiation-card ${isHighRadiation ? 'critical' : 'nominal'}`}>
        <div className="vital-header">
          <span className="vital-icon">🛡️</span>
          <div className="vital-title-group">
            <span className="vital-label">
              RADIATION{' '}
              <button
                type="button"
                className="glossary-term-pill"
                onClick={() => onGlossaryClick('Sievert')}
                title="Learn about Millisieverts"
              >
                mSv?
              </button>
            </span>
            <span className="vital-sub">
              {state.toggles.bunkerLockdown ? '🏰 Bunker Sealed' : (state.toggles.magneticShieldActive ? '🌐 Deflector On' : 'Standard')}
            </span>
          </div>
          <span className="vital-value">{state.radiationDoseRate.toFixed(2)} mSv/h</span>
        </div>
        <div className="gauge-track">
          <div
            className={`gauge-bar ${isHighRadiation ? 'bar-red' : 'bar-purple'}`}
            style={{
              width: `${Math.min(100, Math.max(10, (state.radiationDoseRate / 1.5) * 100))}%`
            }}
          />
        </div>
        <div className="vital-footer">
          <span>Absorbed: {state.accumulatedDoseMSv.toFixed(1)} mSv</span>
          <span>Shield: {Math.round(state.shieldIntegrity)}%</span>
        </div>
      </div>

      {/* 4. FOOD & WATER RESERVES */}
      <div className={`vital-card food-card ${foodWarning ? 'warning' : 'nominal'}`}>
        <div className="vital-header">
          <span className="vital-icon">🥗</span>
          <div className="vital-title-group">
            <span className="vital-label">
              FOOD & WATER{' '}
              <button
                type="button"
                className="glossary-term-pill"
                onClick={() => onGlossaryClick('OSDR')}
                title="Learn about OSDR Plant Biology"
              >
                OSDR
              </button>
            </span>
            <span className="vital-sub">H2O Recycled: {Math.round(state.waterLevel)}%</span>
          </div>
          <span className="vital-value">{Math.round(state.foodStockpileSols)} Sols</span>
        </div>
        <div className="gauge-track">
          <div
            className={`gauge-bar ${foodWarning ? 'bar-yellow' : 'bar-green'}`}
            style={{
              width: `${Math.min(100, Math.max(10, (state.foodStockpileSols / 10) * 100))}%`
            }}
          />
        </div>
        <div className="vital-footer">
          <span>Crop Growth: {Math.round(state.cropGrowthProgress)}%</span>
          <span>{foodWarning ? '⚠️ Low Rations' : '🌱 Crops Healthy'}</span>
        </div>
      </div>

      {/* 5. CREW HEALTH & SCIENCE */}
      <div className="vital-card crew-card">
        <div className="vital-header">
          <span className="vital-icon">👩‍🚀</span>
          <div className="vital-title-group">
            <span className="vital-label">CREW & DISCOVERY</span>
            <span className="vital-sub">Morale: {Math.round(state.crewMorale)}%</span>
          </div>
          <span className="vital-value">🔬 {Math.round(state.sciencePoints)} pts</span>
        </div>
        <div className="gauge-track">
          <div
            className="gauge-bar bar-blue"
            style={{ width: `${Math.max(4, Math.min(100, state.crewHealth))}%` }}
          />
        </div>
        <div className="vital-footer">
          <span>Health: {Math.round(state.crewHealth)}%</span>
          <span>Crew: 4 Active</span>
        </div>
      </div>
    </div>
  );
}
