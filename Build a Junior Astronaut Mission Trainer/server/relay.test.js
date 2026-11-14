// Integration tests for the crew relay: real HTTP server + real WebSocket clients.
import { createServer } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { attachCrewRelay } from './relay.js';
import { MAX_PAYLOAD } from './protocol.js';

let server;
let relay;
let url;
const sockets = [];

async function start(opts = {}) {
  server = createServer();
  relay = attachCrewRelay(server, { log: () => {}, ...opts });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  url = `ws://127.0.0.1:${server.address().port}/crew`;
}

beforeEach(() => start());
afterEach(async () => {
  for (const s of sockets.splice(0)) s.terminate();
  await new Promise((r) => server.close(r));
});

/** A test client that queues every message it receives. */
function client() {
  const ws = new WebSocket(url);
  sockets.push(ws);
  const inbox = [];
  const waiters = [];
  ws.on('message', (d) => {
    const m = JSON.parse(String(d));
    const i = waiters.findIndex((w) => w.pred(m));
    if (i >= 0) waiters.splice(i, 1)[0].resolve(m);
    else inbox.push(m);
  });
  const c = {
    ws,
    inbox,
    open: () => new Promise((r, j) => (ws.readyState === 1 ? r() : (ws.once('open', r), ws.once('error', j)))),
    send: (m) => ws.send(typeof m === 'string' ? m : JSON.stringify(m)),
    next: (pred = () => true, ms = 1500) =>
      new Promise((resolve, reject) => {
        const i = inbox.findIndex(pred);
        if (i >= 0) return resolve(inbox.splice(i, 1)[0]);
        const w = { pred, resolve: (m) => (clearTimeout(t), resolve(m)) };
        const t = setTimeout(() => {
          waiters.splice(waiters.indexOf(w), 1);
          reject(new Error('timeout waiting for message'));
        }, ms);
        waiters.push(w);
      }),
    /** resolves true if no matching message arrives within ms */
    silent: async (pred = () => true, ms = 250) => {
      try {
        await c.next(pred, ms);
        return false;
      } catch {
        return true;
      }
    },
    closed: () => new Promise((r) => (ws.readyState === 3 ? r() : ws.once('close', (code) => r(code))))
  };
  return c;
}

const AVATAR = { id: 'nova', suit: '#ffffff', accent: '#1f5fd1', visor: '#d9a441', skin: '#c69c7b' };
const STATE = { sol: 1, hour: 8, toggles: {}, powerAllocations: {}, logs: [] };

async function hostRoom(name = 'Host') {
  const h = client();
  await h.open();
  h.send({ t: 'host', missionId: 'mission-1', location: 'moon', name, avatar: AVATAR });
  const room = await h.next((m) => m.t === 'room');
  return { h, room };
}

async function joinRoom(code, name = 'Guest') {
  const g = client();
  await g.open();
  g.send({ t: 'join', code, name, avatar: AVATAR });
  return { g, msg: await g.next((m) => m.t === 'room' || m.t === 'error') };
}

const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));

describe('rooms', () => {
  it('hosts a room and lets a guest join', async () => {
    const { h, room } = await hostRoom();
    expect(room.code).toMatch(/^[A-Z2-9]{5}$/);
    expect(room.hostId).toBe(room.you);
    const { msg } = await joinRoom(room.code);
    expect(msg.t).toBe('room');
    expect(msg.hostId).toBe(room.you);
    expect(msg.peers.map((p) => p.name)).toEqual(['Host']);
    const joined = await h.next((m) => m.t === 'peer-join');
    expect(joined.peer.name).toBe('Guest');
    expect(relay.stats()).toMatchObject({ rooms: 1, peers: 2 });
  });

  it('rejects unknown, missing and malformed room codes', async () => {
    for (const code of ['ZZZZZ', '', undefined, 12345, 'abc<script>']) {
      const { msg } = await joinRoom(code);
      expect(msg).toMatchObject({ t: 'error', reason: 'not-found' });
    }
  });

  it('rejects unsupported missions', async () => {
    const h = client();
    await h.open();
    h.send({ t: 'host', missionId: 'mission-99', name: 'x' });
    expect(await h.next()).toMatchObject({ t: 'error', reason: 'bad-mission' });
    expect(relay.stats().rooms).toBe(0);
  });

  it('caps a crew at four astronauts', async () => {
    const { room } = await hostRoom();
    for (let i = 0; i < 3; i++) expect((await joinRoom(room.code, `G${i}`)).msg.t).toBe('room');
    expect((await joinRoom(room.code, 'Fifth')).msg).toMatchObject({ t: 'error', reason: 'full' });
  });

  it('enforces the room limit', async () => {
    await new Promise((r) => server.close(r));
    await start({ maxRooms: 1 });
    await hostRoom();
    const h2 = client();
    await h2.open();
    h2.send({ t: 'host', missionId: 'mission-1', name: 'x' });
    expect(await h2.next()).toMatchObject({ t: 'error', reason: 'busy' });
  });

  it('sanitizes names and avatars', async () => {
    const { h, room } = await hostRoom();
    const g = client();
    await g.open();
    g.send({ t: 'join', code: room.code, name: '<img src=x>Bob!!' + 'x'.repeat(50), avatar: { suit: 'red; background:url(x)', id: '../../etc' } });
    await g.next((m) => m.t === 'room');
    const { peer } = await h.next((m) => m.t === 'peer-join');
    expect(peer.name).not.toMatch(/[<>!]/);
    expect(peer.name.length).toBeLessThanOrEqual(16);
    expect(peer.avatar.suit).toBe('#eeeeee');
    expect(peer.avatar.id).toBe('etc');
  });
});

describe('leaving and host promotion', () => {
  it('tells the crew when a guest leaves', async () => {
    const { h, room } = await hostRoom();
    const { g, msg } = await joinRoom(room.code);
    g.ws.close();
    expect(await h.next((m) => m.t === 'peer-leave')).toMatchObject({ id: msg.you });
    expect(relay.stats().peers).toBe(1);
  });

  it('promotes the longest-connected guest when the host leaves', async () => {
    const { h, room } = await hostRoom();
    const a = await joinRoom(room.code, 'A');
    const b = await joinRoom(room.code, 'B');
    h.ws.close();
    expect(await a.g.next((m) => m.t === 'host')).toEqual({ t: 'host', hostId: a.msg.you });
    expect(await b.g.next((m) => m.t === 'host')).toEqual({ t: 'host', hostId: a.msg.you });
    // the new commander's state now reaches the others
    a.g.send({ t: 'state', state: STATE, phase: 'play' });
    expect(await b.g.next((m) => m.t === 'state')).toMatchObject({ phase: 'play' });
  });

  it('deletes the room when the last astronaut leaves', async () => {
    const { h, room } = await hostRoom();
    const { g } = await joinRoom(room.code);
    h.ws.close();
    g.ws.close();
    await tick(100);
    expect(relay.stats()).toMatchObject({ rooms: 0, peers: 0 });
    expect((await joinRoom(room.code)).msg).toMatchObject({ t: 'error', reason: 'not-found' });
  });

  it('a guest that drops can rejoin the same code', async () => {
    const { room } = await hostRoom();
    const { g } = await joinRoom(room.code, 'Flaky');
    g.ws.terminate(); // network interruption
    await tick(80);
    const again = await joinRoom(room.code, 'Flaky');
    expect(again.msg.t).toBe('room');
    expect(relay.stats().peers).toBe(2);
  });

  it('closes every socket and room on relay shutdown (restart)', async () => {
    const { h, room } = await hostRoom();
    const { g } = await joinRoom(room.code);
    const closed = Promise.all([h.closed(), g.closed()]);
    relay.close();
    await closed;
    expect(relay.stats().rooms).toBe(0);
  });
});

describe('authority', () => {
  it('forwards valid guest actions to the host only, tagged with the sender', async () => {
    const { h, room } = await hostRoom();
    const a = await joinRoom(room.code, 'A');
    const b = await joinRoom(room.code, 'B');
    a.g.send({ t: 'action', action: { type: 'bunker' } });
    expect(await h.next((m) => m.t === 'action')).toEqual({ t: 'action', id: a.msg.you, name: 'A', action: { type: 'bunker' } });
    expect(await b.g.silent((m) => m.t === 'action')).toBe(true);
  });

  it('guests cannot pause or warp time', async () => {
    const { h, room } = await hostRoom();
    const { g } = await joinRoom(room.code);
    g.send({ t: 'action', action: { type: 'pause' } });
    g.send({ t: 'action', action: { type: 'speed', value: 4 } });
    expect(await h.silent((m) => m.t === 'action')).toBe(true);
    expect(await g.next((m) => m.t === 'error')).toMatchObject({ reason: 'bad-message', detail: 'not-commander' });
  });

  it('guests cannot publish authoritative state', async () => {
    const { h, room } = await hostRoom();
    const a = await joinRoom(room.code, 'A');
    const b = await joinRoom(room.code, 'B');
    a.g.send({ t: 'state', state: STATE, phase: 'play' });
    expect(await b.g.silent((m) => m.t === 'state')).toBe(true);
    expect(await h.silent((m) => m.t === 'state')).toBe(true);
  });

  it('peers cannot impersonate each other (relay stamps the sender id)', async () => {
    const { h, room } = await hostRoom();
    const { g, msg } = await joinRoom(room.code);
    g.send({ t: 'pose', id: room.you, p: { x: 1, y: 0, z: 2, h: 0, m: true } });
    g.send({ t: 'emote', id: room.you, e: '👋' });
    expect((await h.next((m) => m.t === 'pose')).id).toBe(msg.you);
    expect((await h.next((m) => m.t === 'emote')).id).toBe(msg.you);
  });

  it('host state is broadcast to every guest', async () => {
    const { h, room } = await hostRoom();
    const { g } = await joinRoom(room.code);
    h.send({ t: 'state', state: STATE, phase: 'play' });
    expect(await g.next((m) => m.t === 'state')).toEqual({ t: 'state', state: STATE, phase: 'play' });
  });
});

describe('validation and abuse', () => {
  it('drops malformed JSON, unknown types and invalid payloads without crashing', async () => {
    const { h, room } = await hostRoom();
    const { g } = await joinRoom(room.code);
    g.send('{not json');
    g.send('[]');
    g.send({ t: 'teleport' });
    g.send({ t: 'pose', p: { x: 'NaN', y: 0, z: 0, h: 0 } });
    g.send({ t: 'pose', p: { x: 1e9, y: 0, z: 0, h: 0 } });
    g.send({ t: 'emote', e: 'hello there' });
    g.send({ t: 'action', action: { type: 'alloc', key: '__proto__', value: 5 } });
    g.send({ t: 'action', action: { type: 'alloc', key: 'eclss', value: Infinity } });
    h.send({ t: 'state', state: { sol: 'x' }, phase: 'play' });
    h.send({ t: 'state', state: STATE, phase: 'hacked' });
    expect(await h.silent((m) => ['pose', 'emote', 'action'].includes(m.t))).toBe(true);
    expect(await g.silent((m) => m.t === 'state')).toBe(true);
    // relay still works afterwards
    g.send({ t: 'emote', e: '👍' });
    expect(await h.next((m) => m.t === 'emote')).toMatchObject({ e: '👍' });
  });

  it('closes a socket that keeps sending garbage', async () => {
    const c = client();
    await c.open();
    for (let i = 0; i < 25; i++) c.send('nope');
    expect(await c.closed()).toBe(1008);
  });

  it('rejects oversized frames by closing the socket', async () => {
    const { room } = await hostRoom();
    const { g } = await joinRoom(room.code);
    g.send({ t: 'emote', e: 'x'.repeat(MAX_PAYLOAD + 10) });
    expect(await g.closed()).toBe(1009);
    await tick(50);
    expect(relay.stats().peers).toBe(1); // no stale peer left behind
  });

  it('rate-limits floods: excess frames are dropped, and a sustained flood is disconnected', async () => {
    const { h, room } = await hostRoom();
    const { g } = await joinRoom(room.code);
    for (let i = 0; i < 300; i++) g.send({ t: 'emote', e: '🚀' });
    await tick(300);
    const received = h.inbox.filter((m) => m.t === 'emote').length;
    expect(received).toBeGreaterThan(10);
    expect(received).toBeLessThan(150);
    for (let i = 0; i < 600; i++) g.send({ t: 'emote', e: '🚀' });
    expect(await g.closed()).toBe(1008);
  }, 20_000);

  it('ignores in-room messages from sockets that never joined', async () => {
    const c = client();
    await c.open();
    c.send({ t: 'state', state: STATE, phase: 'play' });
    expect(await c.next()).toMatchObject({ t: 'error', reason: 'bad-message', detail: 'not-in-room' });
    expect(relay.stats().rooms).toBe(0);
  });
});
