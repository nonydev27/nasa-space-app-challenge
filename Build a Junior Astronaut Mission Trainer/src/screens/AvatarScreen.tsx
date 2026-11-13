import { useEffect, useMemo, useRef, useState } from 'react';
import { soundFx } from '../utils/soundEffects';
import { ACCENT_SWATCHES, AVATARS, findAvatar } from '../game/avatars';
import { savePilot } from '../game/profileStore';
import { AvatarStage } from '../scene/AvatarStage';
import { AvatarBadge } from '../components/AvatarBadge';
import type { PilotProfile } from '../game/types';

interface Props {
  pilot: PilotProfile;
  onDone: (pilot: PilotProfile) => void;
  onBack?: () => void;
}

export function AvatarScreen({ pilot, onDone, onBack }: Props) {
  const [avatarId, setAvatarId] = useState(pilot.avatarId ?? AVATARS[0].id);
  const [accent, setAccent] = useState<string | null>(pilot.accentOverride);
  const avatar = useMemo(() => findAvatar(avatarId, accent), [avatarId, accent]);
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<AvatarStage | null>(null);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    if (!hostRef.current) return;
    try {
      stageRef.current = new AvatarStage(hostRef.current);
    } catch {
      setWebglError(true);
    }
    return () => {
      stageRef.current?.dispose();
      stageRef.current = null;
    };
  }, []);

  useEffect(() => {
    stageRef.current?.setAvatar(avatar);
  }, [avatar]);

  const confirm = () => {
    soundFx.playSuccess();
    onDone(savePilot({ ...pilot, avatarId, accentOverride: accent }));
  };

  return (
    <div className="screen avatar-screen">
      <aside className="avatar-roster glass">
        <header>
          <span className="eyebrow">STEP 2 OF 2</span>
          <h2>Choose your astronaut</h2>
        </header>
        <div className="roster-grid">
          {AVATARS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`roster-card ${a.id === avatarId ? 'on' : ''}`}
              onClick={() => { soundFx.playClick(); setAvatarId(a.id); setAccent(null); }}
            >
              <AvatarBadge avatar={a} size={48} />
              <span>
                <b>{a.name}</b>
                <small>{a.role}</small>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="avatar-stage" ref={hostRef}>
        {webglError && <div className="scene-error"><AvatarBadge avatar={avatar} size={220} /></div>}
        <div className="stage-floor-glow" />
      </section>

      <aside className="avatar-details glass">
        <span className="eyebrow">CREW FILE · {pilot.callsign.toUpperCase()}</span>
        <h2>{avatar.name}</h2>
        <p className="role">{avatar.role}</p>
        <p className="bio">{avatar.bio}</p>
        <div className="swatches">
          <span>Suit stripes</span>
          <div>
            {ACCENT_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch ${avatar.accent === c ? 'on' : ''}`}
                style={{ background: c }}
                onClick={() => { soundFx.playClick(); setAccent(c); }}
                aria-label={`Stripe colour ${c}`}
              />
            ))}
          </div>
        </div>
        <button type="button" className="cta" onClick={confirm}>Suit up →</button>
        {onBack && <button type="button" className="ghost" onClick={onBack}>← Back</button>}
      </aside>
    </div>
  );
}
