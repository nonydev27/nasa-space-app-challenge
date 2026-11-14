import { useState, type ReactNode } from 'react';
import {
  Bot,
  AlertOctagon,
  ShieldCheck,
  Wind,
  Moon,
  BatteryCharging,
  Wheat,
  Droplets,
  Car,
  Sparkles,
  X
} from 'lucide-react';
import { soundFx } from '../utils/soundEffects';
import type { SimState } from '../game/simBridge';

export const HINT_BUDGET = { cadet: 5, director: 3 } as const;
export const HINT_BONUS = 150; // score per unused hint

interface Hint {
  icon: ReactNode;
  title: string;
  text: string;
}

/** Most urgent advice for the current situation, with concrete numbers from the simulation. */
export function pickHint(s: SimState): Hint {
  const batt = (s.batteryKWh / s.batteryMaxKWh) * 100;
  const gen = s.solarOutputKW + s.rtgNuclearOutputKW;
  const load = Object.values(s.powerAllocations).reduce((a, b) => a + b, 0);
  const lunarNight = s.location === 'moon' && !s.isDaylight;
  const eclssNeed = (s.toggles.bunkerLockdown ? 18 : 28) + (lunarNight ? 15 : 0);
  const hoursToSunset = s.hour < 18 ? 18 - s.hour : 0;

  if (s.activeAlert?.source === 'DONKI' && !s.activeAlert.impactHandled) {
    if (!s.toggles.bunkerLockdown && !s.toggles.magneticShieldActive)
      return {
        icon: <AlertOctagon size={24} color="#ff4d4d" />,
        title: 'Solar storm incoming!',
        text: `Impact in ${Math.ceil(s.activeAlert.countdownSec)} s. Tap Bunker in the dock: 2.5 m of regolith blocks about 90% of the protons.`
      };
    return {
      icon: <ShieldCheck size={24} color="#00e5ff" />,
      title: 'You are protected',
      text: 'Stay sheltered until the DONKI all-clear appears in the Telemetry Log. Leaving early means a high radiation dose.'
    };
  }
  if (s.oxygenLevel < 80 && s.powerAllocations.eclss < eclssNeed)
    return {
      icon: <Wind size={24} color="#00e5ff" />,
      title: 'Air scrubbers are starving',
      text: `Life support needs about ${eclssNeed} kW right now but only gets ${s.powerAllocations.eclss} kW. Open Power and raise ECLSS.`
    };
  if (s.location === 'moon' && s.isDaylight && hoursToSunset < 4 && s.powerAllocations.eclss < 45)
    return {
      icon: <Moon size={24} color="#b0b8c4" />,
      title: 'Lunar night in ' + hoursToSunset.toFixed(1) + ' h',
      text: 'At night the heaters need +15 kW and solar panels make 0 kW. Raise ECLSS to about 45 kW and charge the battery now.'
    };
  if (batt < 35 && gen < load)
    return {
      icon: <BatteryCharging size={24} color="#ffb000" />,
      title: 'Battery is draining',
      text: `Generation is ${gen.toFixed(0)} kW but load is ${load} kW. Cut the Science Lab or Comms power until you're back in the green.`
    };
  if (s.cropGrowthProgress >= 70)
    return {
      icon: <Wheat size={24} color="#00e676" />,
      title: 'Crops are ready',
      text: 'Tap Harvest in the dock for +2 Sols of fresh food.'
    };
  if (s.foodStockpileSols <= 3)
    return {
      icon: <Wheat size={24} color="#ff9100" />,
      title: 'Food is running low',
      text: 'Give the greenhouse at least 16 kW and keep water above 15%. High-yield mode grows food faster but costs more power.'
    };
  if (s.dustStormActive)
    return {
      icon: <Wind size={24} color="#ff9100" />,
      title: 'Dust storm power plan',
      text: 'Solar output is down ~80%. Your nuclear RTG is the lifeline, so pause science until the sky clears.'
    };
  if (s.waterLevel < 30 && !s.toggles.waterRationing)
    return {
      icon: <Droplets size={24} color="#00b0ff" />,
      title: 'Water is low',
      text: 'Turn on Ration in the dock. Morale drops slightly, but the crops and crew keep going.'
    };
  if (!s.toggles.roverOnEVA && !s.activeAlert && batt > 50)
    return {
      icon: <Car size={24} color="#00e5ff" />,
      title: 'Earn science safely with Rover',
      text: 'Conditions are calm. Walk up to the rover and press [E] to drive or send it on EVA to collect science 3× faster.'
    };
  return {
    icon: <Sparkles size={24} color="#ffd700" />,
    title: 'All systems nominal',
    text: 'Things look good, Commander! Board the rover ([E]), jump (Space), or fly with the jetpack (hold Shift).'
  };
}

interface Props {
  sim: SimState;
  left: number;
  total: number;
  onUse: () => void;
}

export function AstroBot({ sim, left, total, onUse }: Props) {
  const [hint, setHint] = useState<Hint | null>(null);

  const ask = () => {
    if (left <= 0) return;
    soundFx.playPop();
    setHint(pickHint(sim));
    onUse();
  };

  return (
    <div className="astrobot">
      {hint && (
        <div className="astrobot-card glass" role="status">
          <button type="button" className="close" onClick={() => setHint(null)} aria-label="Close hint">
            <X size={16} />
          </button>
          <span className="hint-icon">{hint.icon}</span>
          <div>
            <b>{hint.title}</b>
            <p>{hint.text}</p>
          </div>
        </div>
      )}
      <button
        type="button"
        className={`astrobot-btn ${left === 0 ? 'empty' : ''}`}
        onClick={ask}
        disabled={left === 0}
        title={left ? 'Ask AstroBot for a hint' : 'No hints left this mission'}
      >
        <span className="bot">
          <Bot size={20} />
        </span>
        <span className="label">{left ? 'Ask AstroBot' : 'Out of hints'}</span>
        <span className="count-badge">{left}</span>
        <span className="charges" aria-label={`${left} of ${total} hints left`}>
          {Array.from({ length: total }, (_, i) => <i key={i} className={i < left ? 'on' : ''} />)}
        </span>
      </button>
    </div>
  );
}
