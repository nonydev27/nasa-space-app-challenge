import { useState, type FormEvent } from 'react';
import { User, Award } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';
import { callsignTaken, createPilot, deletePilot, loadPilots, setActivePilot } from '../game/profileStore';
import { findAvatar } from '../game/avatars';
import { AvatarBadge } from '../components/AvatarBadge';
import type { AgeGroup, PilotProfile } from '../game/types';

interface Props {
  onSignedIn: (pilot: PilotProfile) => void;
}

export function SignUpScreen({ onSignedIn }: Props) {
  const [pilots, setPilots] = useState<PilotProfile[]>(() => loadPilots());
  const [callsign, setCallsign] = useState('');
  const [fullName, setFullName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('cadet');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const cs = callsign.trim();
    if (cs.length < 2 || cs.length > 16) return setError('Callsign must be 2–16 characters.');
    if (!/^[\p{L}\p{N} _-]+$/u.test(cs)) return setError('Use letters, numbers, spaces, - or _ only.');
    if (callsignTaken(cs)) return setError('That callsign is taken on this device. Pick another!');
    if (!fullName.trim()) return setError('Tell Mission Control your name.');
    soundFx.playSuccess();
    onSignedIn(createPilot(cs, fullName, ageGroup));
  };

  const resume = (p: PilotProfile) => {
    soundFx.playClick();
    setActivePilot(p.id);
    onSignedIn(p);
  };

  const remove = (p: PilotProfile) => {
    if (!window.confirm(`Remove pilot "${p.callsign}" and all their mission progress from this device?`)) return;
    deletePilot(p.id);
    setPilots(loadPilots());
  };

  return (
    <div className="screen signup-screen">
      <div className="signup-hero">
        <div className="hero-planet hero-moon" />
        <div className="hero-planet hero-mars" />
        <div className="hero-orbit" />
        <div className="hero-copy">
          <span className="eyebrow">NASA SPACE APPS 2026 · JUNIOR ASTRONAUT MISSION TRAINER</span>
          <h1>
            Outpost
            <br />
            Commander
          </h1>
          <p>
            Run a real base on the Moon and Mars. Balance power, air, food and radiation using NASA DONKI space-weather and OSDR
            biology data. Every choice has a trade-off.
          </p>
          <ul className="hero-steps">
            <li><b>1</b> Enlist</li>
            <li><b>2</b> Choose your astronaut</li>
            <li><b>3</b> Unlock 5 missions, one at a time</li>
          </ul>
        </div>
      </div>

      <div className="signup-panel glass">
        <form onSubmit={submit} className="signup-form" noValidate>
          <h2>Astronaut Enlistment</h2>
          <label>
            <span>Callsign</span>
            <input value={callsign} onChange={(e) => { setCallsign(e.target.value); setError(null); }} placeholder="e.g. StarHopper" maxLength={16} autoFocus />
          </label>
          <label>
            <span>Your name</span>
            <input value={fullName} onChange={(e) => { setFullName(e.target.value); setError(null); }} placeholder="First name is fine" maxLength={40} />
          </label>
          <fieldset className="age-choice">
            <legend>Training track</legend>
            <button type="button" className={ageGroup === 'cadet' ? 'on' : ''} onClick={() => { soundFx.playClick(); setAgeGroup('cadet'); }}>
              <b><User size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Cadet</b>
              <small>Ages 7–9 · AstroBot guides you</small>
            </button>
            <button type="button" className={ageGroup === 'director' ? 'on' : ''} onClick={() => { soundFx.playClick(); setAgeGroup('director'); }}>
              <b><Award size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Flight Director</b>
              <small>Ages 10+ · full telemetry</small>
            </button>
          </fieldset>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="cta">Enlist &amp; Continue →</button>
          <p className="fine-print">Your profile and progress are saved on this device only.</p>
        </form>

        {pilots.length > 0 && (
          <div className="returning-pilots">
            <h3>Returning pilots</h3>
            <div className="pilot-list">
              {pilots.map((p) => (
                <div key={p.id} className="pilot-chip">
                  <button type="button" className="pilot-resume" onClick={() => resume(p)}>
                    <AvatarBadge avatar={findAvatar(p.avatarId, p.accentOverride)} size={36} />
                    <span>
                      <b>{p.callsign}</b>
                      <small>{Object.keys(p.completed).length} / 5 missions</small>
                    </span>
                  </button>
                  <button type="button" className="pilot-remove" onClick={() => remove(p)} aria-label={`Remove ${p.callsign}`}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
