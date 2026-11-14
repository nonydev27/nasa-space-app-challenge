import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertOctagon, ShieldCheck, Wind, Moon, BatteryCharging, Wheat, Droplets, Car, Sparkles, X, Radio, SatelliteDish, FlaskConical, Sun } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';
import { eclssNeedKW, totalLoadKW } from '../utils/simulationEngine';
import { SITES } from '../data/nasaFacts';
import type { SimState } from '../game/simBridge';

export const HINT_BUDGET = { cadet: 5, director: 3 } as const;
export const HINT_BONUS = 150; // score per unused call

interface Hint {
  icon: ReactNode;
  title: string;
  text: string;
}

/** Most urgent advice for the situation, with concrete numbers from the simulation. */
export function pickHint(s: SimState): Hint {
  const batt = (s.batteryKWh / s.batteryMaxKWh) * 100;
  const gen = s.solarOutputKW + s.rtgNuclearOutputKW;
  const load = totalLoadKW(s);
  const need = eclssNeedKW(s);
  const hoursToSunset = s.hour < 18 ? 18 - s.hour : 0;

  if (s.activeAlert && !s.activeAlert.impactHandled) {
    if (!s.toggles.bunkerLockdown && !s.toggles.magneticShieldActive)
      return { icon: <AlertOctagon size={24} color="#ff4d4d" />, title: 'Solar storm incoming!', text: `Impact in ${Math.ceil(s.activeAlert.countdownSec)} s. Press Bunker: a thick layer of Moon or Mars soil blocks most of the particles.` };
    return { icon: <ShieldCheck size={24} color="#00e5ff" />, title: 'You are protected', text: 'Stay sheltered until the all-clear appears in the log. Leaving early means a big radiation dose.' };
  }
  if (s.powerAllocations.eclss < need)
    return { icon: <Wind size={24} color="#00e5ff" />, title: 'Life support needs more power', text: `It needs ${need} kW right now but only gets ${s.powerAllocations.eclss} kW, so the air is getting worse. Open Power and raise Life Support.` };
  if (s.location === 'moon' && s.isDaylight && hoursToSunset < 4)
    return { icon: <Moon size={24} color="#b0b8c4" />, title: `Night in ${hoursToSunset.toFixed(1)} h`, text: 'At night the solar panels stop and the heaters need more power. Turn the lab down and let the battery fill up now.' };
  if (batt < 35 && gen < load)
    return { icon: <BatteryCharging size={24} color="#ffb000" />, title: 'Battery is draining', text: `You make ${gen.toFixed(0)} kW but use ${load.toFixed(0)} kW. Turn down the Science Lab, Comms or the rover until the battery is filling again.` };
  if (s.cropGrowthProgress >= 70) return { icon: <Wheat size={24} color="#00e676" />, title: 'Crops are ready', text: 'Press Harvest in the dock for +2 sols of fresh food.' };
  if (s.foodStockpileSols <= 3)
    return { icon: <Wheat size={24} color="#ff9100" />, title: 'Food is running low', text: 'Give the greenhouse at least 10 kW and keep water above 15%. Fast-grow mode makes food quicker but needs 18 kW.' };
  if (s.dustStormActive)
    return { icon: <Wind size={24} color="#ff9100" />, title: 'Dust storm power plan', text: 'The panels make very little power in the storm. Your nuclear generator is your lifeline, so switch off what you do not need.' };
  if (s.waterLevel < 30 && !s.toggles.waterRationing)
    return { icon: <Droplets size={24} color="#00b0ff" />, title: 'Water is low', text: 'Press Ration. The crew will be a bit grumpier, but the water lasts longer.' };
  if (s.sciencePoints < s.goal.scienceTarget && batt > 60 && s.isDaylight)
    return { icon: <FlaskConical size={24} color="#b892ff" />, title: 'Time for science', text: `You need ${Math.ceil(s.goal.scienceTarget - s.sciencePoints)} more science. The battery is healthy, so give the lab more power or send the rover out.` };
  if (!s.toggles.roverOnEVA && !s.activeAlert && batt > 50)
    return { icon: <Car size={24} color="#00e5ff" />, title: 'Calm conditions', text: 'A good time for the rover. It earns science fast but uses power and adds some radiation.' };
  return { icon: <Sparkles size={24} color="#ffd700" />, title: 'All systems normal', text: 'Things look good, Commander! Keep an eye on the battery before night.' };
}

/** Round-trip delay to Earth, in real seconds of waiting (Mars compressed: 1 real minute → 1 s). */
export function commsDelay(location: 'moon' | 'mars'): { waitSec: number; realText: string } {
  if (location === 'moon') return { waitSec: SITES.moon.oneWayDelay.value * 2, realText: '2.6 seconds there and back (real time!)' };
  const oneWay = SITES.mars.oneWayDelay.value;
  return { waitSec: oneWay * 2, realText: `about ${oneWay * 2} minutes there and back, sped up so 1 minute = 1 second` };
}

interface Props {
  sim: SimState;
  left: number;
  total: number;
  /** Solar conjunction: the Sun blocks radio between Earth and Mars */
  blackout?: boolean;
  onUse: () => void;
}

export function AstroBot({ sim, left, total, blackout, onUse }: Props) {
  const [card, setCard] = useState<(Hint & { note?: string }) | null>(null);
  const [waiting, setWaiting] = useState<{ until: number; total: number } | null>(null);
  const [, force] = useState(0);
  const pending = useRef<Hint | null>(null);
  const delay = commsDelay(sim.location as 'moon' | 'mars');

  useEffect(() => {
    if (!waiting) return;
    const t = window.setInterval(() => {
      if (Date.now() >= waiting.until) {
        window.clearInterval(t);
        soundFx.playPop();
        setCard({ ...pending.current!, note: sim.location === 'mars' ? 'This advice is about how your base looked when you called. Things may have changed!' : undefined });
        setWaiting(null);
      } else force((n) => n + 1);
    }, 200);
    return () => window.clearInterval(t);
  }, [waiting, sim.location]);

  const ask = () => {
    if (blackout) {
      soundFx.playClick();
      setCard({
        icon: <Sun size={24} color="#ffb547" />,
        title: 'No signal: solar conjunction',
        text: 'The Sun is between Mars and Earth and blocks the radio. Nobody can answer. Use your training: check the Mission Guidelines and trust your own decisions.'
      });
      return;
    }
    if (left <= 0 || waiting) return;
    soundFx.playClick();
    pending.current = pickHint(sim); // based on what Earth will see: the base right now
    onUse();
    setCard(null);
    setWaiting({ until: Date.now() + delay.waitSec * 1000, total: delay.waitSec });
  };

  const remaining = waiting ? Math.max(0, (waiting.until - Date.now()) / 1000) : 0;

  return (
    <div className="astrobot">
      {waiting && (
        <div className="astrobot-card glass comms-wait" role="status">
          <span className="hint-icon"><SatelliteDish size={24} color="#38d9ff" /></span>
          <div>
            <b>Calling Earth… {Math.ceil(remaining)} s</b>
            <p>Radio travels at the speed of light. To {sim.location === 'moon' ? 'the Moon' : 'Mars'} and back takes {delay.realText}.</p>
            <div className="comms-track"><i style={{ width: `${100 - (remaining / waiting.total) * 100}%` }} /></div>
          </div>
        </div>
      )}
      {card && !waiting && (
        <div className="astrobot-card glass" role="status">
          <button type="button" className="close" onClick={() => setCard(null)} aria-label="Close message">
            <X size={16} />
          </button>
          <span className="hint-icon">{card.icon}</span>
          <div>
            <span className="eyebrow">{blackout ? 'Onboard computer' : 'Mission Control, Houston'}</span>
            <b>{card.title}</b>
            <p>{card.text}</p>
            {card.note && <p className="comms-note">{card.note}</p>}
          </div>
        </div>
      )}
      <button
        type="button"
        className={`astrobot-btn ${left === 0 && !blackout ? 'empty' : ''} ${blackout ? 'blackout' : ''}`}
        onClick={ask}
        disabled={(left === 0 && !blackout) || Boolean(waiting)}
        title={blackout ? 'Earth cannot hear you during solar conjunction' : left ? 'Ask Mission Control for advice' : 'No calls left this mission'}
      >
        <span className="bot">
          <Radio size={20} />
        </span>
        <span className="label">{blackout ? 'No signal' : waiting ? 'Waiting for Earth…' : left ? 'Call Mission Control' : 'Out of calls'}</span>
        {!blackout && <span className="count-badge">{left}</span>}
        {!blackout && (
          <span className="charges" aria-label={`${left} of ${total} calls left`}>
            {Array.from({ length: total }, (_, i) => <i key={i} className={i < left ? 'on' : ''} />)}
          </span>
        )}
      </button>
    </div>
  );
}
