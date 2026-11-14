import { Bot, ChevronRight, Map, RotateCcw, Unlock } from 'lucide-react';
import type { DecisionRecord, HistoryPoint, StormBasis } from '../utils/simulationEngine';
import { DOSE_REFERENCES, NASA_CAREER_LIMIT_MSV } from '../data/nasaFacts';

export interface Outcome {
  success: boolean;
  score: number;
  hintBonus: number;
  sols: number;
  science: number;
  crewHealth: number;
  failureReason: string;
  missedGoals: string[];
  badges: string[];
  unlocked: string | null;
  history: HistoryPoint[];
  decisions: DecisionRecord[];
  doseMSv: number;
  stormsSurvived: number;
  stormsHit: number;
  storms: StormBasis[];
  weatherLive: boolean;
}

const SERIES: Array<{ key: keyof HistoryPoint; label: string; color: string }> = [
  { key: 'battery', label: 'Battery', color: '#ffb547' },
  { key: 'oxygen', label: 'Air', color: '#38d9ff' },
  { key: 'health', label: 'Crew health', color: '#3ddc97' }
];

/** Small line chart of the run: what your choices did over time. */
export function HistoryChart({ history }: { history: HistoryPoint[] }) {
  if (history.length < 2) return null;
  const W = 460;
  const H = 120;
  const t0 = history[0].t;
  const t1 = history[history.length - 1].t || 1;
  const x = (t: number) => ((t - t0) / Math.max(1, t1 - t0)) * W;
  const y = (v: number) => H - (Math.max(0, Math.min(100, v)) / 100) * H;
  const days = Math.floor(t1 / 24);
  return (
    <figure className="history-chart">
      <svg viewBox={`-2 -4 ${W + 4} ${H + 18}`} role="img" aria-label="Battery, air and crew health during the mission">
        {[25, 50, 75].map((v) => <line key={v} x1={0} x2={W} y1={y(v)} y2={y(v)} className="grid" />)}
        {Array.from({ length: days }, (_, i) => (
          <g key={i}>
            <line x1={x((i + 1) * 24)} x2={x((i + 1) * 24)} y1={0} y2={H} className="grid day" />
            <text x={x((i + 1) * 24) + 3} y={H + 13} className="axis">sol {i + 2}</text>
          </g>
        ))}
        {SERIES.map((s) => (
          <polyline key={s.key} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" points={history.map((p) => `${x(p.t).toFixed(1)},${y(p[s.key] as number).toFixed(1)}`).join(' ')} />
        ))}
      </svg>
      <figcaption>
        {SERIES.map((s) => (
          <span key={s.key}><i style={{ background: s.color }} /> {s.label}</span>
        ))}
      </figcaption>
    </figure>
  );
}

interface Props {
  outcome: Outcome;
  missionTitle: string;
  hintsUsed: number;
  hintBudget: number;
  unlockedTitle: string | null;
  canRetry: boolean;
  multiplayer: boolean;
  next: { title: string; onGo: () => void } | null;
  onMap: () => void;
  onRetry: () => void;
  onData: () => void;
  badgeDefs: Array<{ id: string; icon: string; title: string; description: string }>;
}

export function Debrief({ outcome: o, missionTitle, hintsUsed, hintBudget, unlockedTitle, canRetry, multiplayer, next, onMap, onRetry, onData, badgeDefs }: Props) {
  const earth = DOSE_REFERENCES.find((d) => d.id === 'earth')!;
  const earthDays = Math.round(o.doseMSv / earth.mSvPerDay);
  const earned = badgeDefs.filter((b) => o.badges.includes(b.id));
  return (
    <div className="debrief-overlay">
      <div className={`debrief-card glass ${o.success ? 'win' : 'lose'}`}>
        <span className="eyebrow">{missionTitle}</span>
        <h2>{o.success ? 'Mission Accomplished' : 'Mission Not Complete'}</h2>
        {!o.success && <p className="fail-reason">{o.failureReason}</p>}

        <div className="debrief-stats">
          <div><span>Sols</span><b>{o.sols}</b></div>
          <div><span>Science</span><b>{o.science}</b></div>
          <div><span>Crew health</span><b>{o.crewHealth}%</b></div>
          <div className="hi"><span>Score</span><b>{o.score.toLocaleString()}</b></div>
        </div>

        <section>
          <h3 className="debrief-h">How your base did</h3>
          <HistoryChart history={o.history} />
        </section>

        {o.decisions.length > 0 && (
          <section>
            <h3 className="debrief-h">Your decisions and what they teach</h3>
            <ul className="debrief-decisions">
              {o.decisions.map((d, i) => (
                <li key={`${d.cardId}-${i}`}>
                  <span className="d-icon" aria-hidden="true">{d.icon}</span>
                  <div>
                    <b>Sol {d.sol}: {d.title}</b> <span className="d-choice">You chose “{d.choice}”</span>
                    <p>{d.lesson}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="debrief-rad">
          <h3 className="debrief-h">Radiation check</h3>
          <p>
            Your crew absorbed <b>{o.doseMSv.toFixed(1)} mSv</b>, as much as about <b>{earthDays.toLocaleString()} days</b> of natural radiation on Earth. That is{' '}
            {((o.doseMSv / NASA_CAREER_LIMIT_MSV) * 100).toFixed(1)}% of NASA's lifetime limit.
            {o.stormsSurvived + o.stormsHit > 0 && (
              <> You faced {o.stormsSurvived + o.stormsHit} solar storm{o.stormsSurvived + o.stormsHit > 1 ? 's' : ''}: {o.stormsSurvived} with the crew shielded{o.stormsHit ? `, ${o.stormsHit} without` : ''}.</>
            )}
          </p>
          {o.storms.length > 0 && (
            <p className="debrief-src">
              Storms modelled on: {o.storms.map((s, i) => (
                <span key={`${s.date}-${i}`}>
                  {i > 0 && ', '}
                  <a href={s.url} target="_blank" rel="noreferrer">{s.label} ({s.date})</a> <span className={`tag ${s.live ? 'live' : 'archive'}`}>{s.live ? 'LIVE' : 'ARCHIVE'}</span>
                </span>
              ))}
            </p>
          )}
          <button type="button" className="link-btn" onClick={onData}>See the real NASA data →</button>
        </section>

        <p className="hint-bonus">
          <Bot size={15} /> Calls to Mission Control: {hintsUsed}/{hintBudget}
          {o.hintBonus > 0 && <> · <b>+{o.hintBonus}</b> independence bonus</>}
        </p>
        {earned.length > 0 && (
          <div className="debrief-badges">
            {earned.map((b) => <span key={b.id} title={b.description}>{b.icon} {b.title}</span>)}
          </div>
        )}
        {unlockedTitle && (
          <div className="unlock-banner">
            <span className="lock-anim"><Unlock size={22} /></span>
            <div>
              <small>NEW MISSION UNLOCKED</small>
              <b>{unlockedTitle}</b>
            </div>
          </div>
        )}
        {!o.success && <p className="try-again">Every astronaut fails in training. Try a different plan: what would you power down first?</p>}
        <div className="debrief-actions">
          <button type="button" className="ghost" onClick={onMap}><Map size={15} /> Mission map</button>
          {canRetry ? (
            <button type="button" className={o.success ? 'ghost' : 'cta'} onClick={onRetry}><RotateCcw size={15} /> {multiplayer ? 'Retry with crew' : 'Try again'}</button>
          ) : (
            <span className="waiting-note">Waiting for the commander to retry…</span>
          )}
          {next && (
            <button type="button" className="cta" onClick={next.onGo}>
              Next: {next.title} <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
