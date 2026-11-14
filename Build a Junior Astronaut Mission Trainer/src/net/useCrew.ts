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

export type LinkStatus = 'online' | 'reconnecting' | 'offline';

export interface CrewStatus {
  online: boolean;
  /** 'reconnecting' while rejoining after a drop; 'offline' = continuing solo */
  status: LinkStatus;
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
  const [status, setStatus] = useState<LinkStatus>(() => (link && !link.closed ? 'online' : 'offline'));
  const [you, setYou] = useState<string | null>(() => link?.room?.you ?? null);
  const online = status === 'online';
  const h = useRef(handlers);
  useEffect(() => {
    h.current = handlers;
  });

  useEffect(() => {
    if (!link) return;
    window.clearTimeout(closeTimers.get(link));
    const nameOf = (id: string) => link.room?.peers.find((p) => p.id === id)?.name ?? 'A crewmate';
    const off = link.on((m) => {
      switch (m.t) {
        case 'peer-join':
          link.room?.peers.push(m.peer);
          setPeers((ps) => [...ps.filter((p) => p.id !== m.peer.id), m.peer]);
          h.current.onToast(`${m.peer.name} joined the crew`);
          break;
        case 'peer-leave': {
          const name = nameOf(m.id);
          if (link.room) link.room.peers = link.room.peers.filter((p) => p.id !== m.id);
          setPeers((ps) => ps.filter((p) => p.id !== m.id));
          h.current.onToast(`${name} left the crew`);
          break;
        }
        case 'host':
          if (link.room) link.room.hostId = m.hostId;
          setHostId(m.hostId);
          h.current.onToast(m.hostId === link.room?.you ? 'You are now the mission commander. The mission continues from your screen.' : `${nameOf(m.hostId)} is now commander`);
          break;
        case 'pose':
          h.current.onPose(m.id, m.p);
          break;
        case 'action':
          if (link.room?.hostId === link.room?.you && isValidAction(m.action)) h.current.onAction(m.action, m.name);
          break;
        case 'state':
          if (link.room?.hostId !== link.room?.you && m.state && typeof m.state === 'object') h.current.onState(m.state, m.phase);
          break;
        case 'emote':
          h.current.onEmote(m.id, m.e);
          break;
        case 'reconnecting':
          setStatus('reconnecting');
          if (m.attempt === 1) h.current.onToast('Crew link lost. Reconnecting…');
          break;
        case 'rejoined':
          setStatus('online');
          setYou(m.room.you);
          setPeers(m.room.peers);
          setHostId(m.room.hostId);
          h.current.onToast('Reconnected to your crew');
          break;
        case 'error':
          if (m.reason === 'closed') {
            setStatus('offline');
            h.current.onToast('Could not reach the crew. You are flying solo now; the mission continues on your screen.');
          }
          break;
      }
    });
    return () => {
      off();
      closeTimers.set(link, window.setTimeout(() => link.close(), 150));
    };
  }, [link]);

  return {
    online: Boolean(link) && online,
    status: link ? status : 'offline',
    code: link?.room?.code ?? null,
    you,
    peers,
    hostId,
    authority: !link || !online || hostId === you
  };
}
