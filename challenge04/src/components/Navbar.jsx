import React from 'react';
import { soundFx } from '../utils/soundEffects';

export function Navbar({
  state,
  onTogglePause,
  onSetSpeed,
  onToggleSound,
  soundMuted,
  onOpenGlossary,
  onOpenNASAData,
  onOpenMissionSelect,
  onToggleMode,
  activeMission
}) {
  return (
    <header className="trainer-navbar">
      <div className="nav-brand-section">
        <div className="nasa-badge" onClick={onOpenNASAData} title="NASA Space Apps 2026 Challenge">
          <span className="nasa-meatball">NASA</span>
          <span className="badge-text">SPACE APPS 2026</span>
        </div>
        <div className="title-group">
          <h1 className="app-title">
            <span className="title-highlight">OUTPOST COMMANDER</span>
            <span className="title-sub">Junior Astronaut Mission Trainer</span>
          </h1>
          <div className="mission-tag-pill" onClick={onOpenMissionSelect}>
            <span className="loc-icon">{state.location === 'moon' ? '🌕' : '🔴'}</span>
            <span className="mission-name">{activeMission?.title || 'Sandbox Outpost'}</span>
            <span className="change-hint">▾ Change Mission</span>
          </div>
        </div>
      </div>

      <div className="nav-center-telemetry">
        <div className="time-display">
          <div className="sol-badge">SOL {state.sol}</div>
          <div className="clock-time">
            {Math.floor(state.hour).toString().padStart(2, '0')}:
            {Math.floor((state.hour % 1) * 60).toString().padStart(2, '0')}
            <span className="cycle-indicator">
              {state.isDaylight ? ' ☀️ DAYLIGHT' : ' 🌑 NIGHT'}
            </span>
          </div>
        </div>

        <div className="speed-controls">
          <button
            type="button"
            className={`speed-btn ${state.paused ? 'active' : ''}`}
            onClick={() => {
              soundFx.playClick();
              onTogglePause();
            }}
            title={state.paused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {state.paused ? '▶' : '⏸'}
          </button>
          {[1, 3, 5].map((spd) => (
            <button
              key={spd}
              type="button"
              className={`speed-btn ${state.speed === spd && !state.paused ? 'active' : ''}`}
              onClick={() => {
                soundFx.playClick();
                onSetSpeed(spd);
              }}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      <div className="nav-actions">
        {/* Cadet vs Flight Director toggle */}
        <div
          className={`mode-toggle ${state.mode}`}
          onClick={() => {
            soundFx.playToggle(state.mode === 'cadet');
            onToggleMode();
          }}
          title="Switch difficulty mode"
        >
          <span className={`mode-label ${state.mode === 'cadet' ? 'selected' : ''}`}>
            🌱 Cadet (7-9)
          </span>
          <span className={`mode-label ${state.mode === 'director' ? 'selected' : ''}`}>
            🚀 Director (10+)
          </span>
        </div>

        {/* NASA Data Explorer button */}
        <button
          type="button"
          className="nav-btn nasa-data-btn"
          onClick={() => {
            soundFx.playClick();
            onOpenNASAData();
          }}
          title="Explore real NASA DONKI and OSDR open science data"
        >
          <span className="btn-icon">📡</span>
          <span>NASA Data</span>
        </button>

        {/* Space Glossary button */}
        <button
          type="button"
          className="nav-btn glossary-btn"
          onClick={() => {
            soundFx.playClick();
            onOpenGlossary();
          }}
          title="Open Plain-Language Space Glossary"
        >
          <span className="btn-icon">📖</span>
          <span>Glossary</span>
        </button>

        {/* Sound toggle button */}
        <button
          type="button"
          className="nav-btn sound-btn"
          onClick={() => {
            soundFx.playClick();
            onToggleSound();
          }}
          title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {soundMuted ? '🔇' : '🔊'}
        </button>
      </div>
    </header>
  );
}
