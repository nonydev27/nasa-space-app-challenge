import React, { useState } from 'react';

export function FieldMapVisualizer({ regionData }) {
  const [activeLayer, setActiveLayer] = useState('ndvi'); // 'trueColor' | 'ndvi' | 'smap' | 'ecostress' | 'srtm'
  const [selectedParcelId, setSelectedParcelId] = useState(regionData.fieldParcels[0]?.id || 'p1');

  const selectedParcel = regionData.fieldParcels.find((p) => p.id === selectedParcelId) || regionData.fieldParcels[0];

  const LAYERS = [
    { id: 'ndvi', name: '🌿 Landsat 8/9 NDVI', sub: 'Vegetation Vigor & Bare Soil', legend: '0.10 (Bare Dirt) ➔ 0.85 (Dense Canopy)' },
    { id: 'smap', name: '💧 SMAP Soil Moisture', sub: 'Root-Zone Volumetric Water', legend: '0.05 (Parched) ➔ 0.40 m³/m³ (Saturated)' },
    { id: 'ecostress', name: '☀️ ECOSTRESS ET', sub: 'Evapotranspiration & Heat Stress', legend: '1.0 mm/day (Cool) ➔ 8.0 mm/day (Thermal Stress)' },
    { id: 'srtm', name: '⛰️ SRTM Slope / Erosion', sub: 'Topographic Runoff Hazards', legend: '0% Flat ➔ 7%+ Severe Gully Risk' },
    { id: 'trueColor', name: '🛰️ True-Color Aerial', sub: 'High-Res Optical Surface', legend: 'Field Boundaries & Water Infrastructure' }
  ];

  return (
    <div className="field-gis-container">
      {/* TOP GIS TOOLBAR */}
      <div className="gis-toolbar">
        <div className="gis-title-group">
          <span className="gis-icon">🛰️</span>
          <div>
            <h3>FARM SATELLITE OBSERVATION DECK</h3>
            <span className="gis-location-text">
              {regionData.name} — {regionData.location}
            </span>
          </div>
        </div>

        {/* Layer Selector Tabs */}
        <div className="layer-pills-row">
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              type="button"
              className={`layer-btn ${activeLayer === layer.id ? 'active' : ''}`}
              onClick={() => setActiveLayer(layer.id)}
            >
              <span>{layer.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN MAP VIEWER & PARCEL INSPECTOR GRID */}
      <div className="gis-viewer-grid">
        {/* INTERACTIVE MAP CANVAS VIEW */}
        <div className={`gis-map-viewport layer-${activeLayer}`}>
          {/* Legend Banner */}
          <div className="gis-legend-overlay">
            <span className="legend-title">ACTIVE LAYER: {LAYERS.find(l => l.id === activeLayer)?.name}</span>
            <span className="legend-scale">{LAYERS.find(l => l.id === activeLayer)?.legend}</span>
          </div>

          {/* Simulated Satellite Field Parcels Graphic */}
          <div className="parcels-interactive-overlay">
            {regionData.fieldParcels.map((parcel, idx) => {
              const isSelected = parcel.id === selectedParcelId;
              let fillGradientClass = 'fill-healthy';
              if (activeLayer === 'ndvi') {
                fillGradientClass = parcel.ndvi < 0.25 ? 'fill-bare' : parcel.ndvi < 0.6 ? 'fill-moderate' : 'fill-lush';
              } else if (activeLayer === 'smap') {
                fillGradientClass = parcel.soilMoisture < 0.10 ? 'fill-drought' : parcel.soilMoisture < 0.25 ? 'fill-adequate' : 'fill-surplus';
              } else if (activeLayer === 'ecostress') {
                fillGradientClass = parcel.etRate > 6.0 ? 'fill-heat-stress' : parcel.etRate > 3.0 ? 'fill-moderate-et' : 'fill-low-et';
              } else if (activeLayer === 'srtm') {
                fillGradientClass = parcel.slopePct > 4.0 ? 'fill-steep' : 'fill-gentle';
              }

              return (
                <div
                  key={parcel.id}
                  className={`parcel-boundary-box parcel-${idx} ${fillGradientClass} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedParcelId(parcel.id)}
                >
                  <div className="parcel-inner-content">
                    <span className="parcel-tag-id">{parcel.name}</span>
                    <span className="parcel-acres-tag">{parcel.acres} Acres</span>
                    <div className="parcel-metric-badge">
                      {activeLayer === 'ndvi' && `NDVI: ${parcel.ndvi.toFixed(2)}`}
                      {activeLayer === 'smap' && `Moisture: ${(parcel.soilMoisture * 100).toFixed(0)}%`}
                      {activeLayer === 'ecostress' && `ET: ${parcel.etRate} mm/d`}
                      {activeLayer === 'srtm' && `Slope: ${parcel.slopePct}%`}
                      {activeLayer === 'trueColor' && `Soil: ${regionData.soilType.split(' ')[0]}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="gis-compass">N ▲</div>
        </div>

        {/* RIGHT SIDEBAR: FIELD PARCEL TELEMETRY INSPECTOR */}
        <div className="parcel-telemetry-card">
          <div className="telemetry-header">
            <h4>PARCEL TELEMETRY: {selectedParcel.name}</h4>
            <span className="acres-badge">{selectedParcel.acres} Acres</span>
          </div>

          <div className="metrics-readout-grid">
            <div className="metric-box">
              <span className="box-lbl">🌿 Landsat NDVI</span>
              <span className="box-val">{selectedParcel.ndvi.toFixed(2)}</span>
              <span className="box-status">
                {selectedParcel.ndvi < 0.2 ? '⚠️ Bare Unprotected Soil' : selectedParcel.ndvi < 0.5 ? 'Moderate Cover' : '✨ Dense Crop Canopy'}
              </span>
            </div>

            <div className="metric-box">
              <span className="box-lbl">💧 SMAP Soil Moisture</span>
              <span className="box-val">{(selectedParcel.soilMoisture * 100).toFixed(0)}% vol</span>
              <span className="box-status">
                {selectedParcel.soilMoisture < 0.10 ? '🔴 Severe Deficit' : '🟢 Adequate Root Water'}
              </span>
            </div>

            <div className="metric-box">
              <span className="box-lbl">☀️ ECOSTRESS ET Rate</span>
              <span className="box-val">{selectedParcel.etRate} mm/day</span>
              <span className="box-status">
                {selectedParcel.etRate > 6.0 ? '🔥 High Evaporative Strain' : 'Moderate Water Demand'}
              </span>
            </div>

            <div className="metric-box">
              <span className="box-lbl">⛰️ SRTM Slope / Runoff</span>
              <span className="box-val">{selectedParcel.slopePct}% Slope</span>
              <span className="box-status">
                Erosion Risk: <strong>{selectedParcel.erosionRisk}</strong>
              </span>
            </div>
          </div>

          {/* Regional Context Summary */}
          <div className="regional-satellite-highlights">
            <h5>🛰️ Regional NASA Earth Observations Context</h5>
            <ul>
              <li><strong>SMAP:</strong> {regionData.satelliteHighlights.smap}</li>
              <li><strong>ECOSTRESS:</strong> {regionData.satelliteHighlights.ecostress}</li>
              <li><strong>GPM Rainfall:</strong> {regionData.satelliteHighlights.gpm}</li>
              <li><strong>GRACE Aquifer:</strong> {regionData.satelliteHighlights.grace}</li>
              <li><strong>NASA POWER:</strong> {regionData.satelliteHighlights.power}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
