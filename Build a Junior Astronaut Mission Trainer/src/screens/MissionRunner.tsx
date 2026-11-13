import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createInitialSimulationState, updateSimulationTick } from '../utils/simulationEngine';
import { BADGE_DEFINITIONS, MISSION_CAMPAIGNS } from '../utils/nasaData';
import { fetchRecentDonkiEvents } from '../utils/donkiApi';
import { soundFx } from '../utils/soundEffects';

import { PowerMatrix } from '../components/PowerMatrix';
import { SubsystemDecks } from '../components/SubsystemDecks';
import { TelemetryLog } from '../components/TelemetryLog';
import { IncidentAlertBanner } from '../components/IncidentAlertBanner';
import { AstroBotGuide } from '../components/AstroBotGuide';
import { NASADataModal } from '../components/NASADataModal';
import { GlossaryModal } from '../components/GlossaryModal';

import { SceneView } from '../scene/SceneView';
import type { ModuleId, OutpostScene } from '../scene/OutpostScene';
import { StoryCinematic } from './StoryCinematic';
import { Dock, TopBar, VitalsPanel } from '../hud/Hud';
import { findAvatar } from '../game/avatars';
import { buildIntro, buildOutro, type LiveDonkiEvent } from '../game/storylines';
import { missionScore, toSceneView, type SimState } from '../game/simBridge';
import { isMissionUnlocked, nextMissionId, recordMissionComplete, SANDBOX_ID } from '../game/profileStore';
import type { Location, PilotProfile, SceneEffects, ShotId, StoryBeat } from '../game/types';

type Phase = 'loading' | 'intro' | 'play' | 'outro' | 'debrief';
type Drawer = 'power' | 'systems' | 'log' | null;

interface Outcome {
  success: boolean;
  score: number;
  sols: number;
  science: number;
  crewHealth: number;
  failureReason: string;
  badges: string[];
  unlocked: string | null;
}

interface Props {
  pilot: PilotProfile;
  missionId: string;
  location: Location;
  onPilotUpdate: (p: PilotProfile) => void;
  onExit: () => void;
  onNext: (missionId: string, location: Location) => void;
}

export function MissionRunner({ pilot, missionId, location, onPilotUpdate, onExit, onNext }: Props) {
  const mission = MISSION_CAMPAIGNS.find((m) => m.id === missionId) ?? null;
  const avatar = useMemo(() => findAvatar(pilot.avatarId, pilot.accentOverride), [pilot.avatarId, pilot.accentOverride]);

  const [sim, setSim] = useState<SimState>(() => createInitialSimulationState(mission, location, pilot.ageGroup));
  const [phase, setPhase] = useState<Phase>(missionId === 'mission-3' ? 'loading' : 'intro');
  const [liveDonki, setLiveDonki] = useState<LiveDonkiEvent[] | null>(null);
  const [fx, setFx] = useState<SceneEffects | undefined>(undefined);
  const [shot, setShot] = useState<ShotId>('establishing');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [deckTab, setDeckTab] = useState('donki');
  const [labels, setLabels] = useState(true);
  const [muted, setMuted] = useState(() => soundFx.isMuted());
  const [glossary, setGlossary] = useState<{ open: boolean; term: string | null }>({ open: false, term: null });
  const [dataOpen, setDataOpen] = useState(false);
  const [vrOk, setVrOk] = useState(false);
  const [flash, setFlash] = useState(false);
  const sceneRef = useRef<OutpostScene | null>(null);

  const ctx = { callsign: pilot.callsign, avatarName: avatar.name, liveDonki };
  const introBeats = useMemo(() => buildIntro(missionId, ctx), [missionId, pilot.callsign, avatar.name, liveDonki]); // eslint-disable-line react-hooks/exhaustive-deps
  const outroBeats = useMemo<StoryBeat[]>(
    () => (outcome ? buildOutro(missionId, ctx, outcome.success, outcome.sols, outcome.failureReason) : []),
    [outcome] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Mission 3 opens with the live DONKI feed — give the API a few seconds, then fall back to the archive.
  useEffect(() => {
    if (phase !== 'loading') return;
    let cancelled = false;
    const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000));
    Promise.race([fetchRecentDonkiEvents(30), timeout])
      .then((events) => { if (!cancelled) setLiveDonki(events as LiveDonkiEvent[]); })
      .catch(() => { if (!cancelled) setLiveDonki([]); })
      .finally(() => { if (!cancelled) setPhase('intro'); });
    return () => { cancelled = true; };
  }, [phase]);

  // ------------------------------------------------------------ simulation clock
  useEffect(() => {
    if (phase !== 'play') return;
    const timer = window.setInterval(() => {
      setSim((prev) => {
        const next = updateSimulationTick(prev, 1);
        if (next === prev) return prev;
        if (
          mission &&
          !next.completed &&
          !next.failed &&
          next.sol >= mission.goal.targetSols &&
          next.oxygenLevel >= mission.goal.minO2 &&
          next.batteryKWh >= (mission.goal.minBattery / 100) * next.batteryMaxKWh
        ) {
          return {
            ...next,
            completed: true,
            unlockedBadges: next.unlockedBadges.includes('badge_flight_director') ? next.unlockedBadges : [...next.unlockedBadges, 'badge_flight_director']
          };
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, mission]);

  // ------------------------------------------------------------ end of mission → outro
  useEffect(() => {
    if (phase !== 'play' || (!sim.completed && !sim.failed)) return;
    const success = sim.completed && !sim.failed;
    const score = missionScore(sim);
    let unlocked: string | null = null;
    if (success && mission) {
      const before = nextMissionId(mission.id);
      const wasLocked = before ? !isMissionUnlocked(pilot, before) : false;
      const updated = recordMissionComplete(pilot, mission.id, { bestScore: score, sols: sim.sol, badges: sim.unlockedBadges });
      onPilotUpdate(updated);
      if (before && wasLocked && isMissionUnlocked(updated, before)) unlocked = before;
      soundFx.playSuccess();
    } else {
      soundFx.playEmergency();
    }
    setOutcome({
      success,
      score,
      sols: sim.sol,
      science: Math.round(sim.sciencePoints),
      crewHealth: Math.round(sim.crewHealth),
      failureReason: sim.failureReason,
      badges: sim.unlockedBadges,
      unlocked
    });
    setDrawer(null);
    setPhase('outro');
  }, [phase, sim, mission, pilot, onPilotUpdate]);

  // ------------------------------------------------------------ solar storm drama
  const alertImpacted = Boolean(sim.activeAlert?.impactHandled);
  const alertActive = Boolean(sim.activeAlert);
  useEffect(() => {
    if (phase === 'play' && alertActive && !alertImpacted) soundFx.playAlert();
  }, [phase, alertActive, alertImpacted]);
  useEffect(() => {
    if (!alertImpacted) return;
    soundFx.playEmergency();
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 1600);
    return () => window.clearTimeout(t);
  }, [alertImpacted]);

  // ------------------------------------------------------------ scene wiring
  const view = useMemo(() => toSceneView(sim, phase === 'play' || phase === 'debrief' ? undefined : fx), [sim, fx, phase]);

  const onSceneReady = useCallback((s: OutpostScene) => {
    sceneRef.current = s;
    s.vrSupported().then(setVrOk);
  }, []);

  const onBeat = useCallback((beat: StoryBeat) => {
    setFx(beat.effects);
    setShot(beat.shot);
  }, []);

  const startPlay = () => {
    setFx(undefined);
    setShot('overview');
    setPhase('play');
    if (sim.activeAlert) setDrawer(null);
  };

  const onModuleClick = (m: ModuleId) => {
    soundFx.playClick();
    const map: Record<ModuleId, { drawer: Drawer; tab?: string; shot: ShotId }> = {
      eclss: { drawer: 'systems', tab: 'eclss', shot: 'habitat' },
      greenhouse: { drawer: 'systems', tab: 'greenhouse', shot: 'greenhouse' },
      power: { drawer: 'power', shot: 'power' },
      comms: { drawer: 'systems', tab: 'comms', shot: 'comms' },
      rover: { drawer: 'systems', tab: 'comms', shot: 'rover' },
      bunker: { drawer: 'power', shot: 'bunker' }
    };
    const t = map[m];
    setDrawer(t.drawer);
    if (t.tab) setDeckTab(t.tab);
    setShot(t.shot);
  };

  // ------------------------------------------------------------ handlers (ported from the original App)
  const patch = (fn: (s: SimState) => SimState) => setSim((prev) => fn(prev));
  const toggles = {
    pause: () => patch((s) => ({ ...s, paused: !s.paused })),
    speed: (spd: number) => patch((s) => ({ ...s, speed: spd, paused: false })),
    mode: () => patch((s) => ({ ...s, mode: s.mode === 'cadet' ? 'director' : 'cadet' })),
    alloc: (k: string, v: number) => patch((s) => ({ ...s, powerAllocations: { ...s.powerAllocations, [k]: v } })),
    shield: () =>
      patch((s) => {
        const on = !s.toggles.magneticShieldActive;
        return {
          ...s,
          toggles: { ...s.toggles, magneticShieldActive: on },
          powerAllocations: { ...s.powerAllocations, shields: on ? Math.max(35, s.powerAllocations.shields) : s.powerAllocations.shields }
        };
      }),
    bunker: () =>
      patch((s) => {
        const locked = !s.toggles.bunkerLockdown;
        return { ...s, toggles: { ...s.toggles, bunkerLockdown: locked, roverOnEVA: locked ? false : s.toggles.roverOnEVA } };
      }),
    ration: () => patch((s) => ({ ...s, toggles: { ...s.toggles, waterRationing: !s.toggles.waterRationing } })),
    crops: () => patch((s) => ({ ...s, toggles: { ...s.toggles, highYieldCropCycle: !s.toggles.highYieldCropCycle } })),
    eva: () => patch((s) => ({ ...s, toggles: { ...s.toggles, roverOnEVA: !s.toggles.roverOnEVA } })),
    harvest: () =>
      patch((s) => ({
        ...s,
        foodStockpileSols: s.foodStockpileSols + 2,
        cropGrowthProgress: 0,
        logs: [{ id: Date.now(), sol: s.sol, hour: '12:00', text: 'Fresh space crop harvest stored! +2 Sols food stockpile added.', type: 'success' }, ...s.logs.slice(0, 30)]
      }))
  };

  const openData = () => {
    setDataOpen(true);
    patch((s) => (s.unlockedBadges.includes('badge_data_scout') ? s : { ...s, unlockedBadges: [...s.unlockedBadges, 'badge_data_scout'] }));
  };
  const openGlossary = (term: string | null) => setGlossary({ open: true, term });

  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else {
        await document.documentElement.requestFullscreen();
        await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape');
      }
    } catch {
      /* fullscreen / orientation lock not permitted — fine */
    }
  };

  const enterVR = async () => {
    try {
      await sceneRef.current?.enterVR();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Could not start VR');
    }
  };

  const retry = () => {
    setSim(createInitialSimulationState(mission, location, sim.mode));
    setOutcome(null);
    setShot('overview');
    setPhase('play');
  };

  const playing = phase === 'play';
  const next = outcome?.success && mission ? nextMissionId(mission.id) : null;
  const nextMission = next ? MISSION_CAMPAIGNS.find((m) => m.id === next) : null;
  const earnedBadges = BADGE_DEFINITIONS.filter((b) => outcome?.badges.includes(b.id));

  return (
    <div className={`screen mission-screen ${playing ? 'is-playing' : 'is-cinematic'} ${flash ? 'impact' : ''} ${drawer ? 'drawer-open' : ''}`}>
      <SceneView
        location={location}
        avatar={avatar}
        callsign={pilot.callsign}
        view={view}
        shot={shot}
        cinematic={!playing}
        showLabels={labels}
        onModuleClick={onModuleClick}
        onReady={onSceneReady}
      />
      <div className="vignette" />
      {flash && <div className="impact-flash" />}

      {phase === 'loading' && (
        <div className="cine-loading">
          <div className="radar" />
          <span>Contacting NASA DONKI space-weather database…</span>
        </div>
      )}

      {phase === 'intro' && (
        <StoryCinematic beats={introBeats} title={mission?.title ?? 'Sandbox Outpost'} onBeat={onBeat} onFinish={startPlay} />
      )}

      {phase === 'outro' && outroBeats.length > 0 && (
        <StoryCinematic
          beats={outroBeats}
          title={outcome?.success ? 'Mission Debrief' : 'Mission Lost'}
          onBeat={onBeat}
          onFinish={() => { setShot('establishing'); setFx(undefined); setPhase('debrief'); }}
          finishLabel="Debrief"
        />
      )}

      {playing && (
        <>
          <TopBar
            sim={sim}
            mission={mission}
            avatar={avatar}
            callsign={pilot.callsign}
            muted={muted}
            labels={labels}
            vrOk={vrOk}
            onPause={toggles.pause}
            onSpeed={toggles.speed}
            onMute={() => setMuted(soundFx.toggleMute())}
            onLabels={() => setLabels((l) => !l)}
            onMode={toggles.mode}
            onData={openData}
            onGlossary={() => openGlossary(null)}
            onFullscreen={fullscreen}
            onVR={enterVR}
            onExit={() => { if (window.confirm('Leave this mission? Progress in this run will be lost.')) onExit(); }}
          />
          <VitalsPanel sim={sim} mission={mission} onGlossary={openGlossary} />

          {sim.activeAlert && (
            <div className="hud-alert">
              <IncidentAlertBanner
                alert={sim.activeAlert}
                state={sim}
                onOpenDONKI={openData}
                onResolveAlert={(a: string) => (a === 'bunker' ? toggles.bunker() : toggles.shield())}
              />
            </div>
          )}

          <Dock
            sim={sim}
            shot={shot}
            onShot={setShot}
            onBunker={toggles.bunker}
            onShield={toggles.shield}
            onEVA={toggles.eva}
            onHarvest={toggles.harvest}
            onRation={toggles.ration}
          />

          <aside className={`hud-drawer ${drawer ? 'open' : ''}`}>
            <nav className="drawer-tabs">
              {([['power', '⚡', 'Power'], ['systems', '🧪', 'Systems'], ['log', '📜', 'Log']] as const).map(([id, icon, label]) => (
                <button key={id} type="button" className={drawer === id ? 'on' : ''} onClick={() => { soundFx.playClick(); setDrawer(drawer === id ? null : id); }}>
                  <span>{icon}</span>
                  <small>{label}</small>
                </button>
              ))}
            </nav>
            {drawer && (
              <div className="drawer-body">
                {drawer === 'power' && (
                  <PowerMatrix state={sim} onUpdateAllocation={toggles.alloc} onToggleShield={toggles.shield} onToggleBunker={toggles.bunker} onGlossaryClick={openGlossary} />
                )}
                {drawer === 'systems' && (
                  <SubsystemDecks
                    state={sim}
                    activeTab={deckTab}
                    onSelectTab={setDeckTab}
                    onToggleWaterRationing={toggles.ration}
                    onToggleHighYieldCrops={toggles.crops}
                    onHarvestCrops={toggles.harvest}
                    onToggleRoverEVA={toggles.eva}
                    onGlossaryClick={openGlossary}
                    onOpenNASAData={openData}
                  />
                )}
                {drawer === 'log' && <TelemetryLog logs={sim.logs} />}
              </div>
            )}
          </aside>

          {sim.mode === 'cadet' && <AstroBotGuide state={sim} onGlossaryClick={openGlossary} />}
        </>
      )}

      {phase === 'debrief' && outcome && (
        <div className="debrief-overlay">
          <div className={`debrief-card glass ${outcome.success ? 'win' : 'lose'}`}>
            <span className="eyebrow">{mission?.title ?? 'Sandbox'}</span>
            <h2>{outcome.success ? 'Mission Accomplished' : 'Mission Failed'}</h2>
            {!outcome.success && <p className="fail-reason">{outcome.failureReason}</p>}
            <div className="debrief-stats">
              <div><span>Sols</span><b>{outcome.sols}</b></div>
              <div><span>Science</span><b>{outcome.science}</b></div>
              <div><span>Crew health</span><b>{outcome.crewHealth}%</b></div>
              <div className="hi"><span>Score</span><b>{outcome.score.toLocaleString()}</b></div>
            </div>
            {earnedBadges.length > 0 && (
              <div className="debrief-badges">
                {earnedBadges.map((b) => <span key={b.id} title={b.description}>{b.icon} {b.title}</span>)}
              </div>
            )}
            {outcome.unlocked && (
              <div className="unlock-banner">
                <span className="lock-anim">🔓</span>
                <div>
                  <small>NEW MISSION UNLOCKED</small>
                  <b>{outcome.unlocked === SANDBOX_ID ? 'Sandbox Outpost' : MISSION_CAMPAIGNS.find((m) => m.id === outcome.unlocked)?.title}</b>
                </div>
              </div>
            )}
            <div className="debrief-actions">
              <button type="button" className="ghost" onClick={onExit}>🗺️ Mission map</button>
              <button type="button" className="ghost" onClick={retry}>↻ Retry</button>
              {nextMission && (
                <button type="button" className="cta" onClick={() => onNext(nextMission.id, nextMission.location as Location)}>
                  Next: {nextMission.title.replace(/^Mission \d+: /, '')} →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <NASADataModal isOpen={dataOpen} onClose={() => setDataOpen(false)} />
      <GlossaryModal isOpen={glossary.open} initialTerm={glossary.term} onClose={() => setGlossary({ open: false, term: null })} />
    </div>
  );
}
