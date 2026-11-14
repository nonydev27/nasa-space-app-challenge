import { AlertOctagon, AlertTriangle, Shield, ShieldCheck, Radio, Hourglass } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';
import { POWER } from '../utils/simulationEngine';

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
          <span className="incident-badge">SPACE WEATHER WARNING</span>
          <h4 className="incident-title">{alert.title}</h4>
          {alert.countdownSec > 0 && (
            <span className="incident-countdown">
              <Hourglass size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              IMPACT IN: <strong>{Math.ceil(alert.countdownSec)}s</strong>
            </span>
          )}
        </div>
        <p className="incident-message">{alert.impactHandled ? 'The storm is here. Stay sheltered until the all-clear.' : alert.message}</p>
        {alert.basedOn && (
          <p className="incident-basis">
            <span className={`tag ${alert.basedOn.live ? 'live' : 'archive'}`}>{alert.basedOn.live ? 'LIVE NASA DATA' : 'REAL PAST EVENT'}</span>{' '}
            Modelled on {alert.basedOn.label} ({alert.basedOn.date}).{' '}
            <a href={alert.basedOn.url} target="_blank" rel="noreferrer">DONKI record</a>
          </p>
        )}

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
            {isSheltered ? 'CREW SHELTERED' : 'GO TO THE BUNKER (no science while inside)'}
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
            {isDeflectorOn ? 'DEFLECTOR ON' : `RAISE DEFLECTOR (uses ${POWER.deflectorKW} kW)`}
          </button>

          <button
            type="button"
            className="incident-choice-btn tertiary"
            onClick={onOpenDONKI}
            title="Inspect real NASA DONKI space weather catalog"
          >
            <Radio size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            See the real data
          </button>
        </div>
      </div>
    </div>
  );
}
