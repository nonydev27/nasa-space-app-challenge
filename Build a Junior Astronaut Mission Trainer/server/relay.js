// Crew relay: a tiny WebSocket hub for co-op missions.
//
// One player hosts a room (gets a 5-letter crew code); up to 3 more join with it.
// The host's browser runs the simulation and broadcasts state; everyone streams
// their astronaut's pose. The relay holds no game state beyond room membership.
// Players are children, so communication is limited to a fixed set of emotes:
// there is no free-text or voice chat.
//
// Every frame is validated in server/protocol.js before it is forwarded.
// Host-only rules are enforced here AND in the browser (src/game/actions.ts).
//
// Host loss: the longest-connected crewmate is promoted. Their browser already
// holds the last snapshot the old host sent, so the mission CONTINUES from that
// snapshot (at most ~200 ms behind). If the relay itself restarts, all rooms are
// gone: clients try to rejoin their code a few times, then continue SOLO locally.
//
// Limits (env vars): CREW_MAX_ROOMS (200), CREW_MAX_CONNECTIONS (800),
// CREW_IDLE_ROOM_MIN (120). Set CREW_LOG=0 to silence connection logs.

import { WebSocketServer } from 'ws';
import { CODE_RE, MAX_CREW, MAX_PAYLOAD, MISSIONS, cleanAvatar, cleanName, parseFrame, route } from './protocol.js';

const PATH = '/crew';
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
/** Invalid frames tolerated before the socket is closed. */
const MAX_STRIKES = 20;
/** Rate-limited frames tolerated (in a row) before the socket is closed as a flood. */
const MAX_DROPPED = 400;

const envInt = (name, d) => {
  const v = Number(process.env[name]);
  return Number.isInteger(v) && v > 0 ? v : d;
};

/**
 * @param {{ maxRooms?: number, maxConnections?: number, idleRoomMs?: number, heartbeatMs?: number, log?: (msg: string) => void }} [opts]
 */
export function createCrewRelay(opts = {}) {
  const maxRooms = opts.maxRooms ?? envInt('CREW_MAX_ROOMS', 200);
  const maxConnections = opts.maxConnections ?? envInt('CREW_MAX_CONNECTIONS', 800);
  const idleRoomMs = opts.idleRoomMs ?? envInt('CREW_IDLE_ROOM_MIN', 120) * 60_000;
  const logEnabled = process.env.CREW_LOG !== '0';
  const log = opts.log ?? ((m) => logEnabled && console.log(`[crew] ${m}`));

  /** @type {Map<string, any>} */
  const rooms = new Map();
  let nextId = 1;
  const counters = { connections: 0, rejected: 0, dropped: 0, roomsCreated: 0, roomsExpired: 0 };

  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD });

  function makeCode() {
    for (let attempt = 0; attempt < 50; attempt++) {
      let c = '';
      for (let i = 0; i < 5; i++) c += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
      if (!rooms.has(c)) return c;
    }
    return null;
  }

  const send = (ws, msg) => ws.readyState === 1 && ws.send(JSON.stringify(msg));

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

  /** Token bucket: ~40 frames/second sustained, bursts of 80. */
  function allow(peer) {
    const now = Date.now();
    peer.tokens = Math.min(80, peer.tokens + ((now - peer.last) / 1000) * 40);
    peer.last = now;
    if (peer.tokens < 1) return false;
    peer.tokens -= 1;
    return true;
  }

  function leave(peer) {
    const room = peer.room;
    if (!room || !room.peers.has(peer.id)) return;
    room.peers.delete(peer.id);
    peer.room = null;
    if (room.peers.size === 0) {
      rooms.delete(room.code);
      log(`room ${room.code} closed (empty)`);
      return;
    }
    broadcast(room, { t: 'peer-leave', id: peer.id });
    if (room.hostId === peer.id) {
      room.hostId = room.peers.keys().next().value;
      broadcast(room, { t: 'host', hostId: room.hostId });
      log(`room ${room.code}: commander left, promoted ${room.hostId}`);
    }
  }

  function strike(peer, reason) {
    counters.dropped += 1;
    peer.strikes += 1;
    if (peer.strikes === 1) send(peer.ws, { t: 'error', reason: 'bad-message', detail: reason });
    if (peer.strikes >= MAX_STRIKES) {
      log(`closing ${peer.id}: too many invalid messages (${reason})`);
      peer.ws.close(1008, 'invalid messages');
    }
  }

  function onConnection(ws) {
    if (wss.clients.size > maxConnections) {
      counters.rejected += 1;
      send(ws, { t: 'error', reason: 'busy' });
      ws.close(1013, 'server busy');
      return;
    }
    counters.connections += 1;
    const peer = { id: `c${nextId++}`, ws, name: 'Cadet', avatar: cleanAvatar(null), tokens: 20, last: Date.now(), strikes: 0, flood: 0, room: null };
    ws.isAlive = true;
    ws.on('pong', () => (ws.isAlive = true));

    ws.on('message', (raw, isBinary) => {
      if (!allow(peer)) {
        counters.dropped += 1;
        if (++peer.flood >= MAX_DROPPED) {
          log(`closing ${peer.id}: message flood`);
          ws.close(1008, 'rate limit');
        }
        return;
      }
      peer.flood = Math.max(0, peer.flood - 1);
      const msg = isBinary ? null : parseFrame(raw);
      if (!msg) return strike(peer, 'malformed');

      if (!peer.room) {
        if (msg.t === 'host') {
          if (!MISSIONS.test(String(msg.missionId))) return send(ws, { t: 'error', reason: 'bad-mission' });
          if (rooms.size >= maxRooms) {
            counters.rejected += 1;
            return send(ws, { t: 'error', reason: 'busy' });
          }
          const code = makeCode();
          if (!code) return send(ws, { t: 'error', reason: 'busy' });
          peer.name = cleanName(msg.name);
          peer.avatar = cleanAvatar(msg.avatar);
          const room = { code, missionId: msg.missionId, location: msg.location === 'mars' ? 'mars' : 'moon', hostId: peer.id, peers: new Map([[peer.id, peer]]), lastActive: Date.now() };
          rooms.set(code, room);
          peer.room = room;
          counters.roomsCreated += 1;
          log(`room ${code} opened by ${peer.id} (${room.missionId})`);
          return send(ws, roomInfo(room, peer.id));
        }
        if (msg.t === 'join') {
          const code = String(msg.code ?? '').toUpperCase().trim();
          if (!CODE_RE.test(code)) return send(ws, { t: 'error', reason: 'not-found' });
          const target = rooms.get(code);
          if (!target) return send(ws, { t: 'error', reason: 'not-found' });
          if (target.peers.size >= MAX_CREW) return send(ws, { t: 'error', reason: 'full' });
          peer.name = cleanName(msg.name);
          peer.avatar = cleanAvatar(msg.avatar);
          peer.room = target;
          target.peers.set(peer.id, peer);
          target.lastActive = Date.now();
          send(ws, roomInfo(target, peer.id));
          broadcast(target, { t: 'peer-join', peer: { id: peer.id, name: peer.name, avatar: peer.avatar } }, peer.id);
          return;
        }
        return strike(peer, 'not-in-room');
      }

      const room = peer.room;
      const r = route(msg, peer, room.hostId);
      if (r.kind === 'drop') return strike(peer, r.reason);
      room.lastActive = Date.now();
      if (r.kind === 'broadcast') broadcast(room, r.msg, peer.id);
      else {
        const host = room.peers.get(room.hostId);
        if (host) send(host.ws, r.msg);
      }
    });

    ws.on('close', () => leave(peer));
    ws.on('error', () => leave(peer));
  }

  wss.on('connection', onConnection);

  const heartbeatMs = opts.heartbeatMs ?? 25_000;
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
    const now = Date.now();
    for (const room of rooms.values()) {
      if (now - room.lastActive > idleRoomMs) {
        counters.roomsExpired += 1;
        log(`room ${room.code} expired (idle)`);
        for (const p of room.peers.values()) p.ws.close(1001, 'room idle');
        rooms.delete(room.code);
      }
    }
  }, heartbeatMs);
  heartbeat.unref?.();

  return {
    wss,
    path: PATH,
    stats: () => ({ rooms: rooms.size, peers: [...rooms.values()].reduce((n, r) => n + r.peers.size, 0), sockets: wss.clients.size, limits: { maxRooms, maxConnections, maxCrew: MAX_CREW }, ...counters }),
    /** Disconnect everyone and stop timers (graceful shutdown / tests). */
    close() {
      clearInterval(heartbeat);
      for (const ws of wss.clients) ws.close(1001, 'server shutting down');
      rooms.clear();
      wss.close();
    }
  };
}

/**
 * Attach the relay to an existing Node HTTP server (Vite dev/preview or server/index.js).
 * Only upgrade requests for `/crew` are handled; others (e.g. Vite HMR) are left alone.
 */
export function attachCrewRelay(httpServer, opts) {
  const relay = createCrewRelay(opts);
  httpServer.on('upgrade', (req, socket, head) => {
    let pathname;
    try {
      pathname = new URL(req.url ?? '', 'http://localhost').pathname;
    } catch {
      return;
    }
    if (pathname !== PATH) return;
    relay.wss.handleUpgrade(req, socket, head, (ws) => relay.wss.emit('connection', ws, req));
  });
  httpServer.on('close', () => relay.close());
  return relay;
}
