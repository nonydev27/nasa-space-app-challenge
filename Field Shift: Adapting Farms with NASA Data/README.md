# 🌾 Field Shift: Adapting Farms with NASA Earth Data
### A Decision-Support Tool for Climate-Resilient Crop Rotations
**2026 NASA Space Apps Challenge** · *Challenge: Adapting Farms with NASA Data*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![NASA Space Apps 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026-critical.svg)](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vite.dev/)
[![Earth Observations](https://img.shields.io/badge/NASA-SMAP%20%7C%20ECOSTRESS%20%7C%20GPM%20%7C%20Landsat-blue.svg)](#integrated-nasa-earth-observations)

> *"A supportive tool that reveals patterns and possibilities, never replacing farmer judgment or local agricultural expertise."*

---

## 🚜 Overview

**Field Shift** is a farmer-centered web decision-support application that combines **NASA Earth observations** with local soil information, crop characteristics, and farmer operational priorities. It helps growers evaluate and transition toward resilient crop rotation strategies that:
1. **Conserve Water & Aquifers:** Reduce consumptive irrigation water in drought-vulnerable basins.
2. **Rebuild Soil Health & Organic Matter:** Armor soil against erosion with continuous living roots and biological nitrogen fixation.
3. **Disrupt Pest & Disease Cycles:** Break monoculture resistance (corn rootworm, soybean cyst nematodes, alfalfa weevils).
4. **Protect Economic Bottom Lines:** Maintain commodity market liquidity while cutting expensive synthetic fertilizer and pumping bills.

---

## 🛰️ Integrated NASA Earth Observations

Field Shift downscales and harmonizes NASA datasets to a coherent **30-meter field analysis grid**:

| NASA Dataset | Primary Measurements | Farm Decision-Support Role |
|---|---|---|
| **SMAP** | Top 5 cm & 0–100 cm root-zone soil moisture anomalies | Detects subsoil water deficits before planting; gauges root water reserves. |
| **ECOSTRESS** | Evapotranspiration (ET), Evaporative Stress Index (ESI), Land Surface Temp (70m) | Pinpoints crop thermal stress hotspots and quantifies water consumption. |
| **GPM IMERG** | High-resolution precipitation rates, dry-spell lengths | Evaluates seasonal rainfall pulses and flags extreme storm erosion risks. |
| **Landsat 8/9 & MODIS** | 30m multispectral NDVI & bare-soil temporal exposure | Maps how many days fields lie naked and unprotected between harvest and canopy. |
| **NASA POWER** | Growing Degree Days (GDD), solar radiation, frost risk | Computes crop maturity timelines and critical spring/fall freeze windows. |
| **GRACE-FO** | Terrestrial Water Storage Anomaly (TWSA) | Provides regional groundwater depletion trends for deep-well irrigation planning. |
| **SRTM** | 30m digital elevation, slope %, Topographic Wetness Index (TWI) | Identifies steep hill zones prone to severe gully erosion without cover crops. |

---

## 🎛️ Interactive Features

1. **Satellite GIS Field View:**
   - Multi-layer toggle: 🛰️ True Color, 🌿 Landsat NDVI, 💧 SMAP Soil Moisture, ☀️ ECOSTRESS ET, ⛰️ SRTM Slope.
   - Interactive parcel polygons (e.g., North Pivot, South Pivot, East Fallow) with live telemetry readouts.
2. **Farmer Priority Weighting:**
   - Sliders to balance *Water Conservation*, *Soil Health & N-Fixation*, *Cash Market Return*, and *Low Equipment Overhead*.
   - Instant presets: *Drought Defense*, *Soil Rebuilding*, *Cash Liquidity*, and *Balanced*.
3. **Climate Stress Tester ("What-If" Scenarios):**
   - Sliders for Temperature Anomaly ($\Delta T = -1^\circ\text{C}$ to $+4^\circ\text{C}$) and Rainfall Shift ($\Delta P = \pm 40\%$).
   - Test against historical benchmarks (e.g., *2022 Western Mega-Drought*, *Flash Drought*, *Wet Spring*).
4. **Side-by-Side Rotation Matrix:**
   - Evaluates at least 3 strategies: **Current Monoculture Baseline**, **Water-Conserving Strategy**, and **Soil-Building Legume Relay Strategy**.
   - Compares: Water Saved (mm), Biological Nitrogen ($\Delta\text{N kg/ha}$), Bare Days Eliminated, and Estimated Net Dollar Return ($\pm \$$/acre).
5. **Transparent Evidence & Agronomist Checklist:**
   - Full breakdown: *Why was this suggested?*, *What NASA evidence supports it?*, *What are the data gaps?*, and *What specific questions should be reviewed with a local agronomist before seeding?*
6. **Farmer Plain-Language Glossary:**
   - Friendly in-situ explanations for *Evapotranspiration (ET)*, *NDVI*, *Soil Moisture Anomaly*, *GDD*, and *TWSA*.

---

## 🚀 Quick Start (Local Run)

```bash
# Navigate to the project directory
cd "Field Shift: Adapting Farms with NASA Data"

# Start the local development server with Vite HMR
npm run dev

# Or compile production bundle
npm run build
```

---

## 📂 Project Structure

```
Field Shift: Adapting Farms with NASA Data/
├── docs/
│   └── plan.md                      # Comprehensive challenge architecture & trade-off specification
├── src/
│   ├── components/
│   │   ├── ClimateStressTester.jsx  # Scenario simulator (ΔT, ΔP)
│   │   ├── FarmerGlossaryModal.jsx  # Plain-English agricultural definitions
│   │   ├── FarmerPrioritySliders.jsx# Custom weighting controls
│   │   ├── FieldMapVisualizer.jsx   # Interactive GIS satellite layer map
│   │   ├── Header.jsx               # Navigation & farm region selector
│   │   ├── RotationComparisonMatrix.jsx # 3-way comparative rotation cards
│   │   ├── SensorsInfoModal.jsx     # Deep dive into all 7 NASA sensors
│   │   └── StrategyEvidenceModal.jsx# Evidence cards & agronomist checklist
│   ├── utils/
│   │   ├── nasaEarthData.js         # Verified regional profiles & satellite datasets
│   │   └── rotationScoringEngine.js # Multi-criteria decision analysis (MCDA) algorithms
│   ├── App.jsx                      # Main dashboard orchestrator
│   ├── App.css                      # Agricultural remote sensing design system
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

## 📜 License & Citations

Field Shift is open-source under the **MIT License**. Created for the **2026 NASA Space Apps Challenge** to empower farmers worldwide with transparent, satellite-driven decision support.
