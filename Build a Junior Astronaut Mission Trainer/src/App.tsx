import { lazy, Suspense, useCallback, useState } from 'react';
import { SignUpScreen } from './screens/SignUpScreen';
import { MissionMapScreen } from './screens/MissionMapScreen';
import { TitleScreen } from './screens/TitleScreen';
import type { CrewLink } from './net/crewLink';

import { isMissionUnlocked, loadActivePilot, setActivePilot } from './game/profileStore';
import type { Location, PilotProfile } from './game/types';

import './App.css';
import './styles/immersive.css';

// three.js is only needed once the player reaches the 3D screens.
const AvatarScreen = lazy(() => import('./screens/AvatarScreen').then((m) => ({ default: m.AvatarScreen })));
const MissionRunner = lazy(() => import('./screens/MissionRunner').then((m) => ({ default: m.MissionRunner })));

type Screen =
  | { kind: 'title' }
  | { kind: 'signup' }
  | { kind: 'avatar'; firstTime: boolean }
  | { kind: 'map' }
  | { kind: 'mission'; missionId: string; location: Location; run: number; crew: CrewLink | null };

function initialScreen(pilot: PilotProfile | null): Screen {
  if (!pilot) return { kind: 'signup' };
  if (!pilot.avatarId) return { kind: 'avatar', firstTime: true };
  return { kind: 'map' };
}

export default function App() {
  const [pilot, setPilot] = useState<PilotProfile | null>(() => loadActivePilot());
  const [screen, setScreen] = useState<Screen>({ kind: 'title' });

  const onPilotUpdate = useCallback((p: PilotProfile) => setPilot(p), []);

  const launch = (missionId: string, location: Location, crew: CrewLink | null = null) => {
    if (!pilot || !isMissionUnlocked(pilot, missionId)) {
      crew?.close();
      return;
    }
    setScreen((s) => ({ kind: 'mission', missionId, location, crew, run: (s.kind === 'mission' ? s.run : 0) + 1 }));
  };

  let body;
  if (screen.kind === 'title') {
    body = <TitleScreen onPlay={() => setScreen(initialScreen(pilot))} />;
  } else if (!pilot || screen.kind === 'signup') {
    body = (
      <SignUpScreen
        onSignedIn={(p) => {
          setPilot(p);
          setScreen(initialScreen(p));
        }}
      />
    );
  } else if (screen.kind === 'avatar') {
    body = (
      <AvatarScreen
        pilot={pilot}
        onDone={(p) => {
          setPilot(p);
          setScreen({ kind: 'map' });
        }}
        onBack={screen.firstTime ? undefined : () => setScreen({ kind: 'map' })}
      />
    );
  } else if (screen.kind === 'map') {
    body = (
      <MissionMapScreen
        pilot={pilot}
        onLaunch={launch}
        onEditAvatar={() => setScreen({ kind: 'avatar', firstTime: false })}
        onSignOut={() => {
          setActivePilot(null);
          setPilot(null);
          setScreen({ kind: 'signup' });
        }}
      />
    );
  } else {
    body = (
      <MissionRunner
        key={`${screen.missionId}-${screen.run}`}
        pilot={pilot}
        missionId={screen.missionId}
        location={screen.location}
        crewLink={screen.crew}
        onPilotUpdate={onPilotUpdate}
        onExit={() => setScreen({ kind: 'map' })}
        onNext={(id, loc) => launch(id, loc, null)}
      />
    );
  }

  return (
    <div className="immersive-app">
      <Suspense fallback={<div className="screen boot-loader"><span>Preparing launch systems…</span></div>}>{body}</Suspense>
      <div className="rotate-device" role="alert">
        <div className="phone-icon" />
        <b>Rotate your device</b>
        <span>Outpost Commander is played in landscape, like a cockpit.</span>
      </div>
    </div>
  );
}
