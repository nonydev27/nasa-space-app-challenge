import { useEffect, useRef, useState } from 'react';
import { soundFx } from '../utils/soundEffects';
import type { StoryBeat } from '../game/types';

interface Props {
  beats: StoryBeat[];
  title: string;
  onBeat: (beat: StoryBeat, index: number) => void;
  onFinish: () => void;
  finishLabel?: string;
  loadingNote?: string | null;
}

const CHAR_MS = 26;

/** Letterboxed, typewriter-narrated story sequence that drives the 3D camera beat by beat. */
export function StoryCinematic({ beats, title, onBeat, onFinish, finishLabel = 'Take command', loadingNote }: Props) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const beat = beats[Math.min(index, beats.length - 1)];
  const fullyTyped = typed >= (beat?.text.length ?? 0);
  const last = index >= beats.length - 1;
  const onBeatRef = useRef(onBeat);
  const finishRef = useRef(onFinish);

  useEffect(() => {
    onBeatRef.current = onBeat;
    finishRef.current = onFinish;
  });

  // announce beat → scene camera/effects
  useEffect(() => {
    if (!beat) return;
    onBeatRef.current(beat, index);
    soundFx.playTone(index === 0 ? 330 : 520, 'sine', 0.25, 0.05);
  }, [beat, index]);

  // typewriter
  useEffect(() => {
    if (!beat || fullyTyped) return;
    const t = window.setTimeout(() => setTyped((n) => n + 2), CHAR_MS);
    return () => window.clearTimeout(t);
  }, [beat, typed, fullyTyped]);

  // auto-advance after a reading pause proportional to length
  useEffect(() => {
    if (!autoPlay || !fullyTyped || last || !beat) return;
    const words = beat.text.split(/\s+/).length;
    const t = window.setTimeout(() => advance(), Math.max(4200, words * 330));
    return () => window.clearTimeout(t);
  });

  const advance = () => {
    if (!fullyTyped) {
      setTyped(beat.text.length);
      return;
    }
    if (last) {
      finishRef.current();
      return;
    }
    soundFx.playClick();
    setTyped(0);
    setIndex((i) => i + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); advance(); }
      if (e.key === 'Escape') finishRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!beat) return null;

  return (
    <div className="cinematic" onClick={advance}>
      <div className="letterbox top">
        <span className="cine-title">{title}</span>
        <div className="cine-controls" onClick={(e) => e.stopPropagation()}>
          <button type="button" className={autoPlay ? 'on' : ''} onClick={() => setAutoPlay((a) => !a)}>
            {autoPlay ? '⏸ Auto' : '▶ Auto'}
          </button>
          <button type="button" onClick={() => finishRef.current()}>Skip ⏭</button>
        </div>
      </div>

      {beat.data && fullyTyped && (
        <div className="data-cards" key={`d${index}`}>
          {beat.data.map((d, i) => (
            <div key={d.label} className={`data-card ${d.live ? 'live' : ''}`} style={{ animationDelay: `${i * 140}ms` }}>
              <span className="dc-label">{d.label}</span>
              <span className="dc-value">{d.value}</span>
              <span className="dc-source">{d.live && <i className="live-dot" />}{d.source}</span>
            </div>
          ))}
        </div>
      )}

      <div className="letterbox bottom">
        <div className="narration" key={`n${index}`}>
          <span className="kicker">{beat.kicker}</span>
          <p>
            {beat.text.slice(0, typed)}
            {!fullyTyped && <i className="caret" />}
          </p>
        </div>
        <div className="beat-footer">
          <div className="beat-dots">
            {beats.map((_, i) => <i key={i} className={i === index ? 'on' : i < index ? 'done' : ''} />)}
          </div>
          {loadingNote && <span className="loading-note">{loadingNote}</span>}
          <button type="button" className="cta small" onClick={(e) => { e.stopPropagation(); advance(); }}>
            {last && fullyTyped ? `${finishLabel} →` : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
