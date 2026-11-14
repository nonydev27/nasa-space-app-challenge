import { useEffect, useMemo, useRef, useState } from 'react';
import { soundFx } from '../utils/soundEffects';
import { ACCENT_SWATCHES, AVATARS, findAvatar } from '../game/avatars';
import { savePilot } from '../game/profileStore';
import { AvatarStage, JUMP_SPEED } from '../scene/AvatarStage';
import { AvatarBadge } from '../components/AvatarBadge';
import type { PilotProfile } from '../game/types';

type World = { id: 'earth' | 'mars' | 'moon'; name: string; g: number; fraction: string; icon: string };

/** Real surface gravity (NASA planetary fact sheets). */
const WORLDS: World[] = [
  { id: 'earth', name: 'Earth', g: 9.81, fraction: 'normal', icon: '🌍' },
  { id: 'mars', name: 'Mars', g: 3.71, fraction: 'about 3/8 of Earth', icon: '🔴' },
  { id: 'moon', name: 'the Moon', g: 1.62, fraction: 'about 1/6 of Earth', icon: '🌙' }
];
const earthPeak = (JUMP_SPEED * JUMP_SPEED) / (2 * 9.81);

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
  const [lab, setLab] = useState<{ world: World; peak: number } | null>(null);
  const [jumping, setJumping] = useState(false);

  const jump = (w: World) => {
    if (jumping) return;
    soundFx.playJump();
    setJumping(true);
    setLab(null);
    stageRef.current?.jump(w.g, (peak) => {
      soundFx.playLand(0.6);
      setJumping(false);
      setLab({ world: w, peak });
    });
  };

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
        <div className="gravity-lab glass">
          <span className="eyebrow">Gravity lab · same jump, three worlds</span>
          <div className="lab-buttons">
            {WORLDS.map((w) => (
              <button key={w.id} type="button" className={`lab-btn ${w.id}`} disabled={jumping} onClick={() => jump(w)}>
                <span aria-hidden="true">{w.icon}</span> Jump on {w.name}
              </button>
            ))}
          </div>
          <p className="lab-result" aria-live="polite">
            {lab
              ? `${lab.world.name}: you jumped ${lab.peak.toFixed(2)} m high${lab.world.id === 'earth' ? '.' : `, ${(lab.peak / earthPeak).toFixed(1)}× higher than on Earth!`} Gravity there is ${lab.world.g} m/s² (${lab.world.fraction}).`
              : 'Tap a world to jump. Weaker gravity pulls you down more gently, so you fly higher. Drag the astronaut to spin them, tap to wave!'}
          </p>
        </div>
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
