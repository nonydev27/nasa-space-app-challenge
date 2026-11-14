// Crew relay wire protocol: every message a browser may send, validated at the
// relay boundary before anything is forwarded. Pure functions (no sockets) so the
// rules are unit-tested in server/protocol.test.js.
//
// Client → relay
//   { t:'host',  missionId, location, name, avatar }
//   { t:'join',  code, name, avatar }
//   { t:'pose',  p:{ x,y,z,h:number, m,a,t,v:boolean } }        any peer
//   { t:'emote', e }                                          any peer, fixed emoji set
//   { t:'action', action }                                    guests only → forwarded to host
//   { t:'state', state, phase }                               host only → broadcast
// Relay → client
//   room | peer-join | peer-leave | host | pose | emote | action | state | error

export const MAX_CREW = 4;
export const MAX_PAYLOAD = 96 * 1024;
export const EMOTES = new Set(['👋', '👍', '🚀', '⚠️', '😄', '🆘', '🎉', '🧑‍🚀']);
export const MISSIONS = /^(mission-[1-5]|sandbox)$/;
export const CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/;
export const PHASES = new Set(['countdown', 'loading', 'intro', 'play', 'outro', 'debrief']);
export const HOST_ONLY_ACTIONS = new Set(['pause', 'speed']);
const ALLOC_KEYS = new Set(['eclss', 'shields', 'greenhouse', 'scienceLab', 'commsRover']);
const SIMPLE_ACTIONS = new Set(['pause', 'shield', 'bunker', 'ration', 'crops', 'eva', 'harvest']);
const SPEEDS = new Set([1, 2, 4]);
const HEX = /^#[0-9a-fA-F]{6}$/;
/** World bounds for poses (metres). The outpost map is far smaller; this only rejects garbage. */
export const POSE_LIMIT = 2000;

export function cleanName(v) {
  return String(v ?? 'Cadet').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 16) || 'Cadet';
}

export function cleanAvatar(a) {
  const o = a && typeof a === 'object' ? a : {};
  const color = (c, d) => (typeof c === 'string' && HEX.test(c) ? c : d);
  return {
    id: String(o.id ?? 'nova').replace(/[^\w-]/g, '').slice(0, 24) || 'nova',
    name: cleanName(o.name ?? 'Astronaut').slice(0, 24),
    role: String(o.role ?? '').replace(/[<>]/g, '').slice(0, 40),
    bio: '',
    suit: color(o.suit, '#eeeeee'),
    accent: color(o.accent, '#1f5fd1'),
    visor: color(o.visor, '#d9a441'),
    skin: color(o.skin, '#c69c7b')
  };
}

/** Parse a raw frame. Returns the object, or null for anything that isn't a JSON object with a string `t`. */
export function parseFrame(raw) {
  const text = typeof raw === 'string' ? raw : raw?.toString?.('utf8');
  if (typeof text !== 'string' || text.length === 0 || text.length > MAX_PAYLOAD) return null;
  let msg;
  try {
    msg = JSON.parse(text);
  } catch {
    return null;
  }
  return msg && typeof msg === 'object' && !Array.isArray(msg) && typeof msg.t === 'string' ? msg : null;
}

export function validAction(a) {
  if (!a || typeof a !== 'object' || Array.isArray(a)) return false;
  if (SIMPLE_ACTIONS.has(a.type)) return true;
  if (a.type === 'speed') return SPEEDS.has(a.value);
  if (a.type === 'alloc') return ALLOC_KEYS.has(a.key) && typeof a.value === 'number' && Number.isFinite(a.value) && a.value >= 0 && a.value <= 100;
  if (a.type === 'decide') return typeof a.card === 'string' && /^[a-z0-9-]{1,40}$/.test(a.card) && Number.isInteger(a.option) && a.option >= 0 && a.option < 4;
  return false;
}

/** Returns a sanitized pose or null. Coordinates must be finite and inside world bounds. */
export function cleanPose(p) {
  if (!p || typeof p !== 'object') return null;
  const nums = ['x', 'y', 'z', 'h'];
  for (const k of nums) if (typeof p[k] !== 'number' || !Number.isFinite(p[k]) || Math.abs(p[k]) > POSE_LIMIT) return null;
  for (const k of ['m', 'a', 't', 'v']) if (p[k] !== undefined && typeof p[k] !== 'boolean') return null;
  return { x: p.x, y: p.y, z: p.z, h: p.h, m: p.m === true, a: p.a === true, t: p.t === true, v: p.v !== false };
}

/** Minimal structural check of an authoritative snapshot. Size is capped by MAX_PAYLOAD. */
export function validState(state, phase) {
  if (!PHASES.has(phase)) return false;
  if (!state || typeof state !== 'object' || Array.isArray(state)) return false;
  return (
    typeof state.sol === 'number' &&
    Number.isFinite(state.sol) &&
    typeof state.hour === 'number' &&
    state.toggles !== null &&
    typeof state.toggles === 'object' &&
    state.powerAllocations !== null &&
    typeof state.powerAllocations === 'object' &&
    Array.isArray(state.logs)
  );
}

/**
 * Decide what to do with one in-room message.
 * Returns { kind:'drop', reason } or { kind:'broadcast'|'to-host', msg }.
 */
export function route(msg, sender, hostId) {
  const isHost = sender.id === hostId;
  switch (msg.t) {
    case 'pose': {
      const p = cleanPose(msg.p);
      return p ? { kind: 'broadcast', msg: { t: 'pose', id: sender.id, p } } : { kind: 'drop', reason: 'bad-pose' };
    }
    case 'emote':
      return EMOTES.has(msg.e) ? { kind: 'broadcast', msg: { t: 'emote', id: sender.id, e: msg.e } } : { kind: 'drop', reason: 'bad-emote' };
    case 'action':
      if (isHost) return { kind: 'drop', reason: 'host-action' }; // host applies its own actions locally
      if (!validAction(msg.action)) return { kind: 'drop', reason: 'bad-action' };
      if (HOST_ONLY_ACTIONS.has(msg.action.type)) return { kind: 'drop', reason: 'not-commander' };
      return { kind: 'to-host', msg: { t: 'action', id: sender.id, name: sender.name, action: msg.action } };
    case 'state':
      if (!isHost) return { kind: 'drop', reason: 'not-commander' };
      if (!validState(msg.state, msg.phase)) return { kind: 'drop', reason: 'bad-state' };
      return { kind: 'broadcast', msg: { t: 'state', state: msg.state, phase: msg.phase } };
    default:
      return { kind: 'drop', reason: 'unknown-type' };
  }
}
