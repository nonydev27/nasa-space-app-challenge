import React from 'react';
import { REGIONAL_FARMS } from '../utils/nasaEarthData';

export function Header({
  selectedRegion,
  onSelectRegion,
  onOpenGlossary,
  onOpenSensorsModal
}) {
  return (
    <header className="farm-header">
      <div className="header-brand-row">
        <div className="brand-group">
          <div className="nasa-chip" title="2026 NASA Space Apps Challenge">
            <span className="nasa-pill">NASA</span>
            <span className="space-apps-text">SPACE APPS 2026</span>
          </div>
          <div className="title-text-group">
            <h1 className="main-title">
              <span className="title-field">FIELD SHIFT</span>
              <span className="title-sub">Adapting Farms with NASA Earth Data</span>
            </h1>
            <p className="app-tagline">
              Farmer-centered decision support for climate-resilient crop rotations and living soil armor
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="header-actions">
          <button
            type="button"
            className="header-btn sensors-btn"
            onClick={onOpenSensorsModal}
            title="Inspect NASA Earth Observation Satellites (SMAP, ECOSTRESS, Landsat, GPM)"
          >
            <span className="btn-icon">🛰️</span>
            <span>NASA Sensors</span>
          </button>

          <button
            type="button"
            className="header-btn glossary-btn"
            onClick={onOpenGlossary}
            title="Plain-language definitions for Evapotranspiration, NDVI, GDD & Soil Anomaly"
          >
            <span className="btn-icon">📖</span>
            <span>Farmer Glossary</span>
          </button>
        </div>
      </div>

      {/* Region Selector Ribbon */}
      <div className="region-selector-ribbon">
        <span className="ribbon-label">SELECT FARM DEMO REGION:</span>
        <div className="region-pills-list">
          {Object.entries(REGIONAL_FARMS).map(([key, reg]) => (
            <button
              key={key}
              type="button"
              className={`region-pill-btn ${selectedRegion === key ? 'active' : ''}`}
              onClick={() => onSelectRegion(key)}
            >
              <span className="pill-dot" />
              <span className="pill-name">{reg.name}</span>
              <span className="pill-loc">({reg.location.split(',')[0]})</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
