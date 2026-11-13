import { useEffect, useState } from 'react';
import { AvatarBadge } from '../components/AvatarBadge';
import { EMOTES, type Emote, type PeerInfo } from '../net/crewLink';
import type { AvatarConfig } from '../game/types';
import { soundFx } from '../utils/soundEffects';

interface Props {
  code: string;
  online: boolean;
  you: { name: string; avatar: AvatarConfig };
  youAreHost: boolean;
  hostId: string | null;
  peers: PeerInfo[];
  onEmote: (e: Emote) => void;
  /** start collapsed (phones) */
  compact?: boolean;
}

export function CrewPanel({ code, online, you, youAreHost, hostId, peers, onEmote, compact = false }: Props) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(!compact);

  // number keys 1–8 fire emotes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      const n = Number(e.key);
      if (n >= 1 && n <= EMOTES.length) onEmote(EMOTES[n - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onEmote]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the code is visible anyway */
    }
  };

  return (
    <div className={`crew-panel ${open ? 'open' : ''} ${online ? '' : 'offline'}`}>
      <button type="button" className="crew-head" onClick={() => setOpen((o) => !o)}>
        <span className="dot" />
        <span>CREW</span>
        <b>{code}</b>
        <span className="count">{peers.length + 1}/4</span>
      </button>
      {open && (
        <div className="crew-body">
          <button type="button" className="copy-code" onClick={copy}>{copied ? '✓ Copied' : '⧉ Copy crew code'}</button>
          <ul>
            <li>
              <AvatarBadge avatar={you.avatar} size={26} />
              <span>{you.name} <small>(you)</small></span>
              {youAreHost && <em title="Mission commander: runs the simulation">⭐</em>}
            </li>
            {peers.map((p) => (
              <li key={p.id}>
                <AvatarBadge avatar={p.avatar} size={26} />
                <span>{p.name}</span>
                {p.id === hostId && <em title="Mission commander">⭐</em>}
              </li>
            ))}
          </ul>
          {peers.length === 0 && <p className="crew-hint">Share the code <b>{code}</b>. Friends tap <b>Join crew</b> on their mission map.</p>}
          <div className="emote-row">
            {EMOTES.map((e, i) => (
              <button key={e} type="button" onClick={() => { soundFx.playPop(); onEmote(e); }} title={`Emote (key ${i + 1})`}>{e}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export interface Toast {
  id: number;
  text: string;
}

export function Toasts({ items }: { items: Toast[] }) {
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => <div key={t.id} className="toast">{t.text}</div>)}
    </div>
  );
}
