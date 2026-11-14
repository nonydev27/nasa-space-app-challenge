# AstroLab: Junior Astronaut Mission Trainer

**2026 NASA Space Apps Challenge · Build a Junior Astronaut Mission Trainer**

A browser game for ages 7–12. Players run a base on the Moon or Mars and juggle three core resources (**power, air, radiation**, plus food) through five missions. **No choice is free:** every decision card shows its gains and costs, and every lesson cites real NASA data. No download and no account; players pick a made-up callsign and progress stays on the device.

## How it meets the challenge

| Challenge asks for | AstroLab |
|---|---|
| Real trade-offs, no free "safe" choice | Decision cards. A test (`validateDeck`) fails the build if any option lacks a gain *and* a cost. Bunker = safe from radiation but no science. Rover = science but power and radiation. Lab power = science but battery. |
| 2–3 core resources for young players | Cadet mode shows Power, Air, Radiation and Food in plain words. Flight Director mode adds crew health, science and raw numbers. |
| Link shielding decisions to real space weather | Live NASA DONKI flares, CMEs, storms and SEPs from the last 30 days set storm risk, and each storm alert names the real event it is modelled on. |
| Communication delay | "Call Mission Control": the Moon reply arrives after the real 2.6 s round trip, Mars after about 24 min (compressed to 24 s), and in Mission 5 (solar conjunction) there is no signal. |
| Replayability | Cards and storms are planned per run from a random seed plus the live storm risk. |
| See consequences | The debrief chart shows battery, air and health over the mission, each decision with its lesson, and the crew's radiation dose compared to Earth. |
| Attribute data in-tool; never show static data as live | The **NASA Data Explorer** labels everything LIVE / ARCHIVE / PUBLISHED / GAME MODEL. See [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md). |
| Plain language | Glossary buttons on every meter; kid-level copy. |

## Run it

```bash
npm install
cp .env.example .env      # add a free key from https://api.nasa.gov (DEMO_KEY is rate-limited)
npm run dev               # game + NASA proxy + crew relay on http://localhost:5173
npm run dev:lan           # same, reachable from classroom devices on your Wi-Fi
```

| Command | What it does |
|---|---|
| `npm test` | 106 tests: simulation balance (an attentive bot wins every mission; a hands-off bot fails), decision deck, DONKI mapping and fallbacks, NASA proxy, profile store, relay protocol and integration |
| `npm run check` | typecheck + lint + tests + build (release checklist) |
| `npm run build && npm start` | production: `dist/`, `/api/*` NASA proxy, `/crew` WebSocket relay and `/healthz` on one port (`PORT`, default 8080) |
| `npm run smoke` | starts the production server and checks the page, health, proxy, a two-player room and graceful shutdown |

### Static hosting vs. Node hosting

- **Node host (recommended)** (Render, Fly, Railway, a VM): everything works, and the NASA key stays on the server (`NASA_API_KEY`).
- **Static host** (GitHub Pages, Netlify static): the game works, live DONKI falls back to CCMC directly or to the **labelled archive**, OSDR search uses the saved studies, and there is no co-op unless `VITE_CREW_URL=wss://host/crew` points to a relay running elsewhere.

### Deploying the crew relay

- WebSockets upgrade on `/crew`. Behind nginx: `proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; proxy_read_timeout 120s;`
- Use HTTPS, so the browser uses `wss://` automatically. The relay pings every 25 s, so proxies with ≥60 s idle timeouts are fine.
- Limits: `CREW_MAX_ROOMS` (200), `CREW_MAX_CONNECTIONS` (800), `CREW_IDLE_ROOM_MIN` (120). `GET /healthz` reports rooms, peers and rejected/dropped counts.

## Multiplayer design (co-op, up to 4)

The commander's browser runs the simulation; the relay only forwards validated messages (`server/protocol.js`).

- **Host-only actions:** guests can't pause, warp time or publish state. This is enforced in the relay *and* in the client. The relay stamps sender IDs, so peers can't impersonate each other.
- **Guest button presses** aren't applied locally (except power sliders), so a control never looks confirmed when the commander rejected it.
- **Commander leaves:** the longest-connected guest is promoted and the mission continues from their last snapshot.
- **Network drop:** the client retries the same crew code 3 times (1 s / 2.5 s / 5 s). If the room is gone (relay restart), it continues solo and tells the player.
- **Child safety:** emotes only, with no free-text or voice chat; names are sanitized.

## Project layout

```
server/            index.js (prod server) · relay.js + protocol.js (co-op) · nasaProxy.js (DONKI/OSDR)
scripts/smoke.mjs  production smoke test
src/data/          nasaFacts.ts (every real number + source) · donki.ts (mapping) · liveData.ts (fetch + fallbacks)
src/utils/         simulationEngine.ts (game model) · nasaData.ts (missions, glossary, badges)
src/game/          decisions.ts (trade-off cards) · actions.ts · storylines.ts · profileStore.ts
src/hud/ src/components/ src/screens/ src/scene/   UI and three.js outpost
```

## License

MIT. NASA images are public domain and credited in-game. NASA does not endorse this project.
