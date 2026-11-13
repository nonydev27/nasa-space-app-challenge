# 🚀 AstroLab: Junior Astronaut Mission Trainer
### An Open-Source Deep Space Outpost Simulator Powered by Real NASA Science
**2026 NASA Space Apps Challenge** · *Challenge: Build a Junior Astronaut Mission Trainer*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![NASA Space Apps 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026-critical.svg)](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vite.dev/)
[![Open Source](https://img.shields.io/badge/Open%20Source-❤-brightgreen.svg)](#open-source--stem-mission)

> *"No choice is free — every decision teaches something true about what astronauts and mission planners actually navigate."*

---

## 🌌 Overview

**AstroLab** is an open-source, interactive web simulation that lets students (ages 7–12, extensible to all ages) run their own lunar or Martian outpost. Players balance genuine competing mission demands:
- ⚡ **Power Budgeting:** Solar arrays (sunlight/dust dependent), Nuclear RTG baseload, and emergency battery buffers.
- 🫁 **ECLSS Life Support:** Oxygen scrubbers, CO2 toxicity filtering, and circular water recycling loops.
- 🛡️ **Radiation Shielding:** Magnetic forcefield deflectors and subterranean regolith bunkers under active solar storms.
- 🌱 **Hydroponic Food Production:** Microgreen and Martian potato growth cycles informed by NASA space biology research.
- 📡 **Speed-of-Light Comms Latency:** Real-world communication delays between Earth and the Moon (~1.3s) vs. Mars (4 to 24 minutes).

---

## 🔬 Grounded in Real NASA Open Data & Science

AstroLab rejects invented numbers and fantasy physics, pulling directly from NASA's public repositories:

| Dataset / Portal | Real NASA Source | In-Game Simulation Role |
|---|---|---|
| **NASA DONKI** | [api.nasa.gov](https://api.nasa.gov/) & [CCMC DONKI](https://kauai.ccmc.gsfc.nasa.gov/DONKI/) | Live and archived Solar Flares (X/M/C class) and Coronal Mass Ejections (CME speeds 450–2,150 km/s) triggering emergency drills. |
| **NASA OSDR** | [Open Science Data Repository](https://osdr.nasa.gov/) | GeneLab findings: OSD-379 (Arabidopsis plant growth in Apollo lunar soil), OSD-137 (DNA double-strand radiation repair), and OSD-204 (bone loss countermeasures). |
| **NASA RadLab** | [OSDR Radiation Dosimetry](https://osdr.nasa.gov/bio/repo/?q=&id=radlab) | Calibrated radiation dose rates from real International Space Station dosimeter instruments (ALTEA, Liulin-5, Matroshka phantom torso). |
| **NASA Mars Trek** | [mars.nasa.gov/resources/mars-trek/](https://mars.nasa.gov/resources/mars-trek/) | Jezero Crater western delta landing coordinates, elevation (-2,400m), and dust storm optical depth ($\tau$). |
| **Artemis Moon Data** | Lunar Reconnaissance Orbiter (LRO) | Lunar South Pole (Shackleton Crater ice volatiles and peaks of eternal light). |

---

## 🎨 Human-Computer Interaction (HCI) Principles for Youth

1. **Cognitive Load Management:** 4 core vitals with distinct child-friendly iconography, color-coded health bands, and plain-language states.
2. **Dual-Tier Scaffolding:**
   - **Cadet Mode (Ages 7–9):** Guided by *AstroBot* (AI rover mascot), simplified controls, audio cues, and guided emergency choices.
   - **Flight Director Mode (Ages 10–12+):** Manual power matrix allocation, full NASA telemetry, and comms delay simulation.
3. **Direct Manipulation:** Interactive power routing sliders with immediate "What-If" predictive feedback (e.g. *“Lowering ECLSS below 25 kW will starve air scrubbers!”*).
4. **Sensory & Audio Feedback:** Web Audio API procedural sound engine (no external audio files required, instant play, classroom mute switch).
5. **In-Context Glossary:** Interactive tooltips for tricky aerospace terms (*Sol*, *Regolith*, *DONKI*, *OSDR*, *ECLSS*, *mSv*, *RTG*).

---

## 🕹️ Missions & Gamification

- **5 Campaign Missions:**
  1. *Lunar Dawn (Artemis Base Camp):* Surviving the lunar sunrise and thermal night transition.
  2. *Martian Dust Horizon (Jezero Outpost):* Managing an 85% solar drop during a planet-wide dust storm.
  3. *Solar Storm Alarm (DONKI X-Class Alert):* Evacuating the crew 2.5m underground into the regolith bunker within 45 seconds.
  4. *The Greenhouse Crisis (OSDR Botany):* High-yield space crop cultivation under water rationing.
  5. *Deep Space Latency Crisis:* Autonomous emergency protocols during Mars-Earth comms blackout.
- **Freeform Outpost Sandbox:** Choose Moon or Mars, adjust environmental hazards, and test custom outpost configurations.
- **Astronaut Wings & Badges:** Unlock achievements like *Solar Storm Survivor*, *Master of the Grid*, and *Martian Botanist*.

---

## 🚀 Quick Start (Local Development)

AstroLab requires [Node.js](https://nodejs.org/) (v18+) and runs directly in the browser with zero external accounts or downloads:

```bash
# Clone the repository
git clone https://github.com/nasa/spaceapps.git # or your team fork
cd challenge04

# Install dependencies
npm install

# (Optional) Add your personal free NASA API key in .env
echo "VITE_NASA_API_KEY=your_key_here" > .env

# Start the local development server with Hot Module Replacement (HMR)
npm run dev

# Build production bundle
npm run build
```

---

## 📂 Project Architecture

```
challenge04/
├── docs/
│   └── plan.md                  # Comprehensive challenge plan & trade-off specification
├── public/                      # Static assets & icons
├── src/
│   ├── components/
│   │   ├── AstroBotGuide.jsx    # HCI AI rover assistant
│   │   ├── GlossaryModal.jsx    # Plain-language space glossary
│   │   ├── IncidentAlertBanner.jsx # DONKI solar storm decision banner
│   │   ├── MissionBriefingModal.jsx # Campaign mission selector
│   │   ├── MissionDebriefModal.jsx  # Scorecard & badge award screen
│   │   ├── NASADataModal.jsx    # DONKI, OSDR, RadLab, and Mars Trek explorer
│   │   ├── Navbar.jsx           # Top telemetry bar & mode toggle
│   │   ├── OutpostVisualizer.jsx# 2D animated cutaway of the outpost
│   │   ├── PowerMatrix.jsx      # Direct-manipulation power routing grid
│   │   ├── SubsystemDecks.jsx   # DONKI radar, ECLSS, OSDR greenhouse, and Comms
│   │   ├── TelemetryLog.jsx     # Live event streaming terminal
│   │   └── VitalGauges.jsx      # Top 4 child-friendly vital cards
│   ├── utils/
│   │   ├── donkiApi.js          # Live NASA DONKI API client + offline fallback
│   │   ├── nasaData.js          # Curated real NASA datasets, glossary & badges
│   │   ├── simulationEngine.js  # Multi-variable differential survival simulation
│   │   └── soundEffects.js      # Browser Web Audio API procedural synthesizer
│   ├── App.jsx                  # Main mission commander application loop
│   ├── App.css                  # NASA command deck glassmorphism design system
│   └── main.jsx
├── package.json
└── vite.config.js
```

---

## 📜 Open-Source & STEM Mission

AstroLab is released under the **MIT Open Source License**. It was developed for the **2026 NASA Space Apps Challenge** to provide free, accessible, and scientifically grounded space education to classrooms, museums, science clubs, and aspiring junior astronauts worldwide.
