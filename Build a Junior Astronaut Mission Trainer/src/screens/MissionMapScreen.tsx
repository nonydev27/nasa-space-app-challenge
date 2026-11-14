import { useState, type CSSProperties } from 'react';
import { Users, Lock, Moon, Compass, Play, ClipboardList, Star } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';
import { BADGE_DEFINITIONS, MISSION_CAMPAIGNS, PLANETARY_LOCATIONS } from '../utils/nasaData';
import { allBadges, isMissionUnlocked, MISSION_ORDER, SANDBOX_ID } from '../game/profileStore';
import { findAvatar } from '../game/avatars';
import { AvatarBadge } from '../components/AvatarBadge';
import { MissionGuidelinesModal } from '../components/MissionGuidelinesModal';
import type { PilotProfile } from '../game/types';
import { CREW_ERRORS, CrewLink } from '../net/crewLink';

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
  onLaunch: (missionId: string, location: 'moon' | 'mars', crew: CrewLink | null) => void;
  onEditAvatar: () => void;
  onSignOut: () => void;
}

export function MissionMapScreen({ pilot, onLaunch, onEditAvatar, onSignOut }: Props) {
  const firstOpen = [...MISSION_ORDER].reverse().find((id) => isMissionUnlocked(pilot, id)) ?? MISSION_ORDER[0];
  const [selected, setSelected] = useState<string>(firstOpen);
  const [sandboxLoc, setSandboxLoc] = useState<'moon' | 'mars'>('moon');
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const avatar = findAvatar(pilot.avatarId, pilot.accentOverride);
  const badges = allBadges(pilot);
  const done = MISSION_ORDER.filter((id) => pilot.completed[id]).length;
  const [joinOpen, setJoinOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [crewError, setCrewError] = useState<string | null>(null);

  const hostCrew = async (missionId: string, location: 'moon' | 'mars') => {
    setBusy(true);
    setCrewError(null);
    try {
      const link = await CrewLink.open({ t: 'host', missionId, location, name: pilot.callsign, avatar });
      soundFx.playSuccess();
      onLaunch(missionId, location, link);
    } catch (e) {
      setCrewError(CREW_ERRORS[(e as Error).message] ?? CREW_ERRORS.unreachable);
    } finally {
      setBusy(false);
    }
  };

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
        <button type="button" className="join-crew-btn" onClick={() => { soundFx.playClick(); setJoinOpen(true); }}>
          <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} /> Join crew
        </button>
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
                <span className="node-status">{complete ? <Star size={12} fill="#ffb547" color="#ffb547" /> : open ? '' : <Lock size={12} />}</span>
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
                <button type="button" className={sandboxLoc === 'moon' ? 'on' : ''} onClick={() => setSandboxLoc('moon')}>
                  <Moon size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Moon
                </button>
                <button type="button" className={sandboxLoc === 'mars' ? 'on' : ''} onClick={() => setSandboxLoc('mars')}>
                  <Compass size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Mars
                </button>
              </div>
            </>
          ) : mission ? (
            <>
              <span className="eyebrow">
                {mission.location === 'moon' ? <Moon size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> : <Compass size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />}
                {mission.location === 'moon' ? 'LUNAR' : 'MARTIAN'} · {mission.difficulty.toUpperCase()}
              </span>
              <h2>{mission.title.replace(/^Mission \d+: /, '')}</h2>
              <p className="tagline">{mission.tagline}</p>
              {unlocked ? <p>{mission.story}</p> : <p className="redacted">Mission file classified. {mission.tagline}.</p>}
              <dl className="brief-facts">
                <div><dt>Site</dt><dd>{PLANETARY_LOCATIONS[mission.location as 'moon' | 'mars'].site}</dd></div>
                <div><dt>Survive</dt><dd>{mission.goal.targetSols} Sols</dd></div>
                <div><dt>O₂ / Battery</dt><dd>≥{mission.goal.minO2}% / ≥{mission.goal.minBattery}%</dd></div>
                {result && <div><dt>Best score</dt><dd>{result.bestScore.toLocaleString()} pts</dd></div>}
              </dl>
              <button
                type="button"
                className="ghost brief-guidelines-btn"
                onClick={() => setGuidelinesOpen(true)}
              >
                <ClipboardList size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                Mission Guidelines
              </button>
            </>
          ) : null}

          {unlocked ? (
            <div className="launch-group">
              <button
                type="button"
                className="launch-btn"
                onClick={() => {
                  soundFx.playSuccess();
                  onLaunch(selected, selected === SANDBOX_ID ? sandboxLoc : (mission?.location as 'moon' | 'mars'), null);
                }}
              >
                <span className="launch-glow" />
                <Play size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                {result ? 'FLY AGAIN' : 'LAUNCH'}
                <small>solo mission</small>
              </button>
              <button
                type="button"
                className="ghost host-btn"
                disabled={busy}
                onClick={() => hostCrew(selected, selected === SANDBOX_ID ? sandboxLoc : (mission?.location as 'moon' | 'mars'))}
              >
                {busy ? 'Opening crew channel…' : (
                  <>
                    <Users size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                    Launch with a crew (up to 4)
                  </>
                )}
              </button>
              {crewError && <p className="form-error">{crewError}</p>}
            </div>
          ) : (
            <div className="locked-note">
              <Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Complete <b>{prevTitle}</b> to unlock.
            </div>
          )}
        </aside>
      </div>

      <MissionGuidelinesModal
        isOpen={guidelinesOpen}
        initialMissionId={selected}
        onClose={() => setGuidelinesOpen(false)}
      />

      {joinOpen && (
        <JoinCrewDialog
          pilot={pilot}
          onClose={() => setJoinOpen(false)}
          onJoined={(link) => {
            const room = link.room!;
            setJoinOpen(false);
            onLaunch(room.missionId, room.location, link);
          }}
        />
      )}
    </div>
  );
}

function JoinCrewDialog({ pilot, onClose, onJoined }: { pilot: PilotProfile; onClose: () => void; onJoined: (link: CrewLink) => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length !== 5) return setError('Crew codes are 5 letters/numbers.');
    setBusy(true);
    setError(null);
    try {
      const link = await CrewLink.open({ t: 'join', code: c, name: pilot.callsign, avatar: findAvatar(pilot.avatarId, pilot.accentOverride) });
      const room = link.room!;
      if (!isMissionUnlocked(pilot, room.missionId)) {
        link.close();
        const title = room.missionId === SANDBOX_ID ? 'Sandbox Outpost' : MISSION_CAMPAIGNS.find((m) => m.id === room.missionId)?.title;
        setError(`That crew is flying ${title}. Unlock it first by finishing the mission before it.`);
        return;
      }
      soundFx.playSuccess();
      onJoined(link);
    } catch (err) {
      setError(CREW_ERRORS[(err as Error).message] ?? CREW_ERRORS.unreachable);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form className="join-dialog glass" onClick={(e) => e.stopPropagation()} onSubmit={join}>
        <span className="eyebrow">CO-OP MISSION</span>
        <h2>Join a crew</h2>
        <p>Ask your commander for the 5-letter crew code shown on their screen.</p>
        <input
          className="code-input"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)); setError(null); }}
          placeholder="K7Q2M"
          autoFocus
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          aria-label="Crew code"
        />
        {error && <p className="form-error">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="cta" disabled={busy}>{busy ? 'Docking…' : 'Join →'}</button>
        </div>
      </form>
    </div>
  );
}
