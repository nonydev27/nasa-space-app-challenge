import { useState, type CSSProperties } from 'react';
import { soundFx } from '../utils/soundEffects';
import { BADGE_DEFINITIONS, MISSION_CAMPAIGNS, PLANETARY_LOCATIONS } from '../utils/nasaData';
import { allBadges, isMissionUnlocked, MISSION_ORDER, SANDBOX_ID } from '../game/profileStore';
import { findAvatar } from '../game/avatars';
import { AvatarBadge } from '../components/AvatarBadge';
import type { PilotProfile } from '../game/types';

// Node centres (% of the track area). The dashed route is drawn through the same points.
const NODE_POS: Array<[number, number]> = [[9, 52], [24, 30], [38, 62], [53, 38], [68, 66], [86, 40]];

function trackPath(): string {
  const [first, ...rest] = NODE_POS;
  let d = `M${first[0]} ${first[1]}`;
  let prev = first;
  for (const p of rest) {
    const mx = (prev[0] + p[0]) / 2;
    d += ` C${mx} ${prev[1]}, ${mx} ${p[1]}, ${p[0]} ${p[1]}`;
    prev = p;
  }
  return d;
}

interface Props {
  pilot: PilotProfile;
  onLaunch: (missionId: string, location: 'moon' | 'mars') => void;
  onEditAvatar: () => void;
  onSignOut: () => void;
}

export function MissionMapScreen({ pilot, onLaunch, onEditAvatar, onSignOut }: Props) {
  const firstOpen = [...MISSION_ORDER].reverse().find((id) => isMissionUnlocked(pilot, id)) ?? MISSION_ORDER[0];
  const [selected, setSelected] = useState<string>(firstOpen);
  const [sandboxLoc, setSandboxLoc] = useState<'moon' | 'mars'>('moon');
  const avatar = findAvatar(pilot.avatarId, pilot.accentOverride);
  const badges = allBadges(pilot);
  const done = MISSION_ORDER.filter((id) => pilot.completed[id]).length;

  const nodes = [...MISSION_CAMPAIGNS.map((m) => ({ id: m.id, loc: m.location as 'moon' | 'mars', title: m.title })), { id: SANDBOX_ID, loc: sandboxLoc, title: 'Sandbox Outpost' }];
  const mission = MISSION_CAMPAIGNS.find((m) => m.id === selected);
  const unlocked = isMissionUnlocked(pilot, selected);
  const result = pilot.completed[selected];
  const prevTitle = (() => {
    if (selected === SANDBOX_ID) return 'all five missions';
    const idx = MISSION_ORDER.indexOf(selected);
    return MISSION_CAMPAIGNS[idx - 1]?.title ?? '';
  })();

  return (
    <div className="screen map-screen">
      <header className="map-topbar">
        <button type="button" className="pilot-card" onClick={onEditAvatar} title="Change astronaut">
          <AvatarBadge avatar={avatar} size={46} />
          <span>
            <b>{pilot.callsign}</b>
            <small>{avatar.name} · {avatar.role}</small>
          </span>
        </button>
        <div className="campaign-progress">
          <span>Campaign</span>
          <div className="progress-track"><i style={{ width: `${(done / MISSION_ORDER.length) * 100}%` }} /></div>
          <b>{done}/{MISSION_ORDER.length}</b>
        </div>
        <div className="badge-shelf" title="Badges earned">
          {BADGE_DEFINITIONS.map((b) => (
            <span key={b.id} className={`shelf-badge ${badges.includes(b.id) ? 'earned' : ''}`} title={`${b.title}: ${b.description}`}>
              {b.icon}
            </span>
          ))}
        </div>
        <button type="button" className="ghost small" onClick={onSignOut}>Switch pilot</button>
      </header>

      <div className="map-body">
        <div className="mission-track">
          <svg className="track-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d={trackPath()} />
          </svg>
          {nodes.map((n, i) => {
            const open = isMissionUnlocked(pilot, n.id);
            const complete = Boolean(pilot.completed[n.id]);
            return (
              <button
                key={n.id}
                type="button"
                className={`track-node ${n.loc} ${open ? 'open' : 'locked'} ${complete ? 'complete' : ''} ${selected === n.id ? 'on' : ''}`}
                style={{ left: `${NODE_POS[i][0]}%`, top: `${NODE_POS[i][1]}%` } as CSSProperties}
                onClick={() => { soundFx.playClick(); setSelected(n.id); }}
                aria-label={`${n.title}${open ? '' : ' (locked)'}`}
              >
                <span className="planet" />
                <span className="node-status">{complete ? '★' : open ? '' : '🔒'}</span>
                <span className="node-label">
                  <small>{n.id === SANDBOX_ID ? 'BONUS' : `MISSION ${i + 1}`}</small>
                  {n.title.replace(/^Mission \d+: /, '')}
                </span>
              </button>
            );
          })}
        </div>

        <aside className="mission-brief glass">
          {selected === SANDBOX_ID ? (
            <>
              <span className="eyebrow">BONUS · FREEFORM</span>
              <h2>Sandbox Outpost</h2>
              <p>No timers, no orders. Test any configuration you like on the Moon or Mars.</p>
              <div className="seg">
                <button type="button" className={sandboxLoc === 'moon' ? 'on' : ''} onClick={() => setSandboxLoc('moon')}>🌕 Moon</button>
                <button type="button" className={sandboxLoc === 'mars' ? 'on' : ''} onClick={() => setSandboxLoc('mars')}>🔴 Mars</button>
              </div>
            </>
          ) : mission ? (
            <>
              <span className="eyebrow">{mission.location === 'moon' ? '🌕 LUNAR' : '🔴 MARTIAN'} · {mission.difficulty.toUpperCase()}</span>
              <h2>{mission.title.replace(/^Mission \d+: /, '')}</h2>
              <p className="tagline">{mission.tagline}</p>
              {unlocked ? <p>{mission.story}</p> : <p className="redacted">Mission file classified. {mission.tagline}.</p>}
              <dl className="brief-facts">
                <div><dt>Site</dt><dd>{PLANETARY_LOCATIONS[mission.location as 'moon' | 'mars'].site}</dd></div>
                <div><dt>Survive</dt><dd>{mission.goal.targetSols} Sols</dd></div>
                <div><dt>O₂ / Battery</dt><dd>≥{mission.goal.minO2}% / ≥{mission.goal.minBattery}%</dd></div>
                {result && <div><dt>Best score</dt><dd>{result.bestScore.toLocaleString()} pts</dd></div>}
              </dl>
            </>
          ) : null}

          {unlocked ? (
            <button
              type="button"
              className="cta"
              onClick={() => {
                soundFx.playSuccess();
                onLaunch(selected, selected === SANDBOX_ID ? sandboxLoc : (mission?.location as 'moon' | 'mars'));
              }}
            >
              {result ? '↻ Fly again' : '▶ Begin briefing'}
            </button>
          ) : (
            <div className="locked-note">🔒 Complete <b>{prevTitle}</b> to unlock.</div>
          )}
        </aside>
      </div>
    </div>
  );
}
