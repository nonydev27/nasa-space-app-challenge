// Learning layer for young players:
//  - Coach: a 5-step "how to play" shown once per pilot at their first mission.
//  - SpaceTips: every ~70 s a short "Did you know?" explains one space word,
//    picked to match what is happening (night, dust, storm, rover…).

import { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronRight, X } from 'lucide-react';
import type { SimState } from '../game/simBridge';
import { soundFx } from '../utils/soundEffects';

// ---------------------------------------------------------------- coach
const COACH_KEY = (pilotId: string) => `astrolab.coach.v1.${pilotId}`;

const STEPS = [
  { icon: '📊', title: 'Your meters (left side)', text: 'Power, Air, Radiation and Food. Green is good, yellow is low, red is danger. Tap the ? on a meter to learn what it means.' },
  { icon: '🕹️', title: 'Your buttons', text: 'Bunker hides the crew from radiation. Rover goes exploring for science. Harvest picks food. Open Power on the right to share out electricity.' },
  { icon: '⚖️', title: 'Decision cards', text: 'Sometimes the clock stops and you must choose. Green chips are what you gain, red chips are what it costs. No choice is free, just like for real astronauts!' },
  { icon: '📡', title: 'Call Mission Control', text: 'Stuck? Call Earth for advice. Messages travel at the speed of light, so on Mars the answer takes a while to arrive.' },
  { icon: '🏁', title: 'How to win', text: 'Reach every goal at the top before the last sol (day) ends: keep air and battery high, collect science, keep the crew healthy and fed.' }
];

export function shouldCoach(pilotId: string): boolean {
  try {
    return window.localStorage.getItem(COACH_KEY(pilotId)) !== 'done';
  } catch {
    return false;
  }
}

export function Coach({ pilotId, onDone }: { pilotId: string; onDone: () => void }) {
  const [i, setI] = useState(0);
  const finish = () => {
    try {
      window.localStorage.setItem(COACH_KEY(pilotId), 'done');
    } catch {
      /* ignore */
    }
    onDone();
  };
  const step = STEPS[i];
  return (
    <div className="coach-backdrop" role="dialog" aria-modal="true" aria-labelledby="coach-title">
      <div className="coach-card glass">
        <span className="coach-icon" aria-hidden="true">{step.icon}</span>
        <span className="eyebrow">Astronaut training · {i + 1} of {STEPS.length}</span>
        <h2 id="coach-title">{step.title}</h2>
        <p>{step.text}</p>
        <div className="coach-dots">{STEPS.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
        <div className="coach-actions">
          <button type="button" className="ghost small" onClick={finish}>Skip training</button>
          <button
            type="button"
            className="cta small"
            autoFocus
            onClick={() => {
              soundFx.playClick();
              if (i < STEPS.length - 1) setI(i + 1);
              else finish();
            }}
          >
            {i < STEPS.length - 1 ? <>Next <ChevronRight size={14} /></> : 'Start mission! 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- tips
interface Tip {
  id: string;
  term: string; // glossary key
  text: string;
  when?: (s: SimState) => boolean;
}

const TIPS: Tip[] = [
  { id: 'sol', term: 'Sol', text: 'A "sol" is a day on Mars: 24 hours and 39 minutes. In AstroLab every base day is a sol. The clock at the top shows which sol you are on.' },
  { id: 'night', term: 'Battery', text: 'It is night! Solar panels make no power in the dark, so the base runs on the battery and the nuclear generator. Turn off what you do not need.', when: (s) => !s.isDaylight },
  { id: 'gravity-moon', term: 'Gravity', text: 'On the Moon you weigh about 1/6 of what you weigh on Earth. Try jumping with Space (or the Jump button). You fly much higher!', when: (s) => s.location === 'moon' },
  { id: 'gravity-mars', term: 'Gravity', text: 'Mars gravity is about 3/8 of Earth\'s. A 30 kg kid would feel like only about 11 kg!', when: (s) => s.location === 'mars' },
  { id: 'dust', term: 'Regolith', text: 'Mars dust storms can cover the whole planet and block the Sun for weeks. That is why solar power drops so much right now.', when: (s) => s.dustStormActive },
  { id: 'eclss', term: 'ECLSS', text: 'Life support (ECLSS) makes oxygen and cleans the air. It needs electricity. No power means no fresh air!' },
  { id: 'radiation', term: 'Sievert', text: 'Radiation is invisible energy from the Sun and space. We measure it in mSv. On the Moon you get about 200 times more than on Earth.' },
  { id: 'eva', term: 'EVA', text: 'EVA means going outside. The rover finds great science, but outside the walls the crew gets more radiation.', when: (s) => s.toggles.roverOnEVA },
  { id: 'cme', term: 'CME', text: 'A CME is a giant cloud of charged particles thrown out by the Sun. NASA\'s DONKI database records every one, and forecasters warn astronauts.', when: (s) => Boolean(s.activeAlert) },
  { id: 'kwh', term: 'kW and kWh', text: 'kW is how fast you use electricity right now. kWh is how much is saved in the battery. Using more kW than you make empties the battery.', when: (s) => s.batteryKWh / s.batteryMaxKWh < 0.5 },
  { id: 'regolith', term: 'Regolith', text: 'Regolith is the dusty soil of the Moon and Mars. Piling it on top of the bunker blocks radiation, like a thick blanket.' },
  { id: 'rtg', term: 'RTG', text: 'The nuclear generator makes the same power day and night, in any weather. Mars rovers Curiosity and Perseverance use one too.' },
  { id: 'delay', term: 'Lag / Latency', text: 'Radio travels at the speed of light, but space is huge: a message takes 1.3 seconds to reach the Moon and up to 22 minutes to reach Mars.' },
  { id: 'osdr', term: 'OSDR', text: 'NASA really grew lettuce on the space station, and it was safe to eat. You can read about it in NASA\'s science library, OSDR.' }
];

export function SpaceTips({ sim, enabled, onLearnMore }: { sim: SimState; enabled: boolean; onLearnMore: (term: string) => void }) {
  const [tip, setTip] = useState<Tip | null>(null);
  const seen = useRef(new Set<string>());
  const simRef = useRef(sim);
  useEffect(() => {
    simRef.current = sim;
  });

  useEffect(() => {
    if (!enabled) return;
    const pick = () => {
      const s = simRef.current;
      if (s.pendingDecision || s.paused) return;
      const fresh = TIPS.filter((t) => !seen.current.has(t.id));
      const pool = fresh.length ? fresh : TIPS;
      if (!fresh.length) seen.current.clear();
      const next = pool.find((t) => t.when?.(s)) ?? pool.find((t) => !t.when) ?? pool[0];
      seen.current.add(next.id);
      setTip(next);
    };
    const first = window.setTimeout(pick, 9000); // "sol" explained right after the mission starts
    const every = window.setInterval(pick, 70000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
    };
  }, [enabled]);

  useEffect(() => {
    if (!tip) return;
    const t = window.setTimeout(() => setTip(null), 16000);
    return () => window.clearTimeout(t);
  }, [tip]);

  if (!tip || !enabled) return null;
  return (
    <div className="space-tip glass" role="status">
      <span className="tip-badge">💡 Did you know?</span>
      <p>{tip.text}</p>
      <div className="tip-actions">
        <button type="button" className="link-btn" onClick={() => { onLearnMore(tip.term); setTip(null); }}>
          <BookOpen size={13} /> Learn more
        </button>
        <button type="button" className="tip-close" onClick={() => setTip(null)} aria-label="Close tip">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
