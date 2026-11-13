import React, { useState } from 'react';
import { soundFx } from '../utils/soundEffects';
import { REAL_DONKI_EVENTS, REAL_OSDR_STUDIES, PLANETARY_LOCATIONS } from '../utils/nasaData';

export function NASADataModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('donki');

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-badge">
            <span className="nasa-inline-pill">NASA OPEN DATA</span>
            <h3>NASA Science & Data Explorer</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
          >
            ×
          </button>
        </div>

        {/* DATA TABS */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'donki' ? 'active' : ''}`}
            onClick={() => {
              soundFx.playClick();
              setActiveTab('donki');
            }}
          >
            ☀️ Space Weather (DONKI)
          </button>

          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'osdr' ? 'active' : ''}`}
            onClick={() => {
              soundFx.playClick();
              setActiveTab('osdr');
            }}
          >
            🧬 Space Biology (OSDR)
          </button>

          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'planetary' ? 'active' : ''}`}
            onClick={() => {
              soundFx.playClick();
              setActiveTab('planetary');
            }}
          >
            🌕 Artemis & Mars Surface Data
          </button>

          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'challenge' ? 'active' : ''}`}
            onClick={() => {
              soundFx.playClick();
              setActiveTab('challenge');
            }}
          >
            🏆 Space Apps 2026 Challenge Info
          </button>
        </div>

        <div className="modal-body">
          {/* TAB 1: DONKI */}
          {activeTab === 'donki' && (
            <div className="nasa-data-section">
              <div className="section-intro">
                <h4>NASA Space Weather Database (DONKI)</h4>
                <p>
                  The Space Weather Database Of Notifications, Knowledge, and Information (DONKI) is NASA's operational space weather catalog. 
                  It provides near-real-time records of Coronal Mass Ejections (CMEs), Solar Flares, and Solar Energetic Particle (SEP) storms.
                </p>
              </div>

              <div className="data-cards-list">
                {REAL_DONKI_EVENTS.map((evt) => (
                  <div key={evt.id} className="nasa-data-card">
                    <div className="card-top-row">
                      <span className="dataset-id-tag">{evt.catalogId}</span>
                      <span className={`hazard-pill ${evt.hazardLevel.toLowerCase()}`}>
                        {evt.classType} — {evt.hazardLevel} Hazard
                      </span>
                    </div>
                    <h5>{evt.type} from {evt.sourceLocation}</h5>
                    <div className="data-metrics-row">
                      <span>CME Velocity: <strong>{evt.cmeSpeedKms} km/s</strong></span>
                      <span>Kp Index: <strong>{evt.kpIndex}</strong></span>
                      <span>Warning Lead Time: <strong>{evt.warningLeadTimeSec} seconds</strong></span>
                    </div>
                    <p className="card-text">{evt.description}</p>
                    <div className="engineering-lesson">
                      <strong>Mission Trade-off:</strong> {evt.recommendedAction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: OSDR */}
          {activeTab === 'osdr' && (
            <div className="nasa-data-section">
              <div className="section-intro">
                <h4>NASA Open Science Data Repository (OSDR)</h4>
                <p>
                  OSDR is NASA’s open-access repository for biological and health research from spaceflights, 
                  including data from the International Space Station, Space Shuttle missions, and lunar ground analogs.
                </p>
              </div>

              <div className="data-cards-list">
                {REAL_OSDR_STUDIES.map((study) => (
                  <div key={study.accession} className="nasa-data-card">
                    <div className="card-top-row">
                      <span className="dataset-id-tag">Accession: {study.accession}</span>
                      <span className="organism-pill">Subject: {study.organism}</span>
                    </div>
                    <h5>{study.title}</h5>
                    <div className="osdr-findings-box">
                      <strong>Key Research Finding:</strong>
                      <p>{study.keyFinding}</p>
                    </div>
                    <div className="engineering-lesson">
                      <strong>Gameplay Integration:</strong> {study.gameplayImpact}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PLANETARY SURFACE MISSIONS */}
          {activeTab === 'planetary' && (
            <div className="nasa-data-section">
              <div className="section-intro">
                <h4>Artemis Lunar South Pole & Mars Exploration</h4>
                <p>
                  Environmental parameters from NASA's Lunar Reconnaissance Orbiter (LRO), Apollo 17, and Mars Perseverance Rover missions.
                </p>
              </div>

              <div className="data-cards-list">
                {Object.entries(PLANETARY_LOCATIONS).map(([key, loc]) => (
                  <div key={key} className="nasa-data-card">
                    <div className="card-top-row">
                      <span className="dataset-id-tag">{loc.name}</span>
                      <span className="organism-pill">Target Body: {loc.targetBody}</span>
                    </div>
                    <h5>Site: {loc.site}</h5>
                    <div className="data-metrics-row">
                      <span>Gravity: <strong>{loc.gravity}</strong></span>
                      <span>Atmosphere: <strong>{loc.atmosphere}</strong></span>
                      <span>Temp Swings: <strong>{loc.tempRange}</strong></span>
                      <span>Comms Lag: <strong>{loc.commDelay}</strong></span>
                    </div>
                    <p className="card-text">{loc.description}</p>
                    <div className="engineering-lesson">
                      <strong>Primary Survival Hurdle:</strong> {loc.primaryChallenge}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CHALLENGE METADATA & PARTNERS */}
          {activeTab === 'challenge' && (
            <div className="nasa-data-section">
              <div className="section-intro">
                <h4>2026 NASA Space Apps Challenge</h4>
                <p>
                  <strong>Challenge:</strong> Build a Junior Astronaut Mission Trainer  
                  <br />
                  <strong>Audience:</strong> Beginner / Youth & Intermediate (Ages 7–12)  
                  <br />
                  <strong>Core Question:</strong> How can kids experience firsthand the authentic engineering trade-offs that determine whether a deep space outpost survives?
                </p>
              </div>

              <div className="challenge-attribution-box">
                <h5>Official Funding & Contract Partners</h5>
                <p>
                  NASA Space Apps is funded by NASA's <strong>Science Mission Directorate</strong> through a contract with <strong>Booz Allen Hamilton</strong>, <strong>Mindgrub</strong>, and <strong>SecondMuse</strong>.
                </p>
                <div className="partner-badges-list">
                  <span className="partner-chip">NASA Science Mission Directorate</span>
                  <span className="partner-chip">Booz Allen Hamilton</span>
                  <span className="partner-chip">Mindgrub</span>
                  <span className="partner-chip">SecondMuse</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="modal-action-btn"
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
          >
            Return to Mission Deck
          </button>
        </div>
      </div>
    </div>
  );
}
