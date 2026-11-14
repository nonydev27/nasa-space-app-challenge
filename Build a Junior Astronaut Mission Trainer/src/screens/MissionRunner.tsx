import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createInitialSimulationState, updateSimulationTick, type SpaceWeatherInput, type StormBasis } from '../utils/simulationEngine';
import { BADGE_DEFINITIONS, MISSION_CAMPAIGNS } from '../utils/nasaData';
import { getSpaceWeather, TIMEOUT_MS } from '../data/liveData';
import { archiveWeather, type SpaceWeather } from '../data/donki';
import { soundFx } from '../utils/soundEffects';
import { music, MISSION_THEME } from '../utils/music';
import { Coach, shouldCoach, SpaceTips } from '../hud/LearnTips';
import { ActionWheel } from '../hud/ActionWheel';

import { PowerMatrix } from '../components/PowerMatrix';
import { SubsystemDecks } from '../components/SubsystemDecks';
import { TelemetryLog } from '../components/TelemetryLog';
import { IncidentAlertBanner } from '../components/IncidentAlertBanner';
import { DataExplorer } from '../components/DataExplorer';
import { GlossaryModal } from '../components/GlossaryModal';
import { MissionGuidelinesModal } from '../components/MissionGuidelinesModal';
import { Zap, FlaskConical, Activity, ClipboardList } from 'lucide-react';

import { SceneView } from '../scene/SceneView';
import type { ModuleId, OutpostScene } from '../scene/OutpostScene';
import { StoryCinematic } from './StoryCinematic';
import { LaunchCountdown } from './LaunchCountdown';
import { Dock, TopBar, VitalsPanel } from '../hud/Hud';
import { AstroBot, HINT_BONUS, HINT_BUDGET } from '../hud/AstroBot';
import { DecisionCard } from '../hud/DecisionCard';
import { Debrief, type Outcome } from '../hud/Debrief';
import { JetGauge, TouchControls, useIsTouch } from '../hud/TouchControls';
import { CrewPanel, Toasts, type Toast } from '../hud/CrewPanel';
import { findAvatar } from '../game/avatars';
import { buildIntro, buildOutro } from '../game/storylines';
import { missionScore, toSceneView, type SimState } from '../game/simBridge';
import { applyAction, HOST_ONLY, type SimAction } from '../game/actions';
import { isMissionUnlocked, nextMissionId, recordMissionComplete, SANDBOX_ID } from '../game/profileStore';
import type { CrewLink, Emote } from '../net/crewLink';
import { useCrew } from '../net/useCrew';
import type { Location, PilotProfile, SceneEffects, ShotId, StoryBeat } from '../game/types';

const CAM_CYCLE: ShotId[] = ['overview', 'avatar', 'helmet', 'habitat', 'greenhouse', 'power', 'rover'];

type Phase = 'countdown' | 'loading' | 'intro' | 'play' | 'outro' | 'debrief';
type Drawer = 'power' | 'systems' | 'log' | null;

interface Props {
  pilot: PilotProfile;
  missionId: string;
  location: Location;
  crewLink: CrewLink | null;
  onPilotUpdate: (p: PilotProfile) => void;
  onExit: () => void;
  onNext: (missionId: string, location: Location) => void;
}

const looksLikeSim = (s: unknown): s is SimState =>
  Boolean(s && typeof s === 'object' && typeof (s as SimState).sol === 'number' && typeof (s as SimState).toggles === 'object' && typeof (s as SimState).powerAllocations === 'object');

/** Engine input from the fetched space weather. Mission 3 opens on the strongest real event. */
function weatherInput(w: SpaceWeather, missionId: string): SpaceWeatherInput {
  let basis: StormBasis[] = w.basis;
  if (missionId === 'mission-3') {
    const critical = basis.filter((b) => b.hazard === 'Critical');
    basis = [...critical, ...basis.filter((b) => b.hazard !== 'Critical')];
  }
  return { risk: w.risk, live: w.status === 'live', basis };
}

export function MissionRunner({ pilot, missionId, location, crewLink, onPilotUpdate, onExit, onNext }: Props) {
  const mission = MISSION_CAMPAIGNS.find((m) => m.id === missionId) ?? null;
  const avatar = useMemo(() => findAvatar(pilot.avatarId, pilot.accentOverride), [pilot.avatarId, pilot.accentOverride]);
  const touch = useIsTouch();

  const [weather, setWeather] = useState<SpaceWeather | null>(null);
  const [sim, setSim] = useState<SimState>(() => createInitialSimulationState(mission, location, pilot.ageGroup, weatherInput(archiveWeather(), missionId)));
  const [phase, setPhase] = useState<Phase>('countdown');
  const [fx, setFx] = useState<SceneEffects | undefined>(undefined);
  const [shot, setShot] = useState<ShotId>('establishing');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [deckTab, setDeckTab] = useState('donki');
  const [labels, setLabels] = useState(true);
  const [uiMode, setUiMode] = useState(pilot.ageGroup);
  const [muted, setMuted] = useState(() => soundFx.isMuted());
  const [glossary, setGlossary] = useState<{ open: boolean; term: string | null }>({ open: false, term: null });
  const [dataOpen, setDataOpen] = useState(false);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [vrOk, setVrOk] = useState(false);
  const [flash, setFlash] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sceneReady, setSceneReady] = useState(false);
  const sceneRef = useRef<OutpostScene | null>(null);
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  });

  const theme = MISSION_THEME[missionId] ?? 'sandbox';
  const [coach, setCoach] = useState(() => shouldCoach(pilot.id));
  const [musicOn, setMusicOn] = useState(() => music.isEnabled());
  const hintBudget = HINT_BUDGET[pilot.ageGroup];
  const blackout = missionId === 'mission-5';

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  // ------------------------------------------------------------ multiplayer
  const crew = useCrew(crewLink, {
    onAction: (action, by) => setSim((s) => applyAction(s, action, by)),
    onState: (state, hostPhase) => {
      if (!looksLikeSim(state)) return;
      setSim(state);
      // commander hit Retry → bring everyone back into the mission
      if ((phaseRef.current === 'outro' || phaseRef.current === 'debrief') && !state.completed && !state.failed && hostPhase === 'play') {
        setOutcome(null);
        setShot('overview');
        setPhase('play');
      }
    },
    onPose: (id, pose) => sceneRef.current?.setPeerPose(id, pose),
    onEmote: (id, e) => {
      sceneRef.current?.peerEmote(id, e);
      const name = crewLink?.room?.peers.find((p) => p.id === id)?.name;
      if (name) toast(`${name}: ${e}`);
    },
    onToast: (t) => {
      soundFx.playPop();
      toast(t);
    }
  });
  const multiplayer = crew.online;
  const authority = crew.authority;

  // keep remote astronauts in the scene in sync with the roster
  const shownPeers = useRef(new Set<string>());
  useEffect(() => {
    const scene = sceneRef.current;
    if (!sceneReady || !scene) return;
    const ids = new Set(crew.peers.map((p) => p.id));
    for (const p of crew.peers) if (!shownPeers.current.has(p.id)) { scene.addPeer(p.id, p.name, p.avatar); shownPeers.current.add(p.id); }
    for (const id of [...shownPeers.current]) if (!ids.has(id)) { scene.removePeer(id); shownPeers.current.delete(id); }
  }, [sceneReady, crew.peers]);

  // stream our astronaut's pose ~10×/s (relay allows 40 frames/s)
  useEffect(() => {
    if (!multiplayer || !crewLink || crew.peers.length === 0) return;
    const t = window.setInterval(() => {
      const pose = sceneRef.current?.getPlayerPose();
      if (pose) crewLink.sendPose(pose);
    }, 100);
    return () => window.clearInterval(t);
  }, [multiplayer, crewLink, crew.peers.length]);

  // commander broadcasts simulation state (≤5×/s)
  const lastSent = useRef(0);
  useEffect(() => {
    if (!multiplayer || !authority || !crewLink || crew.peers.length === 0) return;
    const wait = Math.max(0, 200 - (Date.now() - lastSent.current));
    const t = window.setTimeout(() => {
      lastSent.current = Date.now();
      crewLink.sendState(sim, phase);
    }, wait);
    return () => window.clearTimeout(t);
  }, [sim, phase, multiplayer, authority, crewLink, crew.peers.length]);

  const dispatch = useCallback(
    (action: SimAction) => {
      if (!authority && HOST_ONLY.includes(action.type)) {
        toast('Only the commander can pause or change time speed.');
        return;
      }
      // Crewmates wait for the commander's snapshot so a button never looks "done" when the
      // commander's simulation rejected it. Power sliders stay instant so dragging feels smooth.
      if (authority || action.type === 'alloc') setSim((s) => applyAction(s, action, multiplayer ? pilot.callsign : undefined));
      if (!authority) crewLink?.sendAction(action);
    },
    [authority, multiplayer, crewLink, pilot.callsign, toast]
  );

  const emote = useCallback(
    (e: Emote) => {
      sceneRef.current?.playerEmote(e);
      crewLink?.sendEmote(e);
    },
    [crewLink]
  );

  // ------------------------------------------------------------ live NASA space weather (every mission)
  useEffect(() => {
    let cancelled = false;
    const timeout = new Promise<SpaceWeather>((resolve) => setTimeout(() => resolve(archiveWeather(`no answer within ${TIMEOUT_MS / 1000} s`)), TIMEOUT_MS + 1000));
    Promise.race([getSpaceWeather(), timeout]).then((w) => {
      if (cancelled) return;
      setWeather(w);
      // re-plan this run's storms from the real data (only before play starts)
      if (phaseRef.current !== 'play' && phaseRef.current !== 'outro' && phaseRef.current !== 'debrief') {
        setSim(createInitialSimulationState(mission, location, pilot.ageGroup, weatherInput(w, missionId)));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mission, location, pilot.ageGroup, missionId]);

  useEffect(() => {
    if (phase === 'loading' && weather !== null) setPhase('intro');
  }, [phase, weather]);

  // ------------------------------------------------------------ story
  const ctx = { callsign: pilot.callsign, avatarName: avatar.name, weather };
  const introBeats = useMemo(() => buildIntro(missionId, ctx), [missionId, pilot.callsign, avatar.name, weather]); // eslint-disable-line react-hooks/exhaustive-deps
  const outroBeats = useMemo<StoryBeat[]>(
    () => (outcome ? buildOutro(missionId, ctx, outcome.success, outcome.sols, outcome.failureReason) : []),
    [outcome] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ------------------------------------------------------------ simulation clock (authority only)
  useEffect(() => {
    if (phase !== 'play' || !authority || coach) return; // clock waits while the training coach is open
    const timer = window.setInterval(() => setSim((prev) => updateSimulationTick(prev, 1)), 1000);
    return () => window.clearInterval(timer);
  }, [phase, authority, coach]);

  // ------------------------------------------------------------ soundtrack
  const stormCountdown = Boolean(sim.activeAlert && !sim.activeAlert.impactHandled);
  useEffect(() => {
    if (phase === 'debrief' || phase === 'outro') music.play('debrief');
    else if (phase === 'play' && stormCountdown) music.play('storm');
    else music.play(theme);
  }, [phase, stormCountdown, theme]);
  useEffect(() => {
    if (phase === 'outro' && outcome) music.stinger(outcome.success ? 'victory' : 'defeat');
  }, [phase, outcome]);

  // ------------------------------------------------------------ your astronaut reacts to what happens
  const reactions = useRef({ harvests: sim.harvests, survived: sim.stormsSurvived, decisions: sim.decisions.length, alert: sim.activeAlert?.id ?? null });
  useEffect(() => {
    const r = reactions.current;
    const scene = sceneRef.current;
    if (phase === 'play' && scene) {
      if (sim.harvests > r.harvests) scene.playerEmote('🎉');
      else if (sim.stormsSurvived > r.survived) scene.playerEmote('👍');
      else if (sim.activeAlert && sim.activeAlert.id !== r.alert) scene.playerEmote('⚠️');
      else if (sim.decisions.length > r.decisions) scene.playerEmote('🚀');
    }
    reactions.current = { harvests: sim.harvests, survived: sim.stormsSurvived, decisions: sim.decisions.length, alert: sim.activeAlert?.id ?? null };
  }, [sim.harvests, sim.stormsSurvived, sim.decisions.length, sim.activeAlert, phase]);

  // ------------------------------------------------------------ end of mission → outro
  useEffect(() => {
    if (phase !== 'play' || (!sim.completed && !sim.failed)) return;
    const success = sim.completed && !sim.failed;
    const hintBonus = success ? Math.max(0, hintBudget - hintsUsed) * HINT_BONUS : 0;
    const score = missionScore(sim) + hintBonus;
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
    soundFx.setThruster(false);
    const stormLog = sim.events.filter((e) => e.kind === 'storm' && e.done).map((e) => sim.stormBasis.find((b) => b.date === e.ref.split('|')[0])).filter(Boolean) as StormBasis[];
    const opening = mission?.initialState.incomingSolarFlare ? [sim.stormBasis.find((b) => b.hazard === 'Critical') ?? sim.stormBasis[0]] : [];
    setOutcome({
      success,
      score,
      hintBonus,
      sols: Math.min(sim.sol, sim.goal.targetSols),
      science: Math.round(sim.sciencePoints),
      crewHealth: Math.round(sim.crewHealth),
      failureReason: sim.failureReason,
      missedGoals: sim.missedGoals,
      badges: sim.unlockedBadges,
      unlocked,
      history: sim.history,
      decisions: sim.decisions,
      doseMSv: sim.accumulatedDoseMSv,
      stormsSurvived: sim.stormsSurvived,
      stormsHit: sim.stormsHit,
      storms: [...opening, ...stormLog],
      weatherLive: sim.weatherLive
    });
    setDrawer(null);
    setPhase('outro');
  }, [phase, sim, mission, pilot, onPilotUpdate, hintBudget, hintsUsed]);

  // ------------------------------------------------------------ solar storm drama
  const alertImpacted = Boolean(sim.activeAlert?.impactHandled);
  const alertId = sim.activeAlert?.id ?? null;
  useEffect(() => {
    if (phase === 'play' && alertId && !alertImpacted) soundFx.playAlert();
  }, [phase, alertId, alertImpacted]);
  useEffect(() => {
    if (!alertImpacted) return;
    soundFx.playEmergency();
    navigator.vibrate?.([120, 60, 220]);
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 1600);
    return () => window.clearTimeout(t);
  }, [alertImpacted]);

  // ------------------------------------------------------------ scene wiring
  const view = useMemo(() => toSceneView(sim, phase === 'play' || phase === 'debrief' ? undefined : fx), [sim, fx, phase]);
  const simForUi = useMemo(() => ({ ...sim, mode: uiMode }), [sim, uiMode]);

  const onSceneReady = useCallback((s: OutpostScene) => {
    sceneRef.current = s;
    shownPeers.current.clear();
    setSceneReady(true);
    s.vrSupported().then(setVrOk);
  }, []);

  const onBeat = useCallback((beat: StoryBeat) => {
    setFx(beat.effects);
    setShot(beat.shot);
  }, []);

  const onTakeControl = useCallback(() => setShot('avatar'), []);

  const afterCountdown = () => setPhase(weather === null ? 'loading' : 'intro');

  const startPlay = () => {
    setFx(undefined);
    setShot('overview');
    setPhase('play');
    if (!touch) toast('⌨️ WASD to walk · Space to jump · hold Shift for the jetpack');
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

  const act = {
    pause: () => dispatch({ type: 'pause' }),
    speed: (value: number) => dispatch({ type: 'speed', value }),
    alloc: (key: string, value: number) => dispatch({ type: 'alloc', key: key as never, value }),
    shield: () => dispatch({ type: 'shield' }),
    bunker: () => dispatch({ type: 'bunker' }),
    ration: () => dispatch({ type: 'ration' }),
    crops: () => dispatch({ type: 'crops' }),
    eva: () => dispatch({ type: 'eva' }),
    harvest: () => dispatch({ type: 'harvest' })
  };
  const decide = useCallback((card: string, option: number) => dispatch({ type: 'decide', card, option }), [dispatch]);
  const pending = sim.pendingDecision;
  const chooseOption = useCallback((option: number) => pending && decide(pending, option), [pending, decide]);

  const openData = () => {
    setDataOpen(true);
    setSim((s) => (s.unlockedBadges.includes('badge_data_scout') ? s : { ...s, unlockedBadges: [...s.unlockedBadges, 'badge_data_scout'] }));
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
    setSim(createInitialSimulationState(mission, location, pilot.ageGroup, weatherInput(weather ?? archiveWeather(), missionId)));
    setOutcome(null);
    setHintsUsed(0);
    setShot('overview');
    setPhase('play');
  };

  const playing = phase === 'play';
  const next = outcome?.success && mission ? nextMissionId(mission.id) : null;
  const nextMission = next ? MISSION_CAMPAIGNS.find((m) => m.id === next) : null;
  const unlockedTitle = outcome?.unlocked ? (outcome.unlocked === SANDBOX_ID ? 'Sandbox Outpost' : MISSION_CAMPAIGNS.find((m) => m.id === outcome.unlocked)?.title ?? null) : null;

  return (
    <div className={`screen mission-screen ${playing ? 'is-playing' : 'is-cinematic'} ${flash ? 'impact' : ''} ${drawer ? 'drawer-open' : ''} ${touch ? 'touch' : ''} ${multiplayer ? 'crew-on' : ''}`}>
      <SceneView
        location={location}
        theme={theme}
        avatar={avatar}
        callsign={pilot.callsign}
        view={view}
        shot={shot}
        cinematic={!playing}
        showLabels={labels}
        onModuleClick={onModuleClick}
        onTakeControl={onTakeControl}
        onRoverMount={(mounted) => {
          if (mounted && !sim.toggles.roverOnEVA) act.eva();
        }}
        onReady={onSceneReady}
      />
      <div className="vignette" />
      {flash && <div className="impact-flash" />}

      {phase === 'countdown' && <LaunchCountdown missionTitle={mission?.title ?? 'Sandbox Outpost'} destination={location} onDone={afterCountdown} />}

      {phase === 'loading' && (
        <div className="cine-loading">
          <div className="radar" />
          <span>Checking real space weather with NASA DONKI…</span>
        </div>
      )}

      {phase === 'intro' && <StoryCinematic beats={introBeats} title={mission?.title ?? 'Sandbox Outpost'} onBeat={onBeat} onFinish={startPlay} />}

      {phase === 'outro' && outroBeats.length > 0 && (
        <StoryCinematic
          beats={outroBeats}
          title={outcome?.success ? 'Mission Debrief' : 'Mission Not Complete'}
          onBeat={onBeat}
          onFinish={() => { setShot('establishing'); setFx(undefined); setPhase('debrief'); }}
          finishLabel="Debrief"
        />
      )}

      {playing && (
        <>
          <TopBar
            sim={simForUi}
            mission={mission}
            avatar={avatar}
            callsign={pilot.callsign}
            muted={muted}
            labels={labels}
            vrOk={vrOk}
            canControlTime={authority}
            weather={weather ? { live: weather.status === 'live', risk: weather.risk } : null}
            onPause={act.pause}
            onSpeed={act.speed}
            onMute={() => { setMuted(soundFx.toggleMute()); music.syncMute(); }}
            musicOn={musicOn}
            onMusic={() => setMusicOn(music.toggle())}
            onLabels={() => setLabels((l) => !l)}
            onMode={() => setUiMode((m) => (m === 'cadet' ? 'director' : 'cadet'))}
            onData={openData}
            onGlossary={() => openGlossary(null)}
            onSolHelp={() => openGlossary('Sol')}
            onGuidelines={() => setGuidelinesOpen(true)}
            onFullscreen={fullscreen}
            onVR={enterVR}
            onExit={() => { if (window.confirm(multiplayer ? 'Leave this mission and your crew?' : 'Leave this mission? Progress in this run will be lost.')) onExit(); }}
          />
          <VitalsPanel sim={simForUi} mission={mission} onGlossary={openGlossary} />

          {sim.activeAlert && (
            <div className="hud-alert">
              <IncidentAlertBanner alert={sim.activeAlert} state={sim} onOpenDONKI={openData} onResolveAlert={(a: string) => (a === 'bunker' ? act.bunker() : act.shield())} />
            </div>
          )}

          {touch && (
            <ActionWheel
              sim={sim}
              onBunker={act.bunker}
              onShield={act.shield}
              onEVA={act.eva}
              onHarvest={act.harvest}
              onRation={act.ration}
              onCamera={() => setShot((s) => CAM_CYCLE[(CAM_CYCLE.indexOf(s) + 1) % CAM_CYCLE.length])}
              onCheer={() => emote('🎉')}
            />
          )}
          <Dock sim={sim} shot={shot} onShot={setShot} onBunker={act.bunker} onShield={act.shield} onEVA={act.eva} onHarvest={act.harvest} onRation={act.ration} />
          <JetGauge sceneRef={sceneRef} touch={touch} location={location} />
          {touch && <TouchControls sceneRef={sceneRef} />}

          <aside className={`hud-drawer ${drawer ? 'open' : ''}`}>
            <nav className="drawer-tabs">
              {([
                ['power', <Zap size={16} key="p" />, 'Power'],
                ['systems', <FlaskConical size={16} key="s" />, 'Systems'],
                ['log', <Activity size={16} key="l" />, 'Log']
              ] as const).map(([id, icon, label]) => (
                <button key={id} type="button" className={drawer === id ? 'on' : ''} onClick={() => { soundFx.playClick(); setDrawer(drawer === id ? null : id); }}>
                  <span>{icon}</span>
                  <small>{label}</small>
                </button>
              ))}
              <button type="button" className="guidelines-tab-btn" onClick={() => { soundFx.playClick(); setGuidelinesOpen(true); }} title="Mission Guidelines">
                <span><ClipboardList size={16} /></span>
                <small>Guidelines</small>
              </button>
            </nav>
            {drawer && (
              <div className="drawer-body">
                {drawer === 'power' && <PowerMatrix state={simForUi} onUpdateAllocation={act.alloc} onToggleShield={act.shield} onToggleBunker={act.bunker} onGlossaryClick={openGlossary} />}
                {drawer === 'systems' && (
                  <SubsystemDecks
                    state={simForUi}
                    activeTab={deckTab}
                    onSelectTab={setDeckTab}
                    onToggleWaterRationing={act.ration}
                    onToggleHighYieldCrops={act.crops}
                    onHarvestCrops={act.harvest}
                    onToggleRoverEVA={act.eva}
                    onGlossaryClick={openGlossary}
                    onOpenNASAData={openData}
                  />
                )}
                {drawer === 'log' && <TelemetryLog logs={sim.logs} />}
              </div>
            )}
          </aside>

          <AstroBot sim={sim} left={hintBudget - hintsUsed} total={hintBudget} blackout={blackout} onUse={() => setHintsUsed((n) => Math.min(hintBudget, n + 1))} />

          {crewLink && crew.code && (
            <CrewPanel
              code={crew.code}
              online={crew.online}
              status={crew.status}
              you={{ name: pilot.callsign, avatar }}
              youAreHost={crew.hostId === crew.you || !crew.online}
              hostId={crew.hostId}
              peers={crew.peers}
              onEmote={emote}
              compact={touch || window.innerHeight < 500}
            />
          )}

          <SpaceTips sim={simForUi} enabled={uiMode === 'cadet' && !pending && !coach} onLearnMore={(t) => openGlossary(t)} />
          {pending && !coach && <DecisionCard cardId={pending} onChoose={chooseOption} />}
          {coach && <Coach pilotId={pilot.id} onDone={() => setCoach(false)} />}
        </>
      )}

      <Toasts items={toasts} />

      {phase === 'debrief' && outcome && (
        <Debrief
          outcome={outcome}
          missionTitle={mission?.title ?? 'Sandbox'}
          hintsUsed={hintsUsed}
          hintBudget={hintBudget}
          unlockedTitle={unlockedTitle}
          canRetry={authority}
          multiplayer={multiplayer}
          next={nextMission && !multiplayer ? { title: nextMission.title.replace(/^Mission \d+: /, ''), onGo: () => onNext(nextMission.id, nextMission.location as Location) } : null}
          onMap={onExit}
          onRetry={retry}
          onData={openData}
          badgeDefs={BADGE_DEFINITIONS}
        />
      )}

      <DataExplorer
        isOpen={dataOpen}
        onClose={() => setDataOpen(false)}
        weather={weather}
        crew={{ doseMSv: sim.accumulatedDoseMSv, days: sim.absHours / 24, location }}
      />
      {glossary.open && <GlossaryModal key={glossary.term ?? 'all'} isOpen initialTerm={glossary.term} onClose={() => setGlossary({ open: false, term: null })} />}
      <MissionGuidelinesModal isOpen={guidelinesOpen} initialMissionId={mission?.id ?? 'mission-1'} onClose={() => setGuidelinesOpen(false)} />
    </div>
  );
}
