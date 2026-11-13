import React, { useState } from 'react';
import { soundFx } from '../utils/soundEffects';

export function AstroBotGuide({ state, onGlossaryClick }) {
  const [minimized, setMinimized] = useState(false);

  // Generate dynamic contextual tip based on simulation state
  const totalGen = state.solarOutputKW + state.rtgNuclearOutputKW;
  const totalCons = Object.values(state.powerAllocations).reduce((a, b) => a + b, 0);
  const netPower = totalGen - totalCons;
  const batteryPct = (state.batteryKWh / state.batteryMaxKWh) * 100;

  let message = "All systems nominal, Commander! Keep an eye on battery storage before sunset.";
  let mood = "happy"; // 'happy' | 'alert' | 'thinking'

  if (state.activeAlert?.source === 'DONKI') {
    if (!state.toggles.bunkerLockdown && !state.toggles.magneticShieldActive) {
      message = "🚨 CRITICAL! NASA DONKI detected a massive solar flare! Tap 'Evacuate to Regolith Bunker' immediately to protect the crew!";
      mood = "alert";
    } else {
      message = "Great reaction, Commander! The regolith soil is blocking 90% of the harmful solar radiation!";
      mood = "happy";
    }
  } else if (state.oxygenLevel < 60) {
    message = "⚠️ Crew oxygen is dropping! Make sure ECLSS Life Support has at least 25 kW allocated in the Power Matrix!";
    mood = "alert";
  } else if (batteryPct < 25 && netPower < 0) {
    message = "⚡ Battery reserve is under 25%! Night is cold; reduce power to the Science Lab or Rover dock to save emergency power!";
    mood = "alert";
  } else if (state.foodStockpileSols <= 2 && state.cropGrowthProgress < 80) {
    message = "🥗 Food rations are running low! Boost water and power to the Hydroponic Greenhouse in the Food Bay!";
    mood = "thinking";
  } else if (!state.isDaylight && state.location === 'moon') {
    message = "🌑 Lunar night has arrived! Solar panels produce 0 kW right now. The habitat heaters rely entirely on our RTG battery!";
    mood = "thinking";
  } else if (state.dustStormActive) {
    message = "🌪️ Martian dust storm is blocking 80% of sunlight! Clean power routing is vital until the sky clears.";
    mood = "thinking";
  }

  return (
    <div className={`astrobot-container ${minimized ? 'minimized' : ''} mood-${mood}`}>
      <div
        className="astrobot-avatar"
        onClick={() => {
          soundFx.playClick();
          setMinimized(!minimized);
        }}
        title="AstroBot (Your Mission AI Assistant)"
      >
        <span className="bot-face">
          {mood === 'alert' ? '🤖🚨' : mood === 'thinking' ? '🤖💡' : '🤖✨'}
        </span>
        <span className="bot-name">AstroBot</span>
      </div>

      {!minimized && (
        <div className="astrobot-bubble">
          <div className="bubble-header">
            <span className="cadet-advisor-tag">CADET ADVISOR</span>
            <button
              type="button"
              className="bubble-close-btn"
              onClick={() => {
                soundFx.playClick();
                setMinimized(true);
              }}
              title="Minimize AstroBot tips"
            >
              ×
            </button>
          </div>
          <p className="bubble-text">{message}</p>
          <div className="bubble-footer">
            <span className="hint-label">Tip: Every engineering choice has a trade-off!</span>
          </div>
        </div>
      )}
    </div>
  );
}
