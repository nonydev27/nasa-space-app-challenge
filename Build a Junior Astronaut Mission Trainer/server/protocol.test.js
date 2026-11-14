import { describe, expect, it } from 'vitest';
import { cleanPose, parseFrame, route, validAction, validState } from './protocol.js';

const host = { id: 'c1', name: 'H' };
const guest = { id: 'c2', name: 'G' };
const STATE = { sol: 2, hour: 10, toggles: {}, powerAllocations: {}, logs: [] };

describe('parseFrame', () => {
  it('accepts JSON objects with a string type', () => expect(parseFrame('{"t":"pose"}')).toEqual({ t: 'pose' }));
  it.each(['', 'nope', '[]', '42', 'null', '{"t":1}', '{}'])('rejects %j', (raw) => expect(parseFrame(raw)).toBeNull());
});

describe('validAction', () => {
  it.each([{ type: 'bunker' }, { type: 'speed', value: 2 }, { type: 'alloc', key: 'eclss', value: 30 }, { type: 'decide', card: 'ridge-sample', option: 1 }])('accepts %j', (a) =>
    expect(validAction(a)).toBe(true)
  );
  it.each([
    null,
    [],
    { type: 'launch-nukes' },
    { type: 'speed', value: 20 },
    { type: 'alloc', key: 'toString', value: 1 },
    { type: 'alloc', key: 'eclss', value: -1 },
    { type: 'alloc', key: 'eclss', value: NaN },
    { type: 'decide', card: 'X Y', option: 0 },
    { type: 'decide', card: 'ridge-sample', option: 1.5 }
  ])('rejects %j', (a) => expect(validAction(a)).toBe(false));
});

describe('cleanPose', () => {
  it('keeps valid poses and normalises flags', () => expect(cleanPose({ x: 1, y: 2, z: 3, h: 0.5, m: true })).toEqual({ x: 1, y: 2, z: 3, h: 0.5, m: true, a: false, t: false, v: true }));
  it.each([{ x: 1, y: 2, z: 3 }, { x: Infinity, y: 0, z: 0, h: 0 }, { x: 5000, y: 0, z: 0, h: 0 }, { x: 0, y: 0, z: 0, h: 0, m: 'yes' }])('rejects %j', (p) =>
    expect(cleanPose(p)).toBeNull()
  );
});

describe('validState', () => {
  it('requires a known phase and core fields', () => {
    expect(validState(STATE, 'play')).toBe(true);
    expect(validState(STATE, 'boss-fight')).toBe(false);
    expect(validState({ ...STATE, logs: 'x' }, 'play')).toBe(false);
    expect(validState([], 'play')).toBe(false);
  });
});

describe('route', () => {
  it('guests may send actions to the host, except host-only ones', () => {
    expect(route({ t: 'action', action: { type: 'eva' } }, guest, host.id)).toMatchObject({ kind: 'to-host' });
    expect(route({ t: 'action', action: { type: 'pause' } }, guest, host.id)).toEqual({ kind: 'drop', reason: 'not-commander' });
    expect(route({ t: 'action', action: { type: 'eva' } }, host, host.id)).toEqual({ kind: 'drop', reason: 'host-action' });
  });
  it('only the host may publish state', () => {
    expect(route({ t: 'state', state: STATE, phase: 'play' }, host, host.id).kind).toBe('broadcast');
    expect(route({ t: 'state', state: STATE, phase: 'play' }, guest, host.id)).toEqual({ kind: 'drop', reason: 'not-commander' });
  });
  it('stamps the sender id on poses and emotes', () => {
    expect(route({ t: 'pose', id: 'c1', p: { x: 0, y: 0, z: 0, h: 0 } }, guest, host.id).msg.id).toBe('c2');
    expect(route({ t: 'emote', id: 'c1', e: '👋' }, guest, host.id).msg.id).toBe('c2');
  });
  it('drops unknown message types', () => expect(route({ t: 'chat', text: 'hi' }, guest, host.id)).toEqual({ kind: 'drop', reason: 'unknown-type' }));
});
