import React from 'react';

export function ClimateStressTester({ climateScenario, onUpdateClimate }) {
  const { tempDelta, rainDelta } = climateScenario;

  const setHistoricalScenario = (scenarioType) => {
    if (scenarioType === '2022-drought') {
      onUpdateClimate(2.8, -35);
    } else if (scenarioType === 'flash-drought') {
      onUpdateClimate(3.5, -25);
    } else if (scenarioType === 'wet-spring') {
      onUpdateClimate(0.5, 35);
    } else if (scenarioType === 'normal') {
      onUpdateClimate(0, 0);
    }
  };

  // Compute stress indices
  const isSevereDrought = rainDelta < -20 || (tempDelta > 2 && rainDelta < 0);
  const isExtremeWet = rainDelta > 20;

  return (
    <div className="climate-tester-card">
      <div className="tester-header">
        <div className="title-area">
          <span className="card-icon">🌦️</span>
          <div>
            <h3>CLIMATE STRESS TESTER: "WHAT-IF" SCENARIOS</h3>
            <p className="card-sub">
              Test how crop rotations hold up against shifting temperatures and unpredictable precipitation anomalies.
            </p>
          </div>
        </div>

        {/* Historical Benchmarks */}
        <div className="scenarios-row">
          <span className="scenario-label">Historical Scenarios:</span>
          <button type="button" className="scenario-chip" onClick={() => setHistoricalScenario('2022-drought')}>
            🔥 2022 Western Mega-Drought
          </button>
          <button type="button" className="scenario-chip" onClick={() => setHistoricalScenario('flash-drought')}>
            ☀️ Mid-Summer Flash Drought
          </button>
          <button type="button" className="scenario-chip" onClick={() => setHistoricalScenario('wet-spring')}>
            🌧️ Deluged Wet Spring
          </button>
          <button type="button" className="scenario-chip" onClick={() => setHistoricalScenario('normal')}>
            🔄 Historical 20-Year Baseline
          </button>
        </div>
      </div>

      <div className="stress-controls-grid">
        {/* Temp Slider */}
        <div className="climate-slider-box">
          <div className="slider-header-row">
            <span className="slider-lbl">🌡️ Summer Temperature Anomaly (ΔT)</span>
            <span className={`slider-val ${tempDelta > 1.5 ? 'red' : 'green'}`}>
              {tempDelta > 0 ? `+${tempDelta}°C` : `${tempDelta}°C`} ({((tempDelta * 1.8)).toFixed(1)}°F)
            </span>
          </div>
          <input
            type="range"
            min="-1.0"
            max="4.0"
            step="0.5"
            value={tempDelta}
            onChange={(e) => onUpdateClimate(Number(e.target.value), rainDelta)}
            className="climate-range-input"
          />
          <div className="slider-subtext">
            {tempDelta > 2.0
              ? '⚠️ High ECOSTRESS ET deficit: Corn & Alfalfa suffer severe pollination heat stress.'
              : 'Within historical crop breeding tolerance bounds.'}
          </div>
        </div>

        {/* Rain Slider */}
        <div className="climate-slider-box">
          <div className="slider-header-row">
            <span className="slider-lbl">🌧️ Seasonal Rainfall Shift (ΔP)</span>
            <span className={`slider-val ${rainDelta < -15 ? 'red' : rainDelta > 15 ? 'blue' : 'green'}`}>
              {rainDelta > 0 ? `+${rainDelta}%` : `${rainDelta}%`}
            </span>
          </div>
          <input
            type="range"
            min="-40"
            max="40"
            step="5"
            value={rainDelta}
            onChange={(e) => onUpdateClimate(tempDelta, Number(e.target.value))}
            className="climate-range-input"
          />
          <div className="slider-subtext">
            {rainDelta < -20
              ? '🔴 SMAP root-zone depletion: Un-irrigated shallow-rooted crops fail.'
              : rainDelta > 20
              ? '🌊 High GPM runoff risk: Bare soil parcels suffer severe gully erosion.'
              : 'Near normal precipitation distribution.'}
          </div>
        </div>

        {/* Live Vulnerability Status Badge */}
        <div className={`vulnerability-summary-capsule ${isSevereDrought ? 'drought' : isExtremeWet ? 'wet' : 'nominal'}`}>
          <span className="capsule-icon">{isSevereDrought ? '🔥' : isExtremeWet ? '🌊' : '✨'}</span>
          <div className="capsule-text">
            <strong>
              {isSevereDrought
                ? 'High Drought & Evaporative Stress Active'
                : isExtremeWet
                ? 'High Soil Erosion & Leaching Risk Active'
                : 'Nominal Climate Baseline Conditions'}
            </strong>
            <p>
              {isSevereDrought
                ? 'Notice how diverse, deep-rooted rotations pull ahead of baseline monocultures in the score matrix!'
                : isExtremeWet
                ? 'Cover-cropped strategies prevent massive topsoil washouts observed on bare-fallow fields.'
                : 'Adjust sliders to evaluate resilience under future weather volatility.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
