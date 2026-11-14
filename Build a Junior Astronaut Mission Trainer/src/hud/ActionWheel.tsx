// Round "command wheel" for phones and tablets. One big thumb button opens a
// ring of large, labelled commands, so small screens don't need a wide button bar.

import { useState, type ReactNode } from 'react';
import { Shield, ShieldAlert, Car, Wheat, Droplets, Video, PartyPopper, Grip, X } from 'lucide-react';
import type { SimState } from '../game/simBridge';
import { soundFx } from '../utils/soundEffects';

interface Props {
  sim: SimState;
  onBunker: () => void;
  onShield: () => void;
  onEVA: () => void;
  onHarvest: () => void;
  onRation: () => void;
  onCamera: () => void;
  onCheer: () => void;
}

export function ActionWheel({ sim, onBunker, onShield, onEVA, onHarvest, onRation, onCamera, onCheer }: Props) {
  const [open, setOpen] = useState(false);
  const t = sim.toggles;
  const storm = Boolean(sim.activeAlert);
  const items: Array<{ id: string; icon: ReactNode; label: string; on?: boolean; danger?: boolean; disabled?: boolean; go: () => void }> = [
    { id: 'bunker', icon: <Shield size={20} />, label: t.bunkerLockdown ? 'Leave bunker' : 'Bunker', on: t.bunkerLockdown, danger: storm && !t.bunkerLockdown, go: () => { soundFx.playShieldActivate(); onBunker(); } },
    { id: 'shield', icon: <ShieldAlert size={20} />, label: 'Deflector', on: t.magneticShieldActive, go: () => { soundFx.playToggle(!t.magneticShieldActive); onShield(); } },
    { id: 'eva', icon: <Car size={20} />, label: t.roverOnEVA ? 'Rover home' : 'Rover out', on: t.roverOnEVA, disabled: t.bunkerLockdown, go: () => { soundFx.playToggle(!t.roverOnEVA); onEVA(); } },
    { id: 'harvest', icon: <Wheat size={20} />, label: 'Harvest', disabled: sim.cropGrowthProgress < 70, go: () => { soundFx.playSuccess(); onHarvest(); } },
    { id: 'ration', icon: <Droplets size={20} />, label: t.waterRationing ? 'Stop saving' : 'Save water', on: t.waterRationing, go: () => { soundFx.playToggle(!t.waterRationing); onRation(); } },
    { id: 'camera', icon: <Video size={20} />, label: 'Camera', go: () => { soundFx.playClick(); onCamera(); } },
    { id: 'cheer', icon: <PartyPopper size={20} />, label: 'Cheer!', go: () => { soundFx.playPop(); onCheer(); } }
  ];
  const R = 92;
  return (
    <div className={`action-wheel ${open ? 'open' : ''}`}>
      {open &&
        items.map((it, i) => {
          // fan out over the upper half-circle
          const a = Math.PI + (i / (items.length - 1)) * Math.PI;
          return (
            <button
              key={it.id}
              type="button"
              className={`wheel-item ${it.on ? 'on' : ''} ${it.danger ? 'danger' : ''}`}
              style={{ transform: `translate(${Math.cos(a) * R}px, ${Math.sin(a) * R}px)` }}
              disabled={it.disabled}
              onClick={() => {
                it.go();
                if (it.id !== 'camera') setOpen(false);
              }}
            >
              {it.icon}
              <small>{it.label}</small>
            </button>
          );
        })}
      <button
        type="button"
        className={`wheel-hub ${storm && !t.bunkerLockdown ? 'alert' : ''}`}
        aria-expanded={open}
        aria-label={open ? 'Close commands' : 'Open commands'}
        onClick={() => { soundFx.playClick(); setOpen((o) => !o); }}
      >
        {open ? <X size={26} /> : <Grip size={26} />}
        <small>{open ? 'Close' : 'Commands'}</small>
      </button>
    </div>
  );
}
