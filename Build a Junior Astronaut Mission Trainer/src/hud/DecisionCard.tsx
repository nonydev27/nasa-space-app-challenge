import { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { findCard, isGain, type EffectKey, type DecisionOption } from '../game/decisions';
import { soundFx } from '../utils/soundEffects';

const LABEL: Record<EffectKey, { icon: string; name: string; unit: (v: number) => string }> = {
  battery: { icon: '🔋', name: 'Battery', unit: (v) => `${Math.abs(v)} kWh` },
  oxygen: { icon: '🫁', name: 'Air', unit: (v) => `${Math.abs(v)}%` },
  food: { icon: '🥫', name: 'Food', unit: (v) => `${Math.abs(v)} sol` },
  science: { icon: '🔬', name: 'Science', unit: (v) => `${Math.abs(v)}` },
  health: { icon: '❤️', name: 'Health', unit: (v) => `${Math.abs(v)}%` },
  morale: { icon: '🙂', name: 'Morale', unit: (v) => `${Math.abs(v)}%` },
  water: { icon: '💧', name: 'Water', unit: (v) => `${Math.abs(v)}%` },
  dose: { icon: '☢️', name: 'Radiation', unit: (v) => `${Math.abs(v)} mSv` },
  crops: { icon: '🌱', name: 'Crops', unit: (v) => `${Math.abs(v)}%` }
};

/** Plain-language chips for an option: green = gain, red = cost. */
export function effectChips(o: DecisionOption): Array<{ text: string; good: boolean }> {
  const chips = (Object.entries(o.effects) as [EffectKey, number][]).map(([k, v]) => ({
    text: `${LABEL[k].icon} ${v > 0 ? '+' : '−'}${LABEL[k].unit(v)} ${LABEL[k].name}`,
    good: isGain(k, v)
  }));
  const m = o.modifier;
  if (m) {
    const h = `${Math.round(m.hoursLeft)} h`;
    if (m.loadKW) chips.push({ text: `⚡ uses ${m.loadKW} kW for ${h}`, good: false });
    if (m.solarMult && m.solarMult > 1) chips.push({ text: `☀️ +${Math.round((m.solarMult - 1) * 100)}% solar for ${h}`, good: true });
    if (m.solarMult && m.solarMult < 1) chips.push({ text: `☀️ −${Math.round((1 - m.solarMult) * 100)}% solar for ${h}`, good: false });
    if (m.eclssMult && m.eclssMult < 1) chips.push({ text: `🫁 weaker air cleaning for ${h}`, good: false });
    for (const [k, v] of Object.entries(m.perHour ?? {}) as [EffectKey, number][]) chips.push({ text: `${LABEL[k].icon} ${LABEL[k].name} ${v > 0 ? 'rises' : 'drops'} for ${h}`, good: isGain(k, v) });
  }
  return chips;
}

interface Props {
  cardId: string;
  /** false for crewmates waiting on someone else's choice in co-op? Everyone may choose; first choice wins. */
  onChoose: (option: number) => void;
}

export function DecisionCard({ cardId, onChoose }: Props) {
  const card = findCard(cardId);
  useEffect(() => {
    soundFx.playPop();
  }, [cardId]);
  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key) - 1;
      if (n >= 0 && n < card.options.length) onChoose(n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, onChoose]);
  if (!card) return null;

  return (
    <div className="decision-backdrop" role="dialog" aria-modal="true" aria-labelledby="decision-title">
      <div className="decision-card glass">
        <div className="decision-head">
          <span className="decision-icon" aria-hidden="true">{card.icon}</span>
          <div>
            <span className="eyebrow">Commander's decision · the clock is paused</span>
            <h2 id="decision-title">{card.title}</h2>
          </div>
        </div>
        <p className="decision-text">{card.text}</p>
        <div className="decision-options">
          {card.options.map((o, i) => (
            <button key={o.label} type="button" className="decision-option" onClick={() => { soundFx.playClick(); onChoose(i); }}>
              <span className="opt-key">{i + 1}</span>
              <b>{o.label}</b>
              <small>{o.detail}</small>
              <span className="chips">
                {effectChips(o).map((c) => (
                  <span key={c.text} className={`chip ${c.good ? 'good' : 'bad'}`}>{c.text}</span>
                ))}
              </span>
            </button>
          ))}
        </div>
        <p className="decision-fact">
          <span className="fact-tag">Real science</span> {card.fact.text}{' '}
          <a href={card.fact.source.url} target="_blank" rel="noreferrer">
            {card.fact.source.label} <ExternalLink size={11} />
          </a>
        </p>
      </div>
    </div>
  );
}
