# AstroLab Tutor: Project and System Guide

## What this project is

AstroLab (also called Outpost Commander in parts of the interface) is a browser-based, 3D astronaut mission trainer for the NASA Space Apps Challenge: **Build a Junior Astronaut Mission Trainer**. It is designed primarily for learners ages 7–12. Players manage a lunar or Martian outpost and see how real mission constraints compete: power, air and water, food, radiation protection, communications, and crew safety.

The central teaching idea is that there is no cost-free decision. Power sent to science or the greenhouse is not available to life support; going outside can earn science but adds risk; and Mars communication delays mean the crew cannot wait for Earth to make every decision. The game makes those trade-offs visible through a 3D habitat, system controls, telemetry, story scenes, and a mission score/debrief.

## Player experience

1. **Start and enlist.** A learner creates a local pilot profile and chooses a callsign and age-appropriate mode.
2. **Choose an astronaut.** The selected avatar appears in the 3D outpost.
3. **Choose a campaign mission.** Five missions unlock in order; the sandbox is available after the campaign.
4. **Brief and play.** A story briefing sets the scene. During play, the learner manages power allocations and outpost systems while the simulation advances.
5. **Review and progress.** The debrief reports the outcome, score, badges, and next unlocked mission. Progress is saved on that browser.
6. **Optional crew play.** One player hosts a mission and shares a short crew code. Up to three others can join, making a four-person crew.

## The simulation model

`src/utils/simulationEngine.ts` owns the evolving outpost simulation. It advances in game time and calculates interacting systems, including:

- **Power:** solar generation varies with daylight and dust; an RTG provides a steady baseline; batteries absorb a surplus or cover a deficit. Players route power among ECLSS, shields, greenhouse, science, and communications/rover systems.
- **Life support:** ECLSS power affects oxygen and CO₂; water use, rationing, and crew morale are tracked.
- **Food:** greenhouse power and water affect crop growth and health; harvests add food supplies.
- **Radiation and hazards:** location and alerts affect radiation exposure; shielding, bunker lockdown, and EVA choices change the risk.
- **Mission outcomes:** each campaign mission has goals, hazards, and story context. A successful mission records a score, completion, and badges.

`src/game/actions.ts` describes player changes as typed actions. `applyAction` applies the same rules whether the action comes from the local UI or a multiplayer crewmate. The React mission screen (`src/screens/MissionRunner.tsx`) coordinates the simulation, story phases, HUD, 3D scene, and debrief.

## NASA data and other APIs

| Source | How the project uses it | Live API? |
|---|---|---|
| NASA DONKI (`api.nasa.gov/DONKI`) | `src/data/liveData.ts` requests recent solar flares (`FLR`), CMEs (`CME`), geomagnetic storms (`GST`), and solar particle events (`SEP`) through the same-origin proxy, then falls back to CCMC DONKI and a labelled archive. Results influence storm risk and appear in the data explorer. | Yes. The proxy uses `NASA_API_KEY` on the server or NASA's `DEMO_KEY`; the browser never receives the key. |
| NASA OSDR / GeneLab | The Science Explorer searches live study records through `/api/osdr`; if the request times out or fails, matching locally saved studies are shown and labelled as saved data. | Yes, for the study search. Mission examples and lesson text remain curated. |
| NASA RadLab | Curated dosimetry reference values inform the simulation's radiation explanation/calibration. | No RadLab API request is currently made by the game. |
| Artemis, LRO, Mars exploration sources | Mission setting and curated science facts support the Moon/Mars scenarios. | No live request is currently made for these data. |

DONKI and OSDR are live integrations. RadLab and site data remain linked or curated rather than fetched by the game. A DONKI failure does not block a mission: the app shows a labelled archive of real events. OSDR search similarly falls back to locally saved studies.

The NASA key belongs on the **server**, not in a `VITE_` client-side variable. The key is optional; the default `DEMO_KEY` has stricter shared limits. For local Vite development, create `.env` in this project directory:

```env
NASA_API_KEY=your_nasa_api_key
```

Restart Vite after changing the environment. For production, configure `NASA_API_KEY` in the Node server's environment. Never commit `.env` or put private server credentials in a `VITE_` variable.

## How multiplayer works (especially the backend)

Multiplayer is a small **WebSocket relay**, not an account service, database, or authoritative game server. Its purpose is to let browsers share a co-op session without introducing persistent player accounts.

### Components

- `src/net/crewLink.ts` is the browser WebSocket client. It opens `/crew` (or `VITE_CREW_URL` if configured), sends room requests, parses messages, and exposes typed helpers for pose, action, state, and emote messages.
- `src/net/useCrew.ts` connects those messages to React. It tracks room membership and host status, validates incoming actions with `isValidAction`, forwards simulation state to guests, and falls back to local authority if the connection closes.
- `server/relay.js` attaches a `ws` WebSocket server at `/crew`. It keeps rooms and peers in process memory, issues five-character room codes, enforces a four-player room limit, and relays messages.
- `server/index.js` serves the production `dist/` files and attaches the same relay to the HTTP server. `vite.config.js` attaches the relay during Vite development and preview.

### Authority and message flow

The **host browser runs the simulation**. The Node process coordinates the room and relays messages, but does not calculate mission outcomes or persist simulation state.

1. A player sends `host` with mission, location, name, and avatar, or `join` with a room code, name, and avatar.
2. The relay creates/joins a room and returns a `room` message with the crew code, room mission, host ID, and other peers.
3. Every browser periodically sends its astronaut `pose`; the relay forwards it to the other peers for rendering.
4. A guest's game-control action is sent to the relay, then forwarded to the host. The host checks it with `isValidAction`, applies it, and broadcasts the resulting simulation `state`. Host-only controls such as pause and time warp are blocked for guests.
5. Emotes are relayed from the sender to the rest of the crew. There is no free-text chat.
6. If the host disconnects, the relay promotes the longest-standing remaining peer. If the relay connection closes, the browser continues in solo/local-authority mode.

The relay already includes useful baseline limits: a maximum payload size, a per-peer token bucket, heartbeats, room capacity, a restricted emote set, and checks for supported mission IDs and avatar colors. Treat these as guardrails, not a complete production security review. In particular, the relay currently forwards host state payloads rather than independently validating simulation-state structure; host/client browser code remains part of the trust boundary.

### What the backend does not do today

- No user authentication, remote pilot profiles, database, or cross-device progress sync.
- No durable room storage; rooms disappear when their peers leave or the process restarts.
- No server-side simulation or authoritative score verification; the host browser is authoritative.
- No free-text chat, voice chat, invitations by account, or persistent match history.

This keeps the classroom MVP lightweight, but it means production multiplayer should add protocol tests, stricter message/state validation, operational limits, and deployment-specific WebSocket/TLS checks before being treated as a trusted service.

## Local development

Run commands from this project directory:

```bash
npm install
npm run dev
```

`npm run dev` starts Vite and the crew relay together. For other devices on the same Wi-Fi, use `npm run dev:lan`. Build and run the production server with:

```bash
npm run build
npm start
```

The production server listens on port `8080` by default; set `PORT` to change it. A static-only host cannot provide the built-in multiplayer relay. For a separately hosted relay, set `VITE_CREW_URL` to its `wss://.../crew` URL when building the client.

## Where to look in the code

| Area | Key files |
|---|---|
| App navigation and mission flow | `src/App.tsx`, `src/screens/MissionRunner.tsx` |
| Simulation and campaign data | `src/utils/simulationEngine.ts`, `src/utils/nasaData.ts`, `src/game/actions.ts`, `src/game/decisions.ts` |
| NASA DONKI/OSDR clients and facts | `src/data/donki.ts`, `src/data/liveData.ts`, `src/data/nasaFacts.ts`, `server/nasaProxy.js` |
| Local pilot/progress storage | `src/game/profileStore.ts` |
| Multiplayer browser client and hooks | `src/net/crewLink.ts`, `src/net/useCrew.ts` |
| Multiplayer server and HTTP serving | `server/relay.js`, `server/index.js`, `vite.config.js` |
| 3D outpost and remote astronauts | `src/scene/`, especially `OutpostScene.ts` and `remoteCrew.ts` |

When extending the game, keep the educational explanation alongside the mechanic, distinguish live data from curated examples, and keep multiplayer actions constrained to explicit message types rather than arbitrary client payloads.
