import { useEffect, useRef, useState } from 'react';
import { soundFx } from '../utils/soundEffects';

interface Props {
  missionTitle: string;
  destination: 'moon' | 'mars';
  onDone: () => void;
}

const STEPS = ['3', '2', '1', 'LIFTOFF!'];

/** 3-2-1 liftoff sequence played before every mission briefing. Tap to skip. */
export function LaunchCountdown({ missionTitle, destination, onDone }: Props) {
  const [step, setStep] = useState(0);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    if (step < STEPS.length - 1) {
      soundFx.playCountdownBeep(false);
      const t = window.setTimeout(() => setStep((s) => s + 1), 850);
      return () => window.clearTimeout(t);
    }
    soundFx.playCountdownBeep(true);
    soundFx.playLiftoff();
    const t = window.setTimeout(() => doneRef.current(), 2300);
    return () => window.clearTimeout(t);
  }, [step]);

  const liftoff = step === STEPS.length - 1;
  return (
    <div className={`launch-countdown ${liftoff ? 'liftoff' : ''}`} onClick={() => doneRef.current()}>
      <div className="lc-sky" />
      <div className="lc-pad" />
      <div className="lc-rocket">
        <div className="lc-body" />
        <div className="lc-flame" />
      </div>
      <div className="lc-smoke">
        {Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i } as React.CSSProperties} />)}
      </div>
      <div className="lc-text">
        <small>{destination === 'moon' ? 'DESTINATION · THE MOON' : 'DESTINATION · MARS'}</small>
        <b key={step}>{STEPS[step]}</b>
        <span>{missionTitle}</span>
      </div>
      <span className="lc-skip">tap to skip</span>
    </div>
  );
}
