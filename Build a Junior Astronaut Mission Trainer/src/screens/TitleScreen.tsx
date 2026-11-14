import { useEffect, useRef, useState } from 'react';
import { soundFx } from '../utils/soundEffects';
import { music } from '../utils/music';

interface Props {
  onPlay: () => void;
}

/** Attract screen: drifting starfield, giant PLAY button, and a warp-speed jump when pressed. */
export function TitleScreen({ onPlay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const warpRef = useRef(0); // 0 = cruising, rises to 1 during the jump
  const [warping, setWarping] = useState(false);
  const playRef = useRef(onPlay);
  useEffect(() => {
    playRef.current = onPlay;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const stars = Array.from({ length: 900 }, () => ({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: Math.random(), pz: 0 }));
    let raf = 0;
    let last = performance.now();
    const resize = () => {
      canvas.width = canvas.clientWidth * Math.min(2, window.devicePixelRatio);
      canvas.height = canvas.clientHeight * Math.min(2, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = canvas.width;
      const h = canvas.height;
      const warp = warpRef.current;
      if (warping) warpRef.current = Math.min(1, warp + dt * 0.9);
      const speed = 0.06 + warp * warp * 3.2;
      ctx.fillStyle = `rgba(3, 5, 10, ${0.35 - warp * 0.25})`;
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const scale = Math.max(w, h) * 0.5;
      for (const s of stars) {
        s.pz = s.z;
        s.z -= speed * dt;
        if (s.z <= 0.02) {
          s.x = (Math.random() - 0.5) * 2;
          s.y = (Math.random() - 0.5) * 2;
          s.z = 1;
          s.pz = 1;
        }
        const x = cx + (s.x / s.z) * scale;
        const y = cy + (s.y / s.z) * scale;
        const px = cx + (s.x / s.pz) * scale;
        const py = cy + (s.y / s.pz) * scale;
        const b = Math.min(1, (1 - s.z) * 1.4);
        ctx.strokeStyle = warp > 0.05 ? `rgba(${170 + warp * 80}, ${210 + warp * 40}, 255, ${b})` : `rgba(255,255,255,${b})`;
        ctx.lineWidth = (1 - s.z) * (2 + warp * 2) * Math.min(2, window.devicePixelRatio);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      if (warp >= 1) {
        playRef.current();
        return;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [warping]);

  const play = () => {
    if (warping) return;
    soundFx.playWarp();
    music.play('title');
    setWarping(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        play();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className={`screen title-screen ${warping ? 'warping' : ''}`}>
      <canvas ref={canvasRef} className="warp-canvas" />
      <div className="title-planet" />
      <div className="title-content">
        <span className="eyebrow">NASA SPACE APPS 2026 · JUNIOR ASTRONAUT MISSION TRAINER</span>
        <h1 className="title-logo">
          Astro<span>Lab</span>
        </h1>
        <p className="title-tag">Survive the Moon. Outlast Mars. Fly with your crew.</p>
        <button type="button" className="play-button" onClick={play} aria-label="Play">
          <span className="ring r1" />
          <span className="ring r2" />
          <span className="tri" />
          <b>PLAY</b>
        </button>
        <span className="press-hint">press <kbd>Enter</kbd></span>
      </div>
      <div className="warp-flash" />
    </div>
  );
}
