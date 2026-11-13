// Browser side of the crew relay (server/relay.js).

import type { AvatarConfig, Location } from '../game/types';
import type { SimAction } from '../game/actions';
import type { SimState } from '../game/simBridge';
import type { PeerPose } from '../scene/remoteCrew';

export const EMOTES = ['👋', '👍', '🚀', '⚠️', '😄', '🆘', '🎉', '🧑‍🚀'] as const;
export type Emote = (typeof EMOTES)[number];

export interface PeerInfo {
  id: string;
  name: string;
  avatar: AvatarConfig;
}

export interface RoomInfo {
  code: string;
  you: string;
  hostId: string;
  missionId: string;
  location: Location;
  peers: PeerInfo[];
}

export type CrewMessage =
  | ({ t: 'room' } & RoomInfo)
  | { t: 'peer-join'; peer: PeerInfo }
  | { t: 'peer-leave'; id: string }
  | { t: 'host'; hostId: string }
  | { t: 'pose'; id: string; p: PeerPose }
  | { t: 'action'; id: string; name: string; action: unknown }
  | { t: 'state'; state: SimState; phase: string }
  | { t: 'emote'; id: string; e: string }
  | { t: 'error'; reason: 'not-found' | 'full' | 'bad-mission' | string };

export function crewServerUrl(): string {
  const configured = import.meta.env.VITE_CREW_URL as string | undefined;
  if (configured) return configured;
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/crew`;
}

export const CREW_ERRORS: Record<string, string> = {
  'not-found': 'No crew with that code. Check the letters and try again.',
  full: 'That crew is full (4 astronauts max).',
  'bad-mission': 'That mission cannot be hosted.',
  unreachable: 'Could not reach the crew server. Multiplayer needs the game server running (npm run dev or npm start).',
  closed: 'Lost connection to the crew server.'
};

type Listener = (m: CrewMessage) => void;

export class CrewLink {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  room: RoomInfo | null = null;
  closed = false;

  /** Open a socket and either host a new room or join one. Resolves with the room or rejects with an error reason. */
  static open(hello: { t: 'host'; missionId: string; location: Location; name: string; avatar: AvatarConfig } | { t: 'join'; code: string; name: string; avatar: AvatarConfig }): Promise<CrewLink> {
    return new Promise((resolve, reject) => {
      const link = new CrewLink();
      let settled = false;
      let ws: WebSocket;
      try {
        ws = new WebSocket(crewServerUrl());
      } catch {
        reject(new Error('unreachable'));
        return;
      }
      link.ws = ws;
      const timer = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          ws.close();
          reject(new Error('unreachable'));
        }
      }, 6000);
      ws.onopen = () => ws.send(JSON.stringify(hello));
      ws.onerror = () => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          reject(new Error('unreachable'));
        }
      };
      ws.onclose = () => {
        link.closed = true;
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          reject(new Error('unreachable'));
        }
        link.emit({ t: 'error', reason: 'closed' });
      };
      ws.onmessage = (ev) => {
        let msg: CrewMessage;
        try {
          msg = JSON.parse(String(ev.data));
        } catch {
          return;
        }
        if (!settled) {
          if (msg.t === 'room') {
            settled = true;
            window.clearTimeout(timer);
            link.room = { code: msg.code, you: msg.you, hostId: msg.hostId, missionId: msg.missionId, location: msg.location, peers: msg.peers };
            resolve(link);
          } else if (msg.t === 'error') {
            settled = true;
            window.clearTimeout(timer);
            ws.close();
            reject(new Error(msg.reason));
          }
          return;
        }
        link.emit(msg);
      };
    });
  }

  on(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(m: CrewMessage): void {
    this.listeners.forEach((fn) => fn(m));
  }

  private send(msg: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  sendPose(p: PeerPose): void { this.send({ t: 'pose', p }); }
  sendAction(action: SimAction): void { this.send({ t: 'action', action }); }
  sendState(state: SimState, phase: string): void { this.send({ t: 'state', state, phase }); }
  sendEmote(e: Emote): void { this.send({ t: 'emote', e }); }

  close(): void {
    this.closed = true;
    this.listeners.clear();
    this.ws?.close();
  }
}
