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
  Compass,
  Music,
  HelpCircle
} from 'lucide-react';
import { soundFx } from '../utils/soundEffects';
import { formatHour, SPEEDS, totalLoadKW } from '../utils/simulationEngine';
import { MISSION_CAMPAIGNS } from '../utils/nasaData';
import { NASA_CAREER_LIMIT_MSV } from '../data/nasaFacts';
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
  musicOn?: boolean;
  onSolHelp?: () => void;
  onMusic?: () => void;
  onLabels: () => void;
  onMode: () => void;
  onData: () => void;
  onGlossary: () => void;
  onGuidelines?: () => void;
  onFullscreen: () => void;
  onVR: () => void;
  onExit: () => void;
  /** Space weather status pill */
  weather?: { live: boolean; risk: string } | null;
}

export function TopBar(p: TopBarProps) {
  const { sim, mission } = p;
  const g = mission ? sim.goal : null;
  const battPct = (sim.batteryKWh / sim.batteryMaxKWh) * 100;
  const objectives = g
    ? [
        { label: `Sol ${Math.min(sim.sol, g.targetSols)}/${g.targetSols}`, ok: sim.sol > g.targetSols },
        { label: `Air ≥${g.minO2}%`, ok: sim.oxygenLevel >= g.minO2 },
        { label: `Battery ≥${g.minBattery}%`, ok: battPct >= g.minBattery },
        { label: `Science ${Math.min(g.scienceTarget, Math.floor(sim.sciencePoints))}/${g.scienceTarget}`, ok: sim.sciencePoints >= g.scienceTarget },
        { label: `Food ≥${g.minFoodDays} sol`, ok: sim.foodStockpileSols >= g.minFoodDays }
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
        <span className="sol" title="A sol is one day at the base (a Mars day is 24 h 39 min)">SOL {sim.sol}</span>
        {p.onSolHelp && (
          <button type="button" className="sol-help" onClick={p.onSolHelp} aria-label="What is a sol?">
            <HelpCircle size={13} />
          </button>
        )}
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
          {SPEEDS.map((s) => (
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
        {p.weather && (
          <button type="button" className={`wx-pill ${p.weather.live ? 'live' : 'archive'} risk-${p.weather.risk}`} onClick={p.onData} title="Real NASA DONKI space weather sets how often storms happen. Tap to see the data.">
            <span className="dot" />
            {p.weather.live ? 'LIVE' : 'ARCHIVE'} · storms {p.weather.risk}
          </button>
        )}
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
        {p.onMusic && (
          <IconBtn title={p.musicOn ? 'Music off' : 'Music on'} on={p.musicOn} onClick={p.onMusic}>
            <Music size={17} />
          </IconBtn>
        )}
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

export function VitalsPanel({ sim, onGlossary }: { sim: SimState; mission: Mission; onGlossary: (term: string) => void }) {
  const batt = (sim.batteryKWh / sim.batteryMaxKWh) * 100;
  const gen = sim.solarOutputKW + sim.rtgNuclearOutputKW;
  const load = totalLoadKW(sim);
  const net = gen - load;
  const rad = sim.radiationDoseRate;
  const radWord = rad > 0.5 ? 'DANGER' : rad > 0.1 ? 'HIGH' : 'Normal';
  const cadet = sim.mode === 'cadet';
  const word = (pct: number, warn: number, bad: number) => (pct < bad ? 'Danger' : pct < warn ? 'Low' : 'Good');
  return (
    <aside className={`hud-vitals ${cadet ? 'cadet' : ''}`} aria-label="Outpost vitals">
      <Meter
        icon={<BatteryCharging size={18} />}
        label={cadet ? 'Power' : 'Battery'}
        value={`${Math.round(batt)}%`}
        pct={batt}
        tone={tone(batt, 50, 25)}
        sub={cadet ? `${word(batt, 50, 25)} · ${net >= 0 ? '▲ charging' : '▼ draining'}` : `${net >= 0 ? '▲' : '▼'} ${net >= 0 ? '+' : ''}${net.toFixed(0)} kW · make ${gen.toFixed(0)} / use ${load.toFixed(0)}`}
        onInfo={() => onGlossary('RTG')}
      />
      <Meter
        icon={<Wind size={18} />}
        label={cadet ? 'Air' : 'Oxygen'}
        value={`${Math.round(sim.oxygenLevel)}%`}
        pct={sim.oxygenLevel}
        tone={tone(sim.oxygenLevel, 75, 50)}
        sub={cadet ? word(sim.oxygenLevel, 75, 50) : `CO₂ ${Math.round(sim.co2LevelPpm)} ppm`}
        onInfo={() => onGlossary('ECLSS')}
      />
      <Meter
        icon={<Radiation size={18} />}
        label="Radiation"
        value={cadet ? radWord : rad.toFixed(3)}
        pct={Math.min(100, (rad / 1.0) * 100)}
        tone={rad > 0.5 ? 'bad' : rad > 0.1 ? 'warn' : 'good'}
        sub={cadet ? `Crew total ${sim.accumulatedDoseMSv.toFixed(1)} mSv` : `mSv/h · total ${sim.accumulatedDoseMSv.toFixed(2)} of ${NASA_CAREER_LIMIT_MSV} mSv limit`}
        onInfo={() => onGlossary('Sievert')}
      />
      <Meter
        icon={<Wheat size={18} />}
        label="Food"
        value={`${sim.foodStockpileSols} sols`}
        pct={(sim.foodStockpileSols / 10) * 100}
        tone={tone((sim.foodStockpileSols / 10) * 100, 40, 20)}
        sub={`Crops ${Math.round(sim.cropGrowthProgress)}% grown${cadet ? '' : ` · water ${Math.round(sim.waterLevel)}%`}`}
        onInfo={() => onGlossary('Sol')}
      />
      {!cadet && (
        <>
          <Meter icon={<Heart size={18} />} label="Crew" value={`${Math.round(sim.crewHealth)}%`} pct={sim.crewHealth} tone={tone(sim.crewHealth, 60, 30)} sub={`Morale ${Math.round(sim.crewMorale)}%`} />
          <Meter
            icon={<FlaskConical size={18} />}
            label="Science"
            value={`${Math.round(sim.sciencePoints)}`}
            pct={(sim.sciencePoints / Math.max(1, sim.goal.scienceTarget)) * 100}
            tone="info"
            sub={`Goal ${sim.goal.scienceTarget}`}
          />
        </>
      )}
      {cadet && sim.crewHealth < 70 && (
        <Meter icon={<Heart size={18} />} label="Crew health" value={`${Math.round(sim.crewHealth)}%`} pct={sim.crewHealth} tone={tone(sim.crewHealth, 60, 30)} sub={word(sim.crewHealth, 60, 30)} />
      )}
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
