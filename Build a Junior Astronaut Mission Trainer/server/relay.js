// Crew relay — tiny WebSocket hub for co-op missions.
//
// One player hosts a room (gets a 5-letter crew code); up to 3 more join with it.
// The host's browser runs the simulation and broadcasts state; everyone streams
// their astronaut's pose. The server only relays — it holds no game state beyond
// room membership. Communication between players is limited to a fixed set of
// emotes (no free-text chat), since players are children.

import { WebSocketServer } from 'ws';

const PATH = '/crew';
const MAX_CREW = 4;
const MAX_PAYLOAD = 96 * 1024;
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const EMOTES = new Set(['👋', '👍', '🚀', '⚠️', '😄', '🆘', '🎉', '🧑‍🚀']);
const HEX = /^#[0-9a-fA-F]{6}$/;
const MISSIONS = /^(mission-[1-5]|sandbox)$/;

/** @typedef {{ id: string, ws: import('ws').WebSocket, name: string, avatar: object, tokens: number, last: number }} Peer */
/** @typedef {{ code: string, missionId: string, location: string, hostId: string, peers: Map<string, Peer> }} Room */

/** @type {Map<string, Room>} */
const rooms = new Map();
let nextId = 1;

function makeCode() {
  for (let attempt = 0; attempt < 50; attempt++) {
    let c = '';
    for (let i = 0; i < 5; i++) c += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    if (!rooms.has(c)) return c;
  }
  throw new Error('no free room codes');
}

function cleanName(v) {
  return String(v ?? 'Cadet').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 16) || 'Cadet';
}

function cleanAvatar(a) {
  const o = a && typeof a === 'object' ? a : {};
  const color = (c, d) => (typeof c === 'string' && HEX.test(c) ? c : d);
  return {
    id: String(o.id ?? 'nova').slice(0, 24),
    name: String(o.name ?? 'Astronaut').slice(0, 24),
    role: String(o.role ?? '').slice(0, 40),
    bio: '',
    suit: color(o.suit, '#eeeeee'),
    accent: color(o.accent, '#1f5fd1'),
    visor: color(o.visor, '#d9a441'),
    skin: color(o.skin, '#c69c7b')
  };
}

function send(ws, msg) {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function broadcast(room, msg, exceptId) {
  const data = JSON.stringify(msg);
  for (const p of room.peers.values()) if (p.id !== exceptId && p.ws.readyState === 1) p.ws.send(data);
}

function roomInfo(room, you) {
  return {
    t: 'room',
    code: room.code,
    you,
    hostId: room.hostId,
    missionId: room.missionId,
    location: room.location,
    peers: [...room.peers.values()].filter((p) => p.id !== you).map((p) => ({ id: p.id, name: p.name, avatar: p.avatar }))
  };
}

/** Token bucket: ~40 messages/second sustained per player. */
function allow(peer) {
  const now = Date.now();
  peer.tokens = Math.min(80, peer.tokens + ((now - peer.last) / 1000) * 40);
  peer.last = now;
  if (peer.tokens < 1) return false;
  peer.tokens -= 1;
  return true;
}

function leave(peer, room) {
  if (!room || !room.peers.has(peer.id)) return;
  room.peers.delete(peer.id);
  if (room.peers.size === 0) {
    rooms.delete(room.code);
    return;
  }
  broadcast(room, { t: 'peer-leave', id: peer.id });
  if (room.hostId === peer.id) {
    // promote the longest-standing crewmate; their browser takes over the simulation
    room.hostId = room.peers.keys().next().value;
    broadcast(room, { t: 'host', hostId: room.hostId });
  }
}

function onConnection(ws) {
  /** @type {Peer} */
  const peer = { id: `c${nextId++}`, ws, name: 'Cadet', avatar: cleanAvatar(null), tokens: 20, last: Date.now() };
  /** @type {Room | null} */
  let room = null;
  ws.isAlive = true;
  ws.on('pong', () => (ws.isAlive = true));

  ws.on('message', (raw) => {
    if (!allow(peer)) return;
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (!msg || typeof msg !== 'object') return;

    if (!room) {
      if (msg.t === 'host') {
        if (!MISSIONS.test(String(msg.missionId))) return send(ws, { t: 'error', reason: 'bad-mission' });
        peer.name = cleanName(msg.name);
        peer.avatar = cleanAvatar(msg.avatar);
        room = {
          code: makeCode(),
          missionId: msg.missionId,
          location: msg.location === 'mars' ? 'mars' : 'moon',
          hostId: peer.id,
          peers: new Map([[peer.id, peer]])
        };
        rooms.set(room.code, room);
        send(ws, roomInfo(room, peer.id));
      } else if (msg.t === 'join') {
        const target = rooms.get(String(msg.code ?? '').toUpperCase().trim());
        if (!target) return send(ws, { t: 'error', reason: 'not-found' });
        if (target.peers.size >= MAX_CREW) return send(ws, { t: 'error', reason: 'full' });
        peer.name = cleanName(msg.name);
        peer.avatar = cleanAvatar(msg.avatar);
        room = target;
        room.peers.set(peer.id, peer);
        send(ws, roomInfo(room, peer.id));
        broadcast(room, { t: 'peer-join', peer: { id: peer.id, name: peer.name, avatar: peer.avatar } }, peer.id);
      }
      return;
    }

    switch (msg.t) {
      case 'pose': {
        const n = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
        broadcast(room, { t: 'pose', id: peer.id, p: { x: n(msg.p?.x), y: n(msg.p?.y), z: n(msg.p?.z), h: n(msg.p?.h), m: !!msg.p?.m, a: !!msg.p?.a, t: !!msg.p?.t, v: msg.p?.v !== false } }, peer.id);
        break;
      }
      case 'action': {
        if (peer.id === room.hostId) return;
        const host = room.peers.get(room.hostId);
        if (host) send(host.ws, { t: 'action', id: peer.id, name: peer.name, action: msg.action });
        break;
      }
      case 'state': {
        if (peer.id !== room.hostId) return;
        broadcast(room, { t: 'state', state: msg.state, phase: msg.phase }, peer.id);
        break;
      }
      case 'emote': {
        if (!EMOTES.has(msg.e)) return;
        broadcast(room, { t: 'emote', id: peer.id, e: msg.e }, peer.id);
        break;
      }
    }
  });

  ws.on('close', () => leave(peer, room));
  ws.on('error', () => leave(peer, room));
}

/**
 * Attach the relay to an existing Node HTTP server (Vite dev/preview or server/index.js).
 * Only upgrade requests for `/crew` are handled; others (e.g. Vite HMR) are left alone.
 */
export function attachCrewRelay(httpServer) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD });
  wss.on('connection', onConnection);
  httpServer.on('upgrade', (req, socket, head) => {
    let pathname;
    try {
      pathname = new URL(req.url ?? '', 'http://localhost').pathname;
    } catch {
      return;
    }
    if (pathname !== PATH) return;
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 25000);
  httpServer.on('close', () => clearInterval(heartbeat));
  return wss;
}
