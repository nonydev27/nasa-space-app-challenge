import { useEffect, useRef, useState } from 'react';
import type { AvatarConfig, Location, SceneViewState, ShotId } from '../game/types';
import { OutpostScene, type ModuleId } from './OutpostScene';

interface Props {
  location: Location;
  avatar: AvatarConfig;
  callsign: string;
  view: SceneViewState;
  shot: ShotId;
  cinematic: boolean;
  showLabels: boolean;
  onModuleClick?: (m: ModuleId) => void;
  onTakeControl?: () => void;
  onRoverMount?: (mounted: boolean) => void;
  onReady?: (scene: OutpostScene) => void;
}

/** React host for the imperative three.js outpost. Recreated only when the world itself changes. */
export function SceneView({ location, avatar, callsign, view, shot, cinematic, showLabels, onModuleClick, onTakeControl, onRoverMount, onReady }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<OutpostScene | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clickRef = useRef(onModuleClick);
  const readyRef = useRef(onReady);
  const takeRef = useRef(onTakeControl);
  const roverMountRef = useRef(onRoverMount);

  useEffect(() => {
    clickRef.current = onModuleClick;
    readyRef.current = onReady;
    takeRef.current = onTakeControl;
    roverMountRef.current = onRoverMount;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let s: OutpostScene | null = null;
    try {
      s = new OutpostScene(host, {
        location,
        avatar,
        callsign,
        onModuleClick: (m) => clickRef.current?.(m),
        onTakeControl: () => takeRef.current?.(),
        onRoverMount: (mounted) => roverMountRef.current?.(mounted)
      });
      setScene(s);
      setError(null);
      readyRef.current?.(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'WebGL failed to start');
    }
    return () => {
      s?.dispose();
      setScene(null);
    };
  }, [location, avatar, callsign]);

  useEffect(() => {
    scene?.applyView(view);
  }, [scene, view]);

  useEffect(() => {
    scene?.setShot(shot, cinematic);
  }, [scene, shot, cinematic]);

  useEffect(() => {
    scene?.setLabelsVisible(showLabels);
  }, [scene, showLabels]);

  return (
    <div className="scene-host" ref={hostRef}>
      {error && (
        <div className="scene-error">
          <strong>3D view unavailable</strong>
          <span>{error}. Try a browser with WebGL enabled (Chrome, Edge, Firefox).</span>
        </div>
      )}
    </div>
  );
}
