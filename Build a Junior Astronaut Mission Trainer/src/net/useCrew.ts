import { useEffect, useRef, useState } from 'react';
import { isValidAction, type SimAction } from '../game/actions';
import type { SimState } from '../game/simBridge';
import type { PeerPose } from '../scene/remoteCrew';
import type { CrewLink, PeerInfo } from './crewLink';

interface Handlers {
  onAction: (action: SimAction, by: string) => void;
  onState: (state: SimState, phase: string) => void;
  onPose: (id: string, pose: PeerPose) => void;
  onEmote: (id: string, emoji: string) => void;
  onToast: (text: string) => void;
}

export interface CrewStatus {
  online: boolean;
  code: string | null;
  you: string | null;
  peers: PeerInfo[];
  hostId: string | null;
  /** This browser runs the simulation (solo, host, or disconnected guest). */
  authority: boolean;
}

// Delay closing so React StrictMode's dev-only unmount/remount doesn't drop the socket.
const closeTimers = new WeakMap<CrewLink, number>();

export function useCrew(link: CrewLink | null, handlers: Handlers): CrewStatus {
  const [peers, setPeers] = useState<PeerInfo[]>(() => link?.room?.peers ?? []);
  const [hostId, setHostId] = useState<string | null>(() => link?.room?.hostId ?? null);
  const [online, setOnline] = useState(() => Boolean(link && !link.closed));
  const h = useRef(handlers);
  useEffect(() => {
    h.current = handlers;
  });

  useEffect(() => {
    if (!link) return;
    window.clearTimeout(closeTimers.get(link));
    const you = link.room?.you;
    const nameOf = (id: string) => link.room?.peers.find((p) => p.id === id)?.name ?? 'A crewmate';
    const off = link.on((m) => {
      switch (m.t) {
        case 'peer-join':
          link.room?.peers.push(m.peer);
          setPeers((ps) => [...ps.filter((p) => p.id !== m.peer.id), m.peer]);
          h.current.onToast(`🧑‍🚀 ${m.peer.name} joined the crew`);
          break;
        case 'peer-leave': {
          const name = nameOf(m.id);
          if (link.room) link.room.peers = link.room.peers.filter((p) => p.id !== m.id);
          setPeers((ps) => ps.filter((p) => p.id !== m.id));
          h.current.onToast(`👋 ${name} left the crew`);
          break;
        }
        case 'host':
          if (link.room) link.room.hostId = m.hostId;
          setHostId(m.hostId);
          h.current.onToast(m.hostId === you ? '⭐ You are now the mission commander' : `⭐ ${nameOf(m.hostId)} is now commander`);
          break;
        case 'pose':
          h.current.onPose(m.id, m.p);
          break;
        case 'action':
          if (link.room?.hostId === you && isValidAction(m.action)) h.current.onAction(m.action, m.name);
          break;
        case 'state':
          if (link.room?.hostId !== you && m.state && typeof m.state === 'object') h.current.onState(m.state, m.phase);
          break;
        case 'emote':
          h.current.onEmote(m.id, m.e);
          break;
        case 'error':
          if (m.reason === 'closed') {
            setOnline(false);
            h.current.onToast('📡 Lost the crew link — continuing solo');
          }
          break;
      }
    });
    return () => {
      off();
      closeTimers.set(link, window.setTimeout(() => link.close(), 150));
    };
  }, [link]);

  const you = link?.room?.you ?? null;
  return {
    online: Boolean(link) && online,
    code: link?.room?.code ?? null,
    you,
    peers,
    hostId,
    authority: !link || !online || hostId === you
  };
}
