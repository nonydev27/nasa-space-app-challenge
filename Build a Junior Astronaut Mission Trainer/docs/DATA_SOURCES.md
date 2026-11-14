# Data sources: what is real, what is live, what is a game model

Everything below is also shown in-game under **NASA Data Explorer → Real vs. game**. All numbers live in `src/data/nasaFacts.ts`. The URLs were checked when this was written (2026-11-14).

## Status of each challenge resource

| Resource | Used? | How | Status at build time |
|---|---|---|---|
| **NASA DONKI** (via api.nasa.gov) | ✅ Live | Server proxy `/api/donki/{FLR,CME,GST,SEP}` → api.nasa.gov, then CCMC. Last 30 days → storm risk (high: X flare / SEP / Kp≥7; moderate: M flare / Kp≥5; else low) and the event each storm alert is modelled on. | api.nasa.gov DONKI returned **404** and then **429** with DEMO_KEY during testing; CCMC was unreachable from the build machine. **Set `NASA_API_KEY`** and check from your network. If both fail, the game says ARCHIVE and uses 6 real past events. |
| **DONKI archive (curated)** | ✅ | X9.0 (2024-10-03), X8.7 (2024-05-14), G5 storm (2024-05-10), Mars SEP (2024-05-20, 8,100 µGy at Curiosity per NASA), X9.3 (2017-09-06), X8.2+SEP (2017-09-10). Each links its DONKI record URL. | Always labelled ARCHIVE |
| **NASA OSDR** | ✅ Live search + 5 verified studies | OSD-476 (plants in Apollo soil), OSD-268 (Veggie lettuce), OSD-342 (mouse muscle/bone loss), OSD-714 (lunar gravity & muscle), OSD-569 (Inspiration4 blood). Checked with the OSDR search API. | OSDR CORS only allows osdr.nasa.gov, so live search **needs the Node proxy**; on a static host it searches the saved studies (labelled). |
| **RadLab** | ⚠️ Linked only | — | `visualization.osdr.nasa.gov/radlab` returned **HTTP 500**. Dose rates come from peer-reviewed measurements instead (below). |
| **Mars Trek / Moon Trek** | ✅ Static | Jezero 18.4°N 77.4°E; Shackleton 89.6°S 132.3°E (Trek nomenclature) | Linked |
| **NASA Image Library** | ✅ | PIA26252 (Jezero), PIA13523 (lunar south pole), hot-linked with credit | Live images |
| **CSA resources** | 🔗 Linked | Teacher follow-up | The CSA site was unreachable from the build machine |
| Mars Rover Photos API | ❌ | — | Retired (404) |

## Published numbers used by the simulation

| Value | Source |
|---|---|
| Moon surface 1.37 mSv/day | Zhang et al. 2020, *Science Advances* (Chang'e-4 LND) |
| Mars surface 0.64 mSv/day | Hassler et al. 2014, *Science* (Curiosity RAD) |
| Earth→Mars cruise 1.84 mSv/day | Zeitlin et al. 2013, *Science* |
| Earth background ≈2.4 mSv/yr | UNSCEAR |
| 600 mSv career limit | NASA (National Academies 2021 review) |
| 0.84 kg O₂ per person per day | NASA BVAD (NTRS 20210024855) |
| ≈98% ISS water recovery | NASA 2023 |
| 40 kW Fission Surface Power target (= Moon baseload in game) | NASA STMD |

## Game model (simplified on purpose)

Solar/battery kW sizes, life-support drain rates, shield factors (habitat 0.5, bunker 0.1, deflector 0.3), storm multipliers and duration (10 game h), science points, and time compression (1 sol ≈ 2.4 min at 1×). These are tuned so that an attentive player can win every mission and a hands-off player fails (tested in `simulationEngine.test.ts`).

## Corrections made to earlier versions

Earlier builds showed some invented values as real NASA data. They were removed:

- **"OSD-379 = plants in Apollo soil"**: OSD-379 is actually a mouse-liver study. The correct study is OSD-476.
- **OSD-137 and OSD-204**: these did not match their claims.
- **"64% stress reduction"** and **"misting cuts transpiration 64%"**: invented, removed.
- **DONKI catalog IDs and the "X9.3 / 2,150 km/s / AR3664 2024" event**: these mixed details from different real events. Replaced with verified events.
- **RadLab instrument dose figures**: unverifiable, removed.
- **"1.3 s round trip"**: 1.3 s is the one-way delay; the round trip is 2.6 s.
