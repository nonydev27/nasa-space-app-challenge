import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
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
  const pointerId = useRef<number | null>(null);

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
        <button type="button" className="tb thrust" {...hold('thrust')} aria-label="Jetpack thrust (hold)">
          <span>🔥</span>
          <small>Thrust</small>
        </button>
        <button type="button" className="tb jump" {...hold('jump')} aria-label="Jump">
          <span>⤒</span>
          <small>Jump</small>
        </button>
      </div>
    </>
  );
}

/** Jetpack fuel + altitude readout, polled straight from the scene so the rest of the HUD doesn't re-render. */
export function JetGauge({ sceneRef, touch }: { sceneRef: RefObject<OutpostScene | null>; touch: boolean }) {
  const [st, setSt] = useState<PlayerStatus>({ fuel: 1, airborne: false, thrusting: false, altitude: 0 });
  useEffect(() => {
    const t = window.setInterval(() => {
      const s = sceneRef.current?.getPlayerStatus();
      if (s) setSt((prev) => (Math.abs(prev.fuel - s.fuel) > 0.005 || prev.airborne !== s.airborne || prev.thrusting !== s.thrusting || Math.abs(prev.altitude - s.altitude) > 0.1 ? s : prev));
    }, 100);
    return () => window.clearInterval(t);
  }, [sceneRef]);
  const pct = Math.round(st.fuel * 100);
  return (
    <div className={`jet-gauge ${st.thrusting ? 'firing' : ''} ${pct < 20 ? 'low' : ''} ${st.airborne || pct < 100 ? 'show' : ''}`}>
      <span className="jg-icon">🔥</span>
      <div className="jg-track"><i style={{ width: `${pct}%` }} /></div>
      <span className="jg-val">{st.airborne ? `${st.altitude.toFixed(1)} m` : `${pct}%`}</span>
      {!touch && <span className="jg-keys"><kbd>Space</kbd> jump · hold <kbd>Shift</kbd> thrust</span>}
    </div>
  );
}
