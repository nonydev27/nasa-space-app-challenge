import React, { useState } from 'react';
import { soundFx } from '../utils/soundEffects';
import { MISSION_CAMPAIGNS } from '../utils/nasaData';

export function MissionBriefingModal({
  isOpen,
  onClose,
  onSelectMission,
  currentMissionId
}) {
  const [selectedId, setSelectedId] = useState(currentMissionId || 'mission-1');
  const [sandboxLocation, setSandboxLocation] = useState('moon');

  if (!isOpen) return null;

  const currentCamp = MISSION_CAMPAIGNS.find((m) => m.id === selectedId);

  const handleStart = (missionId, loc) => {
    soundFx.playSuccess();
    onSelectMission(missionId, loc);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-badge">
            <span className="nasa-inline-pill">MISSION DISPATCH</span>
            <h3>Select Outpost Mission Campaign</h3>
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

        <div className="mission-modal-grid">
          {/* Mission List */}
          <div className="mission-cards-col">
            {MISSION_CAMPAIGNS.map((camp) => (
              <div
                key={camp.id}
                className={`mission-select-card ${selectedId === camp.id ? 'active' : ''}`}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedId(camp.id);
                }}
              >
                <div className="mission-card-top">
                  <span className="camp-icon">{camp.location === 'moon' ? '🌕' : '🔴'}</span>
                  <div>
                    <span className="camp-diff-tag">{camp.difficulty}</span>
                    <h5 className="camp-title">{camp.title}</h5>
                  </div>
                </div>
                <p className="camp-tagline">{camp.tagline}</p>
              </div>
            ))}

            {/* Sandbox Card */}
            <div
              className={`mission-select-card sandbox-card ${selectedId === 'sandbox' ? 'active' : ''}`}
              onClick={() => {
                soundFx.playClick();
                setSelectedId('sandbox');
              }}
            >
              <div className="mission-card-top">
                <span className="camp-icon">🛠️</span>
                <div>
                  <span className="camp-diff-tag">Freeform Mode</span>
                  <h5 className="camp-title">Sandbox Outpost Simulator</h5>
                </div>
              </div>
              <p className="camp-tagline">Experiment freely with power, shielding, and survival.</p>
            </div>
          </div>

          {/* Mission Details Preview */}
          <div className="mission-details-col">
            {selectedId === 'sandbox' ? (
              <div className="camp-detail-box">
                <h4>Freeform Outpost Sandbox</h4>
                <p className="camp-story">
                  Design and run your own outpost without predefined mission timers or win/loss restrictions. 
                  Choose your planetary body and test extreme engineering scenarios!
                </p>

                <div className="sandbox-location-picker">
                  <label className="picker-label">Choose Outpost Location:</label>
                  <div className="loc-btn-row">
                    <button
                      type="button"
                      className={`loc-choice-btn ${sandboxLocation === 'moon' ? 'active' : ''}`}
                      onClick={() => setSandboxLocation('moon')}
                    >
                      🌕 Lunar South Pole (Shackleton Crater)
                    </button>
                    <button
                      type="button"
                      className={`loc-choice-btn ${sandboxLocation === 'mars' ? 'active' : ''}`}
                      onClick={() => setSandboxLocation('mars')}
                    >
                      🔴 Martian Jezero Crater
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="modal-action-btn start-mission-btn"
                  onClick={() => handleStart('sandbox', sandboxLocation)}
                >
                  🚀 Launch Sandbox Outpost
                </button>
              </div>
            ) : currentCamp ? (
              <div className="camp-detail-box">
                <div className="camp-header-badge">
                  <span>{currentCamp.location === 'moon' ? 'LUNAR MISSION' : 'MARTIAN MISSION'}</span>
                  <span>Target: {currentCamp.goal.targetSols} Sols</span>
                </div>

                <h4>{currentCamp.title}</h4>
                <p className="camp-story">{currentCamp.story}</p>

                <div className="camp-goals-box">
                  <strong>Mission Success Criteria:</strong>
                  <ul>
                    <li>Survive at least <strong>{currentCamp.goal.targetSols} Sols</strong></li>
                    <li>Maintain Life Support Oxygen above <strong>{currentCamp.goal.minO2}%</strong></li>
                    <li>Keep Battery Reserve above <strong>{currentCamp.goal.minBattery}%</strong></li>
                    <li>Achieve <strong>{currentCamp.goal.scienceTarget}+ Science Points</strong></li>
                  </ul>
                </div>

                <div className="camp-lesson-box">
                  <span className="lesson-icon">💡</span>
                  <div>
                    <strong>Core Engineering Trade-Off:</strong>
                    <p>{currentCamp.educationalLesson}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="modal-action-btn start-mission-btn"
                  onClick={() => handleStart(currentCamp.id, currentCamp.location)}
                >
                  🚀 Launch {currentCamp.title}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
