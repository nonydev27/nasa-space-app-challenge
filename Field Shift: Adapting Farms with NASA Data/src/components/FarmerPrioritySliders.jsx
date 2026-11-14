import React from 'react';

export function FarmerPrioritySliders({ priorities, onUpdatePriority }) {
  const setPreset = (presetName) => {
    if (presetName === 'drought') {
      onUpdatePriority('waterConservation', 95);
      onUpdatePriority('soilHealth', 70);
      onUpdatePriority('supplementalRevenue', 40);
      onUpdatePriority('lowEquipmentOverhead', 60);
    } else if (presetName === 'soil') {
      onUpdatePriority('waterConservation', 60);
      onUpdatePriority('soilHealth', 100);
      onUpdatePriority('supplementalRevenue', 50);
      onUpdatePriority('lowEquipmentOverhead', 50);
    } else if (presetName === 'revenue') {
      onUpdatePriority('waterConservation', 40);
      onUpdatePriority('soilHealth', 40);
      onUpdatePriority('supplementalRevenue', 95);
      onUpdatePriority('lowEquipmentOverhead', 80);
    } else if (presetName === 'balanced') {
      onUpdatePriority('waterConservation', 70);
      onUpdatePriority('soilHealth', 70);
      onUpdatePriority('supplementalRevenue', 70);
      onUpdatePriority('lowEquipmentOverhead', 70);
    }
  };

  return (
    <div className="farmer-priorities-card">
      <div className="priorities-header">
        <div className="title-area">
          <span className="card-icon">🎛️</span>
          <div>
            <h3>FARMER GOALS & OPERATIONAL PRIORITIES</h3>
            <p className="card-sub">
              Weight what matters most to your operation. Field Shift recalculates rotation recommendations in real time.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="presets-row">
          <span className="preset-label">Presets:</span>
          <button type="button" className="preset-chip" onClick={() => setPreset('drought')}>
            💧 Drought Defense
          </button>
          <button type="button" className="preset-chip" onClick={() => setPreset('soil')}>
            🌱 Soil Rebuilding
          </button>
          <button type="button" className="preset-chip" onClick={() => setPreset('revenue')}>
            💰 Cash Liquidity
          </button>
          <button type="button" className="preset-chip" onClick={() => setPreset('balanced')}>
            ⚖️ Balanced
          </button>
        </div>
      </div>

      <div className="sliders-grid">
        {/* 1. Water Conservation */}
        <div className="priority-slider-box">
          <div className="slider-top">
            <span className="slider-title">
              <span className="icon">💧</span> Water Conservation
            </span>
            <span className="slider-val">{priorities.waterConservation}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={priorities.waterConservation}
            onChange={(e) => onUpdatePriority('waterConservation', Number(e.target.value))}
            className="slider-input accent-blue"
          />
          <span className="slider-hint">
            Prioritize low-ET crops (sorghum, pulses, rye) to cut irrigation pumping and conserve aquifers.
          </span>
        </div>

        {/* 2. Soil Health & Organic Matter */}
        <div className="priority-slider-box">
          <div className="slider-top">
            <span className="slider-title">
              <span className="icon">🧪</span> Soil Health & N-Fixation
            </span>
            <span className="slider-val">{priorities.soilHealth}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={priorities.soilHealth}
            onChange={(e) => onUpdatePriority('soilHealth', Number(e.target.value))}
            className="slider-input accent-green"
          />
          <span className="slider-hint">
            Reward biological nitrogen-fixers (vetch, clover, peas) and continuous living roots to build organic carbon.
          </span>
        </div>

        {/* 3. Supplemental Cash Revenue */}
        <div className="priority-slider-box">
          <div className="slider-top">
            <span className="slider-title">
              <span className="icon">💰</span> Cash Market Return
            </span>
            <span className="slider-val">{priorities.supplementalRevenue}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={priorities.supplementalRevenue}
            onChange={(e) => onUpdatePriority('supplementalRevenue', Number(e.target.value))}
            className="slider-input accent-gold"
          />
          <span className="slider-hint">
            Value established commodity elevator markets, crop insurance support, and rapid sales liquidity.
          </span>
        </div>

        {/* 4. Low Equipment Overhead */}
        <div className="priority-slider-box">
          <div className="slider-top">
            <span className="slider-title">
              <span className="icon">🚜</span> Low Equipment Overhead
            </span>
            <span className="slider-val">{priorities.lowEquipmentOverhead}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={priorities.lowEquipmentOverhead}
            onChange={(e) => onUpdatePriority('lowEquipmentOverhead', Number(e.target.value))}
            className="slider-input accent-purple"
          />
          <span className="slider-hint">
            Avoid requiring new no-till drills, roller-crimpers, or specialized harvester headers.
          </span>
        </div>
      </div>
    </div>
  );
}
