import type { ReactNode } from 'react';
import {
  Sun,
  Moon,
  Tag,
  Radio,
  BookOpen,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Play,
  Pause,
  BatteryCharging,
  Wind,
  Radiation,
  Wheat,
  Heart,
  FlaskConical,
  Shield,
  ShieldAlert,
  Car,
  Droplets,
  Video,
  User,
  Eye,
  Home,
  Sprout,
  Zap,
  ClipboardList,
  Compass
} from 'lucide-react';
import { soundFx } from '../utils/soundEffects';
import { formatHour } from '../utils/simulationEngine';
import { MISSION_CAMPAIGNS } from '../utils/nasaData';
import { AvatarBadge } from '../components/AvatarBadge';
import type { SimState } from '../game/simBridge';
import type { AvatarConfig, ShotId } from '../game/types';

type Mission = (typeof MISSION_CAMPAIGNS)[number] | null;

// ------------------------------------------------------------------ top bar
interface TopBarProps {
  sim: SimState;
  mission: Mission;
  avatar: AvatarConfig;
  callsign: string;
  muted: boolean;
  labels: boolean;
  vrOk: boolean;
  /** false for crewmates: only the commander controls time */
  canControlTime: boolean;
  onPause: () => void;
  onSpeed: (s: number) => void;
  onMute: () => void;
  onLabels: () => void;
  onMode: () => void;
  onData: () => void;
  onGlossary: () => void;
  onGuidelines?: () => void;
  onFullscreen: () => void;
  onVR: () => void;
  onExit: () => void;
}

export function TopBar(p: TopBarProps) {
  const { sim, mission } = p;
  const g = mission?.goal;
  const battPct = (sim.batteryKWh / sim.batteryMaxKWh) * 100;
  const objectives = g
    ? [
        { label: `Sol ${Math.min(sim.sol, g.targetSols)}/${g.targetSols}`, ok: sim.sol >= g.targetSols },
        { label: `O₂ ≥${g.minO2}%`, ok: sim.oxygenLevel >= g.minO2 },
        { label: `Batt ≥${g.minBattery}%`, ok: battPct >= g.minBattery }
      ]
    : [];

  return (
    <header className="hud-top">
      <div className="hud-id">
        <AvatarBadge avatar={p.avatar} size={38} />
        <div>
          <b>{mission ? mission.title.replace(/^Mission \d+: /, '') : 'Sandbox Outpost'}</b>
          <div className="objectives">
            <small>CMDR {p.callsign.toUpperCase()}</small>
            {objectives.map((o) => (
              <span key={o.label} className={o.ok ? 'ok' : ''}>{o.ok ? '✓' : '○'} {o.label}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="hud-clock">
        <span className="sol">SOL {sim.sol}</span>
        <span className="time">{formatHour(sim.hour)}</span>
        <span className="cycle" title={sim.isDaylight ? 'Daylight (Solar peak)' : 'Night (Battery drain)'}>
          {sim.isDaylight ? <Sun size={15} className="text-amber" /> : <Moon size={15} className="text-cyan" />}
        </span>
        <div className="speed">
          <button
            type="button"
            className={sim.paused ? 'on' : ''}
            onClick={p.onPause}
            disabled={!p.canControlTime}
            title={p.canControlTime ? 'Pause / resume' : 'Only the commander controls time'}
          >
            {sim.paused ? <Play size={12} /> : <Pause size={12} />}
          </button>
          {[1, 5, 20].map((s) => (
            <button
              key={s}
              type="button"
              className={!sim.paused && sim.speed === s ? 'on' : ''}
              onClick={() => p.onSpeed(s)}
              disabled={!p.canControlTime}
              title={p.canControlTime ? `Time warp ×${s}` : 'Only the commander controls time'}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      <div className="hud-actions">
        {p.onGuidelines && (
          <IconBtn title="Mission Guidelines & Walkthrough" onClick={p.onGuidelines}>
            <ClipboardList size={17} />
          </IconBtn>
        )}
        <IconBtn title="Floating labels" on={p.labels} onClick={p.onLabels}>
          <Tag size={17} />
        </IconBtn>
        <IconBtn title="NASA data" onClick={p.onData}>
          <Radio size={17} />
        </IconBtn>
        <IconBtn title="Glossary" onClick={p.onGlossary}>
          <BookOpen size={17} />
        </IconBtn>
        <IconBtn title={p.muted ? 'Unmute' : 'Mute'} onClick={p.onMute}>
          {p.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </IconBtn>
        <button type="button" className="mode-pill" onClick={p.onMode} title="Switch training track">
          {sim.mode === 'cadet' ? 'CADET' : 'DIRECTOR'}
        </button>
        {p.vrOk && (
          <button type="button" className="vr-pill" onClick={p.onVR}>
            <Eye size={14} /> Enter VR
          </button>
        )}
        <IconBtn title="Fullscreen" onClick={p.onFullscreen}>
          <Maximize2 size={17} />
        </IconBtn>
        <IconBtn title="Leave mission" onClick={p.onExit}>
          <X size={17} />
        </IconBtn>
      </div>
    </header>
  );
}

function IconBtn({ children, title, on, onClick }: { children: ReactNode; title: string; on?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`icon-btn ${on ? 'on' : ''}`} title={title} aria-label={title} onClick={() => { soundFx.playClick(); onClick(); }}>
      {children}
    </button>
  );
}

// ------------------------------------------------------------------ vitals
function Meter({ icon, label, value, pct, sub, tone, onInfo }: { icon: ReactNode; label: string; value: string; pct: number; sub?: string; tone: 'good' | 'warn' | 'bad' | 'info'; onInfo?: () => void }) {
  return (
    <div className={`meter tone-${tone}`}>
      <div className="meter-head">
        <span className="meter-icon">{icon}</span>
        <span className="meter-label">
          {label}
          {onInfo && <button type="button" className="info-dot" onClick={onInfo} aria-label={`What is ${label}?`}>?</button>}
        </span>
        <span className="meter-value">{value}</span>
      </div>
      <div className="meter-track"><i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></div>
      {sub && <span className="meter-sub">{sub}</span>}
    </div>
  );
}

const tone = (pct: number, warn = 50, bad = 25): 'good' | 'warn' | 'bad' => (pct < bad ? 'bad' : pct < warn ? 'warn' : 'good');

export function VitalsPanel({ sim, mission, onGlossary }: { sim: SimState; mission: Mission; onGlossary: (term: string) => void }) {
  const batt = (sim.batteryKWh / sim.batteryMaxKWh) * 100;
  const gen = sim.solarOutputKW + sim.rtgNuclearOutputKW;
  const load = Object.values(sim.powerAllocations).reduce((a: number, b: number) => a + b, 0);
  const net = gen - load;
  const radPct = Math.min(100, (sim.radiationDoseRate / 1.5) * 100);
  const sciTarget = mission?.goal.scienceTarget ?? 200;
  return (
    <aside className="hud-vitals">
      <Meter
        icon={<BatteryCharging size={18} />}
        label="Battery"
        value={`${Math.round(batt)}%`}
        pct={batt}
        tone={tone(batt, 50, 25)}
        sub={`${net >= 0 ? '▲' : '▼'} ${net >= 0 ? '+' : ''}${net.toFixed(0)} kW · gen ${gen.toFixed(0)} / load ${load}`}
        onInfo={() => onGlossary('RTG')}
      />
      <Meter
        icon={<Wind size={18} />}
        label="Oxygen"
        value={`${Math.round(sim.oxygenLevel)}%`}
        pct={sim.oxygenLevel}
        tone={tone(sim.oxygenLevel, 75, 50)}
        sub={`CO₂ ${Math.round(sim.co2LevelPpm)} ppm`}
        onInfo={() => onGlossary('ECLSS')}
      />
      <Meter
        icon={<Radiation size={18} />}
        label="Radiation"
        value={`${sim.radiationDoseRate.toFixed(2)}`}
        pct={radPct}
        tone={sim.radiationDoseRate > 0.5 ? 'bad' : sim.radiationDoseRate > 0.2 ? 'warn' : 'good'}
        sub={`mSv/h · total ${sim.accumulatedDoseMSv.toFixed(1)} mSv`}
        onInfo={() => onGlossary('Sievert')}
      />
      <Meter
        icon={<Wheat size={18} />}
        label="Food"
        value={`${sim.foodStockpileSols} Sols`}
        pct={(sim.foodStockpileSols / 10) * 100}
        tone={tone((sim.foodStockpileSols / 10) * 100, 40, 20)}
        sub={`Water ${Math.round(sim.waterLevel)}% · crops ${Math.round(sim.cropGrowthProgress)}%`}
      />
      <Meter
        icon={<Heart size={18} />}
        label="Crew"
        value={`${Math.round(sim.crewHealth)}%`}
        pct={sim.crewHealth}
        tone={tone(sim.crewHealth, 60, 30)}
        sub={`Morale ${Math.round(sim.crewMorale)}%`}
      />
      <Meter
        icon={<FlaskConical size={18} />}
        label="Science"
        value={`${Math.round(sim.sciencePoints)}`}
        pct={(sim.sciencePoints / sciTarget) * 100}
        tone="info"
        sub={`Target ${sciTarget}`}
      />
    </aside>
  );
}

// ------------------------------------------------------------------ dock
interface DockProps {
  sim: SimState;
  shot: ShotId;
  onShot: (s: ShotId) => void;
  onBunker: () => void;
  onShield: () => void;
  onEVA: () => void;
  onHarvest: () => void;
  onRation: () => void;
}

const CAMS: Array<{ id: ShotId; icon: ReactNode; label: string }> = [
  { id: 'overview', icon: <Radio size={16} />, label: 'Orbit' },
  { id: 'avatar', icon: <User size={16} />, label: 'Follow me' },
  { id: 'helmet', icon: <Eye size={16} />, label: 'Helmet cam' },
  { id: 'habitat', icon: <Home size={16} />, label: 'Habitat' },
  { id: 'greenhouse', icon: <Sprout size={16} />, label: 'Greenhouse' },
  { id: 'power', icon: <Zap size={16} />, label: 'Power' },
  { id: 'rover', icon: <Car size={16} />, label: 'Rover' }
];

export function Dock({ sim, shot, onShot, onBunker, onShield, onEVA, onHarvest, onRation }: DockProps) {
  const t = sim.toggles;
  const walkHint = shot === 'avatar' || shot === 'helmet';
  return (
    <div className="hud-dock">
      <div className="dock-group actions">
        <DockBtn
          on={t.bunkerLockdown}
          danger={Boolean(sim.activeAlert)}
          onClick={() => { soundFx.playShieldActivate(); onBunker(); }}
          icon={<Shield size={18} />}
          label={t.bunkerLockdown ? 'Sealed' : 'Bunker'}
        />
        <DockBtn
          on={t.magneticShieldActive}
          onClick={() => { soundFx.playToggle(!t.magneticShieldActive); onShield(); }}
          icon={<ShieldAlert size={18} />}
          label="Deflector"
        />
        <DockBtn
          on={t.roverOnEVA}
          disabled={t.bunkerLockdown}
          onClick={() => { soundFx.playToggle(!t.roverOnEVA); onEVA(); }}
          icon={<Car size={18} />}
          label="EVA"
        />
        <DockBtn
          on={false}
          disabled={sim.cropGrowthProgress < 70}
          onClick={() => { soundFx.playSuccess(); onHarvest(); }}
          icon={<Wheat size={18} />}
          label="Harvest"
        />
        <DockBtn
          on={t.waterRationing}
          onClick={() => { soundFx.playToggle(!t.waterRationing); onRation(); }}
          icon={<Droplets size={18} />}
          label="Ration"
        />
        <button
          type="button"
          className="dock-btn cam-cycle"
          onClick={() => {
            soundFx.playClick();
            const i = CAMS.findIndex((c) => c.id === shot);
            onShot(CAMS[(i + 1) % CAMS.length].id);
          }}
        >
          <span>{CAMS.find((c) => c.id === shot)?.icon ?? <Video size={18} />}</span>
          <small>Camera</small>
        </button>
      </div>
      <div className="dock-group cams">
        {CAMS.map((c) => (
          <button key={c.id} type="button" className={`cam-btn ${shot === c.id ? 'on' : ''}`} onClick={() => { soundFx.playClick(); onShot(c.id); }} title={c.label}>
            <span>{c.icon}</span>
            <small>{c.label}</small>
          </button>
        ))}
      </div>
      {walkHint && (
        <div className="walk-hint">
          <Compass size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          <b>W A S D</b> walk · <b>Space</b> jump · <b>Shift</b> thrust · <b>E</b> rover{shot === 'helmet' ? ' · drag to look' : ''}
        </div>
      )}
    </div>
  );
}

function DockBtn({ icon, label, on, danger, disabled, onClick }: { icon: ReactNode; label: string; on: boolean; danger?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`dock-btn ${on ? 'on' : ''} ${danger && !on ? 'danger' : ''}`} disabled={disabled} onClick={onClick}>
      <span>{icon}</span>
      <small>{label}</small>
    </button>
  );
}
