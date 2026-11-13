import React from 'react';
import { soundFx } from '../utils/soundEffects';
import { BADGE_DEFINITIONS } from '../utils/nasaData';

export function MissionDebriefModal({
  isOpen,
  state,
  activeMission,
  onRestart,
  onOpenMissions
}) {
  if (!isOpen) return null;

  const isSuccess = state.completed && !state.failed;
  const isFail = state.failed;

  // Calculate score
  const scienceScore = Math.round(state.sciencePoints * 10);
  const healthScore = Math.round(state.crewHealth * 5);
  const moraleScore = Math.round(state.crewMorale * 3);
  const totalScore = Math.max(0, scienceScore + healthScore + moraleScore);

  // Unlocked badges
  const earnedBadges = BADGE_DEFINITIONS.filter((b) =>
    state.unlockedBadges.includes(b.id)
  );

  return (
    <div className="modal-backdrop">
      <div className={`modal-dialog debrief-dialog ${isSuccess ? 'debrief-success' : 'debrief-fail'}`}>
        <div className="debrief-banner">
          <span className="debrief-icon">{isSuccess ? '🏆⭐' : '💥⚠️'}</span>
          <h2>{isSuccess ? 'MISSION ACCOMPLISHED!' : 'MISSION CRITICAL FAILURE'}</h2>
          <p className="debrief-sub">
            {isSuccess
              ? `You successfully led ${activeMission?.title || 'the Outpost'} through ${state.sol} Sols!`
              : state.failureReason || 'The outpost suffered an unrecoverable life support or power breakdown.'}
          </p>
        </div>

        <div className="debrief-body">
          {/* Scorecards */}
          <div className="scorecard-grid">
            <div className="scorecard-box">
              <span className="box-label">Sols Survived</span>
              <span className="box-val">{state.sol} Sols</span>
            </div>
            <div className="scorecard-box">
              <span className="box-label">Science Points</span>
              <span className="box-val">🔬 {Math.round(state.sciencePoints)}</span>
            </div>
            <div className="scorecard-box">
              <span className="box-label">Crew Health</span>
              <span className="box-val">❤️ {Math.round(state.crewHealth)}%</span>
            </div>
            <div className="scorecard-box highlight">
              <span className="box-label">Flight Commander Score</span>
              <span className="box-val">{totalScore} PTS</span>
            </div>
          </div>

          {/* Badges Earned */}
          {earnedBadges.length > 0 && (
            <div className="earned-badges-section">
              <h4>🎖️ Astronaut Wings & Badges Earned</h4>
              <div className="badges-list">
                {earnedBadges.map((badge) => (
                  <div key={badge.id} className="earned-badge-card">
                    <span className="badge-icon-lg">{badge.icon}</span>
                    <div>
                      <strong>{badge.title}</strong>
                      <p>{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real NASA Engineering Debrief */}
          <div className="nasa-engineering-debrief-card">
            <h4>🚀 NASA Engineering Debrief</h4>
            <p>
              {isSuccess
                ? "Every decision you made mirrored the daily realities of NASA flight directors. By prioritizing life support during power shortages, using regolith for radiation shielding, and maintaining the hydroponic food cycle, your outpost proved that sustainable human presence in deep space is achievable!"
                : "In real spaceflight, failure is often the greatest teacher. Apollo 13 and early space stations experienced cascading power and oxygen crises. Review your power routing and shelter protocols, and try the simulation again!"}
            </p>
          </div>
        </div>

        <div className="debrief-actions">
          <button
            type="button"
            className="modal-action-btn secondary"
            onClick={() => {
              soundFx.playClick();
              onOpenMissions();
            }}
          >
            📋 Select Another Mission
          </button>
          <button
            type="button"
            className="modal-action-btn primary"
            onClick={() => {
              soundFx.playSuccess();
              onRestart();
            }}
          >
            🔄 Retry Mission
          </button>
        </div>
      </div>
    </div>
  );
}
