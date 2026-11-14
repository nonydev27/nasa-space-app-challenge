import React from 'react';
import { NASA_EO_SENSORS } from '../utils/nasaEarthData';

export function SensorsInfoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="title-with-badge">
            <span className="nasa-pill">EARTH OBSERVATION FLEET</span>
            <h3>NASA Satellite & Sensor Intelligence</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p className="sensors-intro">
            Field Shift synthesizes data from seven NASA Earth-observing satellite missions and agroclimatology models to deliver field-scale decision support for farmers:
          </p>

          <div className="sensors-cards-list">
            {Object.entries(NASA_EO_SENSORS).map(([key, sensor]) => (
              <div key={key} className="sensor-detail-card">
                <div className="sensor-top-row">
                  <span className="sensor-name">{sensor.name}</span>
                  <span className="sensor-agency">{sensor.agency}</span>
                </div>
                <div className="sensor-meta-row">
                  <span>Orbit: <strong>{sensor.orbit}</strong></span>
                  <span>Spatial Resolution: <strong>{sensor.resolution}</strong></span>
                </div>
                <div className="sensor-data-box">
                  <strong>What It Measures:</strong> {sensor.whatItMeasures}
                </div>
                <div className="sensor-farmer-benefit">
                  🌾 <strong>Why It Matters to Farmers:</strong> {sensor.whyItMattersToFarmers}
                </div>
              </div>
            ))}
          </div>

          <div className="data-harmonization-note">
            <h5>📐 Spatial Intelligence & Data Harmonization</h5>
            <p>
              To combine coarse-resolution sensors (SMAP at 9km, GRACE at ~300km) with high-resolution field imagery (Landsat at 30m, ECOSTRESS at 70m), Field Shift uses digital elevation models (SRTM) and multispectral vegetation covariates to resample and downscale observations onto a coherent <strong>30-meter field analysis grid</strong>.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="action-btn" onClick={onClose}>
            Close Sensor Explorer
          </button>
        </div>
      </div>
    </div>
  );
}
