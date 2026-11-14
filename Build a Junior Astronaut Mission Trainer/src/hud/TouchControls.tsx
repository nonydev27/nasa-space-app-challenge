import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { Flame, ArrowUp, Car, User } from 'lucide-react';
import type { OutpostScene, PlayerStatus } from '../scene/OutpostScene';

/** True on phones/tablets (coarse pointer) — re-evaluated if a touchscreen laptop switches modes. */
export function useIsTouch(): boolean {
  const query = '(pointer: coarse)';
  const [touch, setTouch] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const on = () => setTouch(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return touch;
}

const RADIUS = 52;

/** Virtual thumbstick + Jump / Thrust buttons for touch screens. */
export function TouchControls({ sceneRef }: { sceneRef: RefObject<OutpostScene | null> }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0, active: false });
  const [roverState, setRoverState] = useState({ inRover: false, nearRover: false });
  const pointerId = useRef<number | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      const s = sceneRef.current?.getPlayerStatus();
      if (s) {
        setRoverState((prev) => (prev.inRover !== s.inRover || prev.nearRover !== s.nearRover ? { inRover: s.inRover, nearRover: s.nearRover } : prev));
      }
    }, 150);
    return () => window.clearInterval(t);
  }, [sceneRef]);

  const move = (e: ReactPointerEvent) => {
    const rect = baseRef.current?.getBoundingClientRect();
    if (!rect) return;
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) {
      dx = (dx / d) * RADIUS;
      dy = (dy / d) * RADIUS;
    }
    setKnob({ x: dx, y: dy, active: true });
    sceneRef.current?.setMoveInput(dx / RADIUS, -dy / RADIUS);
  };

  const end = () => {
    pointerId.current = null;
    setKnob({ x: 0, y: 0, active: false });
    sceneRef.current?.setMoveInput(0, 0);
  };

  const hold = (button: 'jump' | 'thrust') => ({
    onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      navigator.vibrate?.(12);
      sceneRef.current?.setButton(button, true);
    },
    onPointerUp: () => sceneRef.current?.setButton(button, false),
    onPointerCancel: () => sceneRef.current?.setButton(button, false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault()
  });

  return (
    <>
      <div
        className={`thumbstick ${knob.active ? 'active' : ''}`}
        ref={baseRef}
        onPointerDown={(e) => {
          if (pointerId.current !== null) return;
          pointerId.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          move(e);
        }}
        onPointerMove={(e) => e.pointerId === pointerId.current && move(e)}
        onPointerUp={(e) => e.pointerId === pointerId.current && end()}
        onPointerCancel={(e) => e.pointerId === pointerId.current && end()}
        aria-label="Move joystick"
      >
        <i style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>
      <div className="touch-buttons">
        {(roverState.nearRover || roverState.inRover) && (
          <button
            type="button"
            className={`tb rover-btn ${roverState.inRover ? 'in-rover' : ''}`}
            onClick={() => {
              navigator.vibrate?.(20);
              sceneRef.current?.toggleRover();
            }}
            aria-label={roverState.inRover ? 'Exit Rover' : 'Drive Rover'}
          >
            <span>{roverState.inRover ? <User size={20} /> : <Car size={20} />}</span>
            <small>{roverState.inRover ? 'Exit' : 'Drive'}</small>
          </button>
        )}
        <button type="button" className="tb thrust" {...hold('thrust')} aria-label="Jetpack thrust (hold)">
          <span><Flame size={20} /></span>
          <small>Thrust</small>
        </button>
        <button type="button" className="tb jump" {...hold('jump')} aria-label="Jump">
          <span><ArrowUp size={20} /></span>
          <small>Jump</small>
        </button>
      </div>
    </>
  );
}

/** Jetpack fuel + altitude readout, polled straight from the scene so the rest of the HUD doesn't re-render. */
export function JetGauge({ sceneRef, touch, location = 'moon' }: { sceneRef: RefObject<OutpostScene | null>; touch: boolean; location?: 'moon' | 'mars' }) {
  const [st, setSt] = useState<PlayerStatus>({ fuel: 1, airborne: false, thrusting: false, altitude: 0, inRover: false, nearRover: false });
  useEffect(() => {
    const t = window.setInterval(() => {
      const s = sceneRef.current?.getPlayerStatus();
      if (s) setSt((prev) => (Math.abs(prev.fuel - s.fuel) > 0.005 || prev.airborne !== s.airborne || prev.thrusting !== s.thrusting || Math.abs(prev.altitude - s.altitude) > 0.1 || prev.inRover !== s.inRover || prev.nearRover !== s.nearRover ? s : prev));
    }, 100);
    return () => window.clearInterval(t);
  }, [sceneRef]);
  const pct = Math.round(st.fuel * 100);
  return (
    <div className="jet-hud-cluster">
      {st.inRover && (
        <div className="rover-hud-badge">
          <Car size={16} />
          <span>DRIVING ROVER · <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> drive · <kbd>E</kbd> exit</span>
        </div>
      )}
      {!st.inRover && st.nearRover && (
        <button
          type="button"
          className="rover-hud-badge prompt"
          onClick={() => sceneRef.current?.toggleRover()}
        >
          <Car size={16} />
          <span><b>[E] Board Rover</b> · Click or press E to drive</span>
        </button>
      )}
      <div className={`jet-gauge ${st.thrusting ? 'firing' : ''} ${pct < 20 ? 'low' : ''} ${st.airborne || pct < 100 ? 'show' : ''}`}>
        <span className="jg-icon"><Flame size={14} /></span>
        <div className="jg-track"><i style={{ width: `${pct}%` }} /></div>
        <span className="jg-val">{st.airborne ? `${st.altitude.toFixed(1)} m` : `${pct}%`}</span>
        {!touch && <span className="jg-keys"><kbd>Space</kbd> jump · hold <kbd>Shift</kbd> thrust</span>}
      </div>
      {st.airborne && (
        <div className="gravity-note" role="status">
          {location === 'moon' ? '🌙 Moon gravity is 1/6 of Earth\'s: you float up about 6× higher!' : '🔴 Mars gravity is 3/8 of Earth\'s: you jump about 2.6× higher!'}
        </div>
      )}
    </div>
  );
}
