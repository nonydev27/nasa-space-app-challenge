# 🚀 Junior Astronaut Mission Trainer: Outpost Commander
### 2026 NASA Space Apps Challenge — Project Architecture & Implementation Plan

> **Challenge:** [Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/)  
> **Event:** 2026 NASA Space Apps Challenge  
> **Difficulty:** Beginner / Youth & Intermediate (Target: Ages 7–12, extensible to 13+)  
> **Subjects:** Games, Planets & Moons, Software, Space Exploration, Sun  
> **Connect:** [Space Apps Connect](https://github.com/nasa/spaceapps) | [About Us](https://www.spaceappschallenge.org/about/) | [Awards](https://www.spaceappschallenge.org/awards/) | [2026 Challenges](https://www.spaceappschallenge.org/2026/challenges/)

---

## 1. Challenge Overview & Problem Statement

Space-themed STEM content often oversimplifies the engineering trade-offs that define a real mission or presents them at a level too complex to hold a young learner's attention. Few tools make those trade-offs both tangible and fun.

**The Challenge:** Design and build an interactive game/app that lets students run a lunar or Martian outpost, balancing competing demands like life support, radiation shielding, power, and food production, so they experience firsthand the decisions that determine whether a mission fails or succeeds.

### Official Challenge Background
As NASA works to establish a sustained human presence on the Moon through the **Artemis campaign** and extend human exploration toward **Mars**, one of the most persistent challenges isn't just engineering hardware — it's building public understanding of what survival actually requires in these extreme environments.

Astronauts on a lunar or Martian outpost must balance competing demands:
- **Limited Power** split between life support, communications, and science;
- **Radiation Exposure** weighed against mission objectives and extravehicular activity (EVA);
- **Resource Costs** that compound over time (every watt used for research is a watt not charging emergency life support batteries);
- **Data-Driven Reality**: NASA's own mission planners navigate these daily using real datasets:
  - **DONKI** (Space Weather Database Of Notifications, Knowledge, and Information) for solar flares, coronal mass ejections (CMEs), and radiation risk.
  - **OSDR** (Open Science Data Repository) for astronaut radiation dosimetry and biological research.
  - **Surface Mission Data** from Artemis (lunar south pole ice deposits and peaks of eternal light) and Mars rovers (Jezero Crater dust storms, atmospheric optical depth $\tau$, and temperature extremes).

### Educational Objective
Teach kids ages 7–12 real engineering trade-offs through play:
> *"No choice is free — every decision teaches something true about what astronauts and mission planners actually navigate."*

---

## 2. Core Trade-Off Mechanics & Simulation Engine

The simulation engine models 5 interconnected survival subsystems:

```
                      ┌──────────────────────┐
                      │    POWER MATRIX      │
                      │ Solar / RTG / Battery│
                      └──────────┬───────────┘
                                 │
         ┌───────────────────────┼──────────────────────┐
         ▼                       ▼                      ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   LIFE SUPPORT   │   │RADIATION SHIELDS │   │   HYDROPONICS    │
│  (O2 / H2O / CO2)│   │(Regolith / Active│   │(Food / Calories) │
│   ECLSS Loop     │   │  Magnetic Field) │   │ Water / Light    │
└────────┬─────────┘   └─────────┬────────┘   └─────────┬────────┘
         │                       │                      │
         └───────────────────────┼──────────────────────┘
                                 ▼
                      ┌──────────────────────┐
                      │   CREW SURVIVAL &    │
                      │  MISSION OBJECTIVES  │
                      │  Health / Research   │
                      └──────────────────────┘
```

### The 5 System Trade-Off Rules:
1. **Power vs. Survival:**
   - Diverting power to science scanners accelerates mission discoveries, but depletes life support heaters during the 14-day lunar night or Martian dust storms.
2. **Radiation Shielding vs. Power:**
   - Active electromagnetic shielding or emergency shelter reinforcement consumes up to 45% of station power. Leaving it off saves power for rovers, but exposes the crew to Solar Energetic Particles (SEP) documented by NASA DONKI.
3. **Hydroponics vs. Water Reserves:**
   - Crops generate fresh food and reduce stress (OSDR plant biology findings), but demand continuous water and LED lighting. If water drops below 20%, you must decide: ration crew water or let crops wither.
4. **Communication Lag & Remote Control:**
   - Lunar outpost: ~1.3 second round-trip ping.
   - Mars outpost: 4 to 24 minute latency. Automated priority protocols must be set *before* solar storms hit because real-time Earth intervention is physically impossible.
5. **EVA Exploration vs. Risk:**
   - Sending astronauts outside in rovers yields scientific samples, but drains suit oxygen and exposes them to micrometeoroid and space weather hazards.

---

## 3. Human-Computer Interaction (HCI) Design for Ages 7–12

To make complex aerospace engineering intuitive and delightful for young learners, the user interface follows tested HCI principles for children:

### A. Cognitive Load Management (Chunking & Visual Anchors)
- **Top Bar Telemetry**: 4 core vitals with distinct child-friendly iconography, color-coded health bands, and plain-language states:
  - ⚡ **Power (kW)**: Green (>50%), Amber (20-50%), Blinking Red (<20%)
  - 🫁 **Oxygen / Life Support (%)**: Pure air indicator with simple trend arrows (▲ rising, ▼ draining)
  - 🛡️ **Radiation Shielding (mSv / Alert)**: Shield integrity dial and solar storm warning indicator
  - 🥗 **Food & Water Stockpile (Sols remaining)**: Visual countdown icons
- **Progressive Disclosure**:
  - **Cadet Mode (Ages 7–9)**: Guided by "AstroBot" (AI rover mascot), simplified sliders, audio cues, automatic fail-safe warnings, and clear binary trade-offs.
  - **Flight Director Mode (Ages 10–12+)**: Full power routing matrix, raw NASA DONKI/OSDR data graphs, manual sub-system power routing, and communication latency simulation.

### B. Direct Manipulation & Tactile Affordances
- **Power Allocation Matrix**: Interactive drag/button sliders that physically reallocate kilowatts between modules (Life Support, Shielding, Greenhouse, Comms, Science Lab).
- **Interactive Cutaway Outpost View**: A 2D sci-fi cross-section visualization of the habitat:
  - Solar panels rotate or fold during storms.
  - Habitat domes pulse with atmospheric glow.
  - Storm shelters seal shut when radiation shields are raised.
  - Crew avatars smile, work, or run to shelter based on base status.
- **Immediate "What-If" Predictive Feedback**:
  - Adjusting a slider immediately highlights downstream effects (e.g., boosting shields pulses power red and flashes: *"Warning: Battery depleting in 4 hours"*).

### C. Sensory Feedback & Web Audio API
- Integrated 8-bit / sci-fi sound synthesizer built with browser native Web Audio API (no external asset downloads):
  - Gentle retro clicks for buttons
  - Subtle rhythmic life-support hum
  - Dramatic klaxon beep for DONKI space weather alerts
  - Triumphant fanfares for mission milestones and badge unlocks
  - Full mute / volume toggle for classroom friendliness.

### D. In-Context NASA Science Glossary Tooltips
- Difficult scientific terms are highlighted with friendly dotted underlines. Hovering or tapping reveals plain-English definitions with NASA context:
  - *Sol*: A Martian day (24 hours, 39 minutes).
  - *DONKI*: NASA's Space Weather Database tracking solar storms.
  - *OSDR*: NASA's Open Science Data Repository studying astronaut genes and radiation.
  - *Regolith*: Moon or Mars "dirt" used to bury habitats for radiation shielding.
  - *ECLSS*: Environmental Control and Life Support System (the machine keeping air and water clean).

---

## 4. Grounding in Real NASA Open Data

| Dataset | Real NASA Source | In-Game Mission Integration |
|---|---|---|
| **DONKI** | Space Weather Database Of Notifications, Knowledge, and Information (`api.nasa.gov` / DONKI archive) | Real Solar Flare classes (C-class, M-class, X-class) and Coronal Mass Ejections (CME) with real plasma velocities ($450$ to $2,100\text{ km/s}$) trigger timed emergency shelter drills. |
| **OSDR** | Open Science Data Repository (GeneLab & ALSDA datasets) | Real biological findings: DNA repair markers, bone mineral density loss ($1\text{-}1.5\%$ per month without countermeasures), and space crop tests (Veggie & APH microgreens). |
| **Artemis Moon Data** | Artemis III Polar Exploration & Lunar Reconnaissance Orbiter (LRO) | Lunar South Pole setting (Shackleton Crater rim): permanent sunlight peaks for solar arrays, permanent shadows for water ice mining, and 14-day night survival. |
| **Mars Exploration** | Mars 2020 Perseverance & InSight Weather Station | Atmospheric pressure ($0.6\%\text{ of Earth}$), optical dust storm depth ($\tau = 0.5$ to $4.0$), and communication delay ($4\text{ to }24\text{ minutes}$). |

---

## 5. Gamification Architecture: Missions, Badges & Replayability

### 5 Playable Mission Campaigns + Infinite Sandbox
1. **Mission 1: Lunar Dawn (Artemis Base Camp)**
   - *Objective:* Establish power grid and survive the first lunar sunrise cycle at Shackleton Crater.
   - *Key Lesson:* Balancing battery storage with solar panel orientation.
2. **Mission 2: The Red Planet Dust Storm (Jezero Outpost)**
   - *Objective:* A catastrophic Martian dust storm reduces solar output by 85%. Manage RTG baseload and battery rationing.
   - *Key Lesson:* Emergency priority triage — which non-essential systems get shut down first?
3. **Mission 3: Solar Storm Alarm (DONKI X-Ray Flare Alert)**
   - *Objective:* NASA's DONKI satellite detects an X9.3 solar flare heading toward the outpost. Evacuate astronauts to the regolith bunker within 3 minutes.
   - *Key Lesson:* Speed of light communication vs solar particle transit time; real radiation shielding physics.
4. **Mission 4: The Greenhouse Crisis (OSDR Botany Mission)**
   - *Objective:* Outpost food reserves are contaminated; cultivate high-yield microgreens in martian regolith while conserving recycled water.
   - *Key Lesson:* Circular life support (ECLSS) and biological resource trade-offs.
5. **Mission 5: Deep Space Latency Crisis**
   - *Objective:* Major life-support glitch during maximum Earth-Mars alignment distance (20-minute signal delay). Automate emergency protocols without waiting for Earth Houston command!
   - *Key Lesson:* Deep space autonomy and communication constraints.
6. **Freeform Sandbox Mode**
   - Choose Moon or Mars, adjust environment hazards, and test custom outpost configurations.

### Astronaut Badges & Wing Levels
- 🎖️ **Solar Storm Survivor** — Successfully shielded the outpost from a DONKI X-Class Flare with 0 radiation casualties.
- 🎖️ **Master of the Grid** — Maintained positive battery reserves across a full Sol cycle.
- 🎖️ **Green Thumb of Mars** — Produced 100% self-sustaining calories in the Hydroponic Bay.
- 🎖️ **Artemis Flight Director** — Completed all 5 mission campaigns.
- 🎖️ **NASA Data Scout** — Inspected all NASA DONKI and OSDR telemetry research logs.

---

## 6. Technical Stack & Component Architecture

- **Framework:** React 19 + Vite (Fast HMR, lightweight, browser-based, zero install required for users).
- **Styling & Theme:** Pure CSS Modules & CSS Variables with high-tech NASA glassmorphism, responsive across desktop, tablets, and Chromebooks.
- **Audio:** Native Web Audio API procedural sound engine (no external audio files needed).
- **Visuals:** SVG vector graphics, animated canvas particles (stars, solar winds, dust storms), and isometric habitat cutaways.
- **Self-Contained Architecture:**
  - `src/components/OutpostVisualizer.jsx`: Animated graphical cutaway of the base showing real-time modules.
  - `src/components/PowerMatrix.jsx`: Interactive power routing and subsystem allocation deck.
  - `src/components/SpaceWeatherDeck.jsx`: DONKI live/archive space weather telemetry and solar flare warning radar.
  - `src/components/BiosphereECLSS.jsx`: Life support, oxygen scrubber, water recycler, and hydroponics bay.
  - `src/components/MissionBriefing.jsx`: Story narrative, difficulty toggle (Cadet vs Director), and mission picker.
  - `src/components/MissionDebrief.jsx`: Post-mission score, engineering analysis, badge unlocks, and NASA data citations.
  - `src/components/NASADataModal.jsx`: Educational deep-dive into real DONKI and OSDR datasets.
  - `src/utils/soundEffects.js`: Web Audio API sound synthesis.
  - `src/utils/nasaData.js`: Curated real NASA space weather & biological research datasets.
  - `src/utils/simulationEngine.js`: Mathematical state updates, trade-off differential equations, and event handlers.
