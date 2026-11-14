import React from 'react';
import { AlertOctagon, AlertTriangle, Shield, ShieldCheck, Radio, Hourglass } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';

export function IncidentAlertBanner({
  alert,
  onResolveAlert,
  onOpenDONKI,
  state
}) {
  if (!alert) return null;

  const isDONKI = alert.source === 'DONKI';
  const isSheltered = state.toggles.bunkerLockdown;
  const isDeflectorOn = state.toggles.magneticShieldActive;

  return (
    <div className={`incident-banner-container ${alert.severity}`}>
      <div className="incident-pulse-icon">
        {isDONKI ? <AlertOctagon size={26} color="#ff3344" /> : <AlertTriangle size={26} color="#ffb000" />}
      </div>

      <div className="incident-content">
        <div className="incident-title-row">
          <span className="incident-badge">{alert.source} EARLY WARNING SYSTEM</span>
          <h4 className="incident-title">{alert.title}</h4>
          {alert.countdownSec > 0 && (
            <span className="incident-countdown">
              <Hourglass size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              IMPACT IN: <strong>{Math.ceil(alert.countdownSec)}s</strong>
            </span>
          )}
        </div>
        <p className="incident-message">{alert.message}</p>

        {/* DECISION CHOICES */}
        <div className="incident-actions-row">
          <button
            type="button"
            className={`incident-choice-btn primary ${isSheltered ? 'active-success' : ''}`}
            onClick={() => {
              soundFx.playShieldActivate();
              onResolveAlert('bunker');
            }}
          >
            <Shield size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            {isSheltered ? 'CREW SAFELY SHELTERED' : 'SEAL CREW IN UNDERGROUND BUNKER'}
          </button>

          <button
            type="button"
            className={`incident-choice-btn secondary ${isDeflectorOn ? 'active-success' : ''}`}
            onClick={() => {
              soundFx.playToggle(!isDeflectorOn);
              onResolveAlert('shield');
            }}
          >
            <ShieldCheck size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            {isDeflectorOn ? 'MAGNETIC DEFLECTOR ACTIVE' : 'ENGAGE MAGNETIC DEFLECTOR (-45 kW)'}
          </button>

          <button
            type="button"
            className="incident-choice-btn tertiary"
            onClick={onOpenDONKI}
            title="Inspect real NASA DONKI space weather catalog"
          >
            <Radio size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            View DONKI Data
          </button>
        </div>
      </div>
    </div>
  );
}
