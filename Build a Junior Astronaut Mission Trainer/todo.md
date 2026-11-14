# AstroLab TODO

Status as of 2026-11-14. ✅ = done and covered by a test or script; 🧑 = needs a human with real devices or a hosting account.

## Priority 1 — Multiplayer backend reliability
- [x] Relay tests: host/join, invalid/missing codes, full rooms, unsupported missions, join/leave, host promotion, last-peer cleanup (`server/relay.test.js`)
- [x] Every WebSocket message validated at the relay boundary (`server/protocol.js` + `protocol.test.js`)
- [x] Host-only rules enforced in the relay and in the client; guests can't pause/warp, publish state or impersonate (relay stamps IDs)
- [x] Malformed JSON, unknown types, oversized frames (1009), rate limits and floods (1008); no stale peers or rooms left behind
- [x] Disconnects: guest loss, host loss (promoted host continues from its last snapshot), relay restart (rooms close → clients retry 3× then continue solo), reconnect to the same code
- [x] Configurable limits (`CREW_MAX_ROOMS`, `CREW_MAX_CONNECTIONS`, `CREW_IDLE_ROOM_MIN`), idle-room expiry, logs (`CREW_LOG`), `/healthz`
- [x] Deployment path documented (README: WSS, nginx upgrade headers, proxy timeouts, `VITE_CREW_URL`); upgrade path covered by `npm run smoke`
- [ ] 🧑 Test behind your real host's HTTPS proxy once deployed

## Priority 2 — Multiplayer play experience
- [ ] 🧑 Four players on separate devices/networks (touch, avatars, emotes, simultaneous actions). 4-socket rooms are covered by automated tests only.
- [x] Crew panel shows who is commander and whether you are online, reconnecting, or flying solo
- [x] Guest actions are no longer applied optimistically (except power sliders); the commander's snapshot is the truth
- [x] Pose updates bounded: 10/s client, 40/s relay token bucket, coordinates validated

## Priority 3 — Data, science, gameplay
- [x] DONKI mapping tests: partial or missing CME data, HTTP errors, empty bodies, timeout path (`src/data/donki.test.ts`)
- [x] Decided: failed DONKI → curated **archive** events, always labelled ARCHIVE in the UI
- [x] Science values and copy audited against sources; fabricated values removed (see `docs/DATA_SOURCES.md`)
- [x] Unlocks, score, badges, retry and persistence across reload tested (`src/game/profileStore.test.ts`)
- [x] Cadet (4 plain meters, 5 Mission Control calls) vs. Director (6 meters, raw units, 3 calls); keyboard and touch both cover core actions (decision cards: tap or 1/2)

## Priority 4 — Quality and release
- [x] Vitest (`npm test`, 106 tests)
- [x] `npm run check` = typecheck + lint + test + build
- [x] `npm run smoke`: build → start → page/health/proxy → crew room → graceful shutdown
- [x] README covers setup, env vars, and static vs. Node hosting

## Deliberate non-goals
- [x] No remote accounts or database: localStorage only, callsign only (the real-name field was removed)
- [x] No free-text or voice chat (emotes only)
