// Production smoke test: build must exist (npm run build). Starts server/index.js,
// checks the page, health check, NASA proxy validation, a two-player crew room,
// then sends SIGTERM and expects a clean shutdown that closes the crew sockets.
//
//   npm run build && npm run smoke

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const root = fileURLToPath(new URL('..', import.meta.url));
if (!existsSync(`${root}dist/index.html`)) {
  console.error('✗ dist/ missing. Run `npm run build` first.');
  process.exit(1);
}

const PORT = 18000 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${PORT}`;
const server = spawn(process.execPath, ['server/index.js'], { cwd: root, env: { ...process.env, PORT: String(PORT), CREW_LOG: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
let output = '';
server.stdout.on('data', (d) => (output += d));
server.stderr.on('data', (d) => (output += d));

const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` (${detail})` : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${base}/healthz`)).ok) return true;
    } catch {
      /* not up yet */
    }
    await sleep(100);
  }
  return false;
}

function open(hello) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}/crew`);
    const inbox = [];
    ws.on('message', (d) => inbox.push(JSON.parse(String(d))));
    ws.on('open', () => ws.send(JSON.stringify(hello)));
    ws.on('error', reject);
    const t = setInterval(() => {
      const room = inbox.find((m) => m.t === 'room' || m.t === 'error');
      if (room) {
        clearInterval(t);
        resolve({ ws, inbox, room });
      }
    }, 20);
  });
}

try {
  check('server starts', await waitForServer(), output.trim());
  const page = await fetch(`${base}/`);
  check('serves the game', page.ok && (await page.text()).includes('<div id="root">'));
  const deep = await fetch(`${base}/some/spa/route`);
  check('SPA fallback', deep.ok);
  const health = await (await fetch(`${base}/healthz`)).json();
  check('health check', health.ok === true && health.crew?.rooms === 0, JSON.stringify(health.crew));
  check('NASA proxy validates input', (await fetch(`${base}/api/donki/XYZ?startDate=x&endDate=y`)).status === 400);
  check('path traversal blocked', (await fetch(`${base}/..%2f..%2fpackage.json`)).status !== 200 || !(await (await fetch(`${base}/..%2f..%2fpackage.json`)).text()).includes('"dependencies"'));

  const host = await open({ t: 'host', missionId: 'mission-1', location: 'moon', name: 'Smoke', avatar: {} });
  check('crew: host a room', host.room.t === 'room', host.room.code);
  const guest = await open({ t: 'join', code: host.room.code, name: 'Guest', avatar: {} });
  check('crew: guest joins', guest.room.t === 'room');
  host.ws.send(JSON.stringify({ t: 'state', state: { sol: 1, hour: 8, toggles: {}, powerAllocations: {}, logs: [] }, phase: 'play' }));
  await sleep(200);
  check('crew: state reaches guest', guest.inbox.some((m) => m.t === 'state'));
  const h2 = await (await fetch(`${base}/healthz`)).json();
  check('health shows the room', h2.crew.rooms === 1 && h2.crew.peers === 2);

  const closed = Promise.all([host, guest].map(({ ws }) => new Promise((r) => ws.on('close', (code) => r(code)))));
  const exited = new Promise((r) => server.on('exit', (code) => r(code)));
  server.kill('SIGTERM');
  const codes = await Promise.race([closed, sleep(4000).then(() => null)]);
  check('shutdown closes crew sockets', Array.isArray(codes) && codes.every((c) => c === 1001), String(codes));
  const exitCode = await Promise.race([exited, sleep(6000).then(() => 'timeout')]);
  check('graceful exit', exitCode === 0, String(exitCode));
} catch (e) {
  check('smoke test crashed', false, e instanceof Error ? e.message : String(e));
} finally {
  if (server.exitCode === null) server.kill('SIGKILL');
}

const failed = results.filter((r) => !r).length;
console.log(failed ? `\n${failed} check(s) failed` : '\nAll smoke checks passed');
process.exit(failed ? 1 : 0);
