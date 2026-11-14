import { useEffect, useState, type FormEvent } from 'react';
import { Sun, Radiation, Sprout, MapPin, BookOpenCheck, X, ExternalLink, Search, Wifi, WifiOff } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';
import { CAREER_LIMIT_SOURCE, DATA_CATALOG, DONKI_ARCHIVE, DOSE_REFERENCES, NASA_CAREER_LIMIT_MSV, OSDR_STUDIES, SITES } from '../data/nasaFacts';
import { donkiDayUrl, type SpaceWeather } from '../data/donki';
import { searchOsdr, type OsdrResult } from '../data/liveData';

type Tab = 'weather' | 'radiation' | 'biology' | 'sites' | 'method';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  weather: SpaceWeather | null;
  /** Crew dose so far this mission, to compare with the references */
  crew?: { doseMSv: number; days: number; location: 'moon' | 'mars' } | null;
  initialTab?: Tab;
}

const TABS: Array<{ id: Tab; label: string; icon: typeof Sun }> = [
  { id: 'weather', label: 'Space weather', icon: Sun },
  { id: 'radiation', label: 'Radiation', icon: Radiation },
  { id: 'biology', label: 'Space biology', icon: Sprout },
  { id: 'sites', label: 'Moon & Mars sites', icon: MapPin },
  { id: 'method', label: 'Real vs. game', icon: BookOpenCheck }
];

const Src = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a className="src-link" href={href} target="_blank" rel="noreferrer">
    {children} <ExternalLink size={11} />
  </a>
);

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export function DataExplorer({ isOpen, onClose, weather, crew, initialTab = 'weather' }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);
  if (!isOpen) return null;

  return (
    <div className="dx-backdrop" onClick={onClose}>
      <div className="dx glass" role="dialog" aria-modal="true" aria-labelledby="dx-title" onClick={(e) => e.stopPropagation()}>
        <header className="dx-head">
          <div>
            <span className="eyebrow">Real NASA data behind the game</span>
            <h2 id="dx-title">NASA Data Explorer</h2>
          </div>
          <button type="button" className="icon-btn" onClick={() => { soundFx.playClick(); onClose(); }} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <nav className="dx-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => { soundFx.playClick(); setTab(t.id); }}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </nav>
        <div className="dx-body">
          {tab === 'weather' && <WeatherTab weather={weather} />}
          {tab === 'radiation' && <RadiationTab crew={crew ?? null} />}
          {tab === 'biology' && <BiologyTab />}
          {tab === 'sites' && <SitesTab />}
          {tab === 'method' && <MethodTab weather={weather} />}
        </div>
      </div>
    </div>
  );
}

export function WeatherStatus({ weather }: { weather: SpaceWeather | null }) {
  if (!weather) return <span className="wx-status loading">Contacting NASA DONKI…</span>;
  return weather.status === 'live' ? (
    <span className="wx-status live"><Wifi size={13} /> LIVE from NASA DONKI ({weather.via}) · {fmtDate(weather.fetchedAt)}</span>
  ) : (
    <span className="wx-status archive"><WifiOff size={13} /> ARCHIVE: no connection to NASA, using saved real events</span>
  );
}

function WeatherTab({ weather }: { weather: SpaceWeather | null }) {
  const live = weather?.status === 'live';
  return (
    <section className="dx-section">
      <WeatherStatus weather={weather} />
      <p className="dx-lead">
        NASA's <b>DONKI</b> database records every big solar flare, solar storm cloud (CME) and particle storm. AstroLab checks the last 30 days, and that
        sets how often solar storms hit your base: <b>storm risk is {weather?.risk ?? '…'}</b> because {weather?.reason ?? 'we are still checking'}.
      </p>
      {live && weather && (
        <>
          <div className="dx-stats">
            <div><b>{weather.counts.X}</b><span>X-class flares (strongest)</span></div>
            <div><b>{weather.counts.M}</b><span>M-class flares</span></div>
            <div><b>{weather.cmeCount}</b><span>solar storm clouds (CMEs)</span></div>
            <div><b>{weather.fastestCmeKms ? `${weather.fastestCmeKms.toLocaleString()}` : '—'}</b><span>fastest CME, km/s</span></div>
            <div><b>{weather.maxKp ?? '—'}</b><span>biggest Kp (Earth storm, 0–9)</span></div>
          </div>
          {weather.flares.length > 0 ? (
            <ul className="dx-list">
              {weather.flares.slice(0, 6).map((f) => (
                <li key={f.id}>
                  <span className={`cls cls-${f.classType[0]}`}>{f.classType}</span>
                  <span>Flare from {f.region} · {fmtDate(f.peak)}</span>
                  <Src href={donkiDayUrl('FLR', f.peak.slice(0, 10))}>DONKI record</Src>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dx-note">No flares were recorded in the last 30 days. A quiet Sun!</p>
          )}
        </>
      )}
      <h3>Famous real storms the game also uses</h3>
      <ul className="dx-cards">
        {DONKI_ARCHIVE.map((e) => (
          <li key={e.id} className="dx-card">
            <span className="tag archive">ARCHIVE · {fmtDate(e.date + 'T12:00Z')}</span>
            <b>{e.headline}</b>
            <p>{e.kidText}</p>
            <span className="srcs">{e.sources.map((s) => <Src key={s.url} href={s.url}>{s.label}</Src>)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RadiationTab({ crew }: { crew: { doseMSv: number; days: number; location: 'moon' | 'mars' } | null }) {
  const rows = [...DOSE_REFERENCES];
  const max = Math.max(...rows.map((r) => r.mSvPerDay));
  const crewPerDay = crew && crew.days > 0.05 ? crew.doseMSv / crew.days : null;
  return (
    <section className="dx-section">
      <p className="dx-lead">
        Radiation is measured in <b>millisieverts (mSv)</b>. These are real measurements of how much radiation a person would absorb in one day. Your
        crew's dose in the game uses the Moon and Mars numbers.
      </p>
      <div className="dose-chart" role="img" aria-label="Radiation dose per day in different places">
        {rows.map((r) => (
          <div key={r.id} className="dose-row">
            <span className="dose-place">{r.place}</span>
            <span className="dose-bar"><i style={{ width: `${Math.max(1.5, (r.mSvPerDay / max) * 100)}%` }} /></span>
            <span className="dose-val">{r.display}</span>
          </div>
        ))}
        {crewPerDay !== null && (
          <div className="dose-row crew">
            <span className="dose-place">Your crew (this mission)</span>
            <span className="dose-bar"><i style={{ width: `${Math.min(100, Math.max(1.5, (crewPerDay / max) * 100))}%` }} /></span>
            <span className="dose-val">{crewPerDay.toFixed(2)} mSv/day</span>
          </div>
        )}
      </div>
      <ul className="dx-cards two">
        {rows.map((r) => (
          <li key={r.id} className="dx-card">
            <b>{r.place}</b>
            <p>{r.note}</p>
            <Src href={r.source.url}>{r.source.label}</Src>
          </li>
        ))}
        <li className="dx-card">
          <b>Lifetime limit: {NASA_CAREER_LIMIT_MSV} mSv</b>
          <p>NASA limits how much radiation an astronaut may get in a whole career. Every spacewalk and every storm uses some of it up.</p>
          <Src href={CAREER_LIMIT_SOURCE.url}>{CAREER_LIMIT_SOURCE.label}</Src>
        </li>
      </ul>
      <p className="dx-note">
        RadLab, NASA's ISS dosimetry database, was offline (HTTP 500) when this version was built. Explore it at{' '}
        <Src href="https://visualization.osdr.nasa.gov/radlab/">RadLab</Src>.
      </p>
    </section>
  );
}

function BiologyTab() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<OsdrResult | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setRes(await searchOsdr(q));
    setBusy(false);
  };
  return (
    <section className="dx-section">
      <p className="dx-lead">
        NASA's <b>Open Science Data Repository (OSDR)</b> holds space biology experiments. These five real studies explain the food and crew-health rules in
        AstroLab.
      </p>
      <ul className="dx-cards two">
        {OSDR_STUDIES.map((s) => (
          <li key={s.accession} className="dx-card">
            <span className="tag">{s.accession} · {s.organism}</span>
            <b>{s.kidFinding}</b>
            <p className="game-link">In the game: {s.gameLink}</p>
            <Src href={s.url}>{s.title.length > 70 ? `${s.title.slice(0, 70)}…` : s.title}</Src>
          </li>
        ))}
      </ul>
      <h3>Search OSDR yourself</h3>
      <form className="dx-search" onSubmit={run}>
        <Search size={15} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try: lettuce, bone, radiation, mice" aria-label="Search NASA OSDR" maxLength={60} />
        <button type="submit" className="cta small" disabled={busy}>{busy ? 'Searching…' : 'Search'}</button>
      </form>
      {res && (
        <>
          <span className={`wx-status ${res.status === 'live' ? 'live' : 'archive'}`}>
            {res.status === 'live' ? `LIVE from osdr.nasa.gov · ${res.total} studies found` : `Offline: searched the ${OSDR_STUDIES.length} studies saved in the game`}
          </span>
          <ul className="dx-list">
            {res.hits.map((h) => (
              <li key={h.accession}>
                <span className="cls">{h.accession}</span>
                <span>{h.title}</span>
                <Src href={h.url}>open</Src>
              </li>
            ))}
            {res.hits.length === 0 && <li>No studies matched. Try a simpler word.</li>}
          </ul>
        </>
      )}
    </section>
  );
}

function SitesTab() {
  return (
    <section className="dx-section dx-sites">
      {(['moon', 'mars'] as const).map((k) => {
        const s = SITES[k];
        return (
          <article key={k} className="site-card">
            <figure>
              <img src={s.image.url} alt={s.image.caption} loading="lazy" />
              <figcaption>
                {s.image.caption} <Src href={s.image.link}>{s.image.credit}</Src>
              </figcaption>
            </figure>
            <div>
              <h3>{s.name}</h3>
              <dl>
                <div><dt>Where</dt><dd>{s.coords}</dd></div>
                <div><dt>Gravity</dt><dd>{s.gravity}</dd></div>
                <div><dt>Air</dt><dd>{s.air}</dd></div>
                <div><dt>Day</dt><dd>{s.day}</dd></div>
                <div><dt>Cold</dt><dd>{s.temps}</dd></div>
                <div><dt>Radio to Earth</dt><dd>{s.lightDelay}</dd></div>
                <div><dt>Power</dt><dd>{s.powerNote}</dd></div>
              </dl>
              <Src href={s.trek.url}>Explore it in {s.trek.label}</Src>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function MethodTab({ weather }: { weather: SpaceWeather | null }) {
  return (
    <section className="dx-section">
      <p className="dx-lead">AstroLab is a game, so some numbers are simplified. Here is exactly what is real and what is a game model.</p>
      <table className="dx-table">
        <thead>
          <tr><th>In the game</th><th>Where it comes from</th><th>Type</th></tr>
        </thead>
        <tbody>
          <tr><td>How often solar storms hit</td><td>Flares, CMEs and storms from the last 30 days in NASA DONKI</td><td><span className={`tag ${weather?.status === 'live' ? 'live' : 'archive'}`}>{weather?.status === 'live' ? 'LIVE' : 'ARCHIVE'}</span></td></tr>
          <tr><td>Which storm each alert is modelled on</td><td>A real DONKI flare (live), or one of six famous real events (archive)</td><td><span className="tag live">LIVE</span> / <span className="tag archive">ARCHIVE</span></td></tr>
          <tr><td>Normal radiation on the Moon and Mars</td><td>Chang'e-4 LND (1.37 mSv/day), Curiosity RAD (0.64 mSv/day)</td><td><span className="tag pub">PUBLISHED</span></td></tr>
          <tr><td>Food and crew-health rules</td><td>OSDR studies OSD-476, OSD-268, OSD-342, OSD-714, OSD-569</td><td><span className="tag pub">PUBLISHED</span></td></tr>
          <tr><td>Radio delay to Earth</td><td>Speed of light: Moon 1.3 s, Mars about 3–22 min each way</td><td><span className="tag pub">PUBLISHED</span></td></tr>
          <tr><td>Gravity, sol length, site locations</td><td>NASA mission facts, Moon Trek and Mars Trek</td><td><span className="tag pub">PUBLISHED</span></td></tr>
          <tr><td>Power sizes (kW), drain rates, shield strength, science points</td><td>Chosen so the trade-offs are playable. The Moon's 40 kW base power matches NASA's Fission Surface Power target.</td><td><span className="tag model">GAME MODEL</span></td></tr>
          <tr><td>Storm length and how fast time passes</td><td>Sped up so a mission fits in a lesson</td><td><span className="tag model">GAME MODEL</span></td></tr>
        </tbody>
      </table>
      <h3>Every source</h3>
      <ul className="dx-list">
        {DATA_CATALOG.map((d) => (
          <li key={d.name}>
            <span><b>{d.name}</b> · {d.how}</span>
            <Src href={d.url}>open</Src>
          </li>
        ))}
      </ul>
    </section>
  );
}
