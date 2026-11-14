# 🌾 Field Shift: Adapting Farms with NASA Data
### 2026 NASA Space Apps Challenge — Project Architecture & Implementation Plan

> **Challenge:** [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/)  
> **Event:** 2026 NASA Space Apps Challenge  
> **Difficulty:** Advanced / Intermediate  
> **Subjects:** Earth Science, Software, Arts & Multimedia  
> **Connect:** [Space Apps Connect](https://github.com/nasa/spaceapps) | [About Us](https://www.spaceappschallenge.org/about/) | [Awards](https://www.spaceappschallenge.org/awards/) | [2026 Challenges](https://www.spaceappschallenge.org/2026/challenges/)

---

## 1. Challenge Overview & Problem Statement

Farmers around the world navigate shifting temperatures, changing rainfall patterns, water shortages, extreme weather, and declining soil health. These compounding pressures make it difficult to select crop rotations that protect fields, conserve water, and maintain multigenerational agricultural viability.

**The Challenge:** Design and build an interactive decision-support tool that combines **NASA Earth observations** with local soil information, crop characteristics, and farmer priorities to help growers explore rotation strategies that strengthen soil health and adapt their farms to changing climate conditions.

### Multigenerational Background & Inspiration
This challenge is inspired in part by real multigenerational farming experiences — such as Nevada alfalfa farmer **Denise Moyle**, who manages high-desert irrigation in the Great Basin amid deepening hydrological droughts. Many farming families have lived through difficult seasons where better visibility into shifting soil moisture, heat stress, and bare-soil vulnerabilities could have unlocked healthier, more resilient rotation choices.

Selecting new crops to introduce into a rotation is notoriously difficult:
- A crop that improves soil structure in one region may consume too much groundwater in another.
- Introducing a cover crop may interrupt pest cycles or fix nitrogen, but could conflict with local planting calendars, demand specialized seed drills, or lack local market buyers.
- Monocultures leave soil bare during critical shoulder seasons, accelerating wind and water erosion.

### Core Philosophy: Decision-Support, Not Decision-Replacement
Field Shift operates on a fundamental principle of farmer-centered design:
> *"The tool identifies patterns, synthesizes satellite data, and reveals possibilities — but it never replaces farmer judgment, generational wisdom, or local agronomic review."*

---

## 2. NASA Earth Observations (EO) Data Stack

Field Shift harmonizes long-term satellite observations across spatial and temporal resolutions to provide actionable field-level intelligence:

```
                      ┌─────────────────────────────────┐
                      │    NASA EARTH OBSERVATIONS      │
                      └────────────────┬────────────────┘
                                       │
     ┌──────────────────┬──────────────┴─────┬──────────────────┐
     ▼                  ▼                    ▼                  ▼
┌──────────────┐ ┌──────────────┐   ┌────────────────┐   ┌──────────────┐
│  SOIL & HEAT │ │ PRECIPITATION│   │   VEGETATION   │   │ GROUNDWATER  │
│ SMAP 9km/3km │ │  GPM IMERG   │   │ Landsat 8/9    │   │ GRACE-FO     │
│ECOSTRESS 70m │ │ NASA POWER   │   │  MODIS / NDVI  │   │ SRTM Topo    │
└──────┬───────┘ └──────┬───────┘   └────────┬───────┘   └──────┬───────┘
       │                │                    │                  │
       └────────────────┼────────────────────┼──────────────────┘
                        ▼
       ┌─────────────────────────────────────┐
       │ SPATIAL INTELLIGENCE & HARMONIZATION│
       │ Resampled to 30m Field Analysis Grid│
       └────────────────┬────────────────────┘
                        ▼
       ┌─────────────────────────────────────┐
       │ MULTI-CRITERIA ROTATION EVALUATION  │
       │ Water, Soil N, Erosion, Market, Risk│
       └─────────────────────────────────────┘
```

### Integrated Datasets & Scientific Relevance:

1. **SMAP (Soil Moisture Active Passive):**
   - *Variables:* Top 5 cm surface soil moisture ($m^3/m^3$) and 0–100 cm root-zone soil moisture anomalies.
   - *Farm Application:* Identifies chronic dry spells, field water holding capacity, and saturation risk before planting.
2. **ECOSTRESS (onboard the ISS):**
   - *Variables:* Evapotranspiration (ET), Evaporative Stress Index (ESI), and Land Surface Temperature (LST at 70m).
   - *Farm Application:* Pinpoints field heat stress hotspots and assesses crop water consumption efficiency.
3. **GPM (Global Precipitation Measurement) & IMERG:**
   - *Variables:* Half-hourly to daily precipitation rates, extreme rainfall frequency, dry-spell durations.
   - *Farm Application:* Tracks seasonal water availability and warns against extreme precipitation runoff.
4. **Landsat 8/9 & Sentinel-2 / MODIS:**
   - *Variables:* 30m multispectral surface reflectance, Normalized Difference Vegetation Index (NDVI), and Enhanced Vegetation Index (EVI).
   - *Farm Application:* Maps historical crop vigor curves, detects bare-soil exposure windows, and quantifies cover-crop biomass.
5. **NASA POWER (Prediction Of Worldwide Energy Resources):**
   - *Variables:* Solar irradiance, daily maximum/minimum air temperature, Growing Degree Days (GDD, base 10°C / base 50°F), relative humidity, and frost risk probability.
   - *Farm Application:* Computes crop maturity timelines and critical late spring / early fall frost windows.
6. **GRACE & GRACE-FO (Gravity Recovery and Climate Experiment):**
   - *Variables:* Terrestrial Water Storage Anomaly (TWSA) and regional aquifer depletion trends.
   - *Farm Application:* Provides macro-level context on long-term groundwater security for irrigated agriculture.
7. **SRTM (Shuttle Radar Topography Mission):**
   - *Variables:* 30m digital elevation, slope, aspect, and Topographic Wetness Index (TWI).
   - *Farm Application:* Predicts runoff velocity, erosion hazard zones, and cold-air drainage frost pockets.

---

## 3. Spatial Intelligence & Multi-Resolution Data Harmonization

Because NASA datasets operate across disparate resolutions (SMAP at 9km/36km, Landsat at 30m, ECOSTRESS at 70m, GPM at 10km, and GRACE at ~300km), Field Shift implements a unified harmonization pipeline:

- **Spatial Resampling:** Coarse-resolution grids are downscaled using digital elevation models (SRTM) and high-resolution land-surface covariates (Landsat NDVI/albedo) to a common **30m field grid**.
- **Temporal Alignment:** Aligning multi-temporal feeds into three distinct agronomic horizons:
  1. *Immediate Operational Horizon (1–30 days):* Soil moisture anomalies and frost risk alerts.
  2. *Seasonal Horizon (1–12 months):* Crop GDD accumulation and water balance.
  3. *Decadal Climatological Horizon (10–25 years):* Historical precipitation shifts, heat wave frequency, and aquifer drawdown.
- **Uncertainty Transparency:** The model displays explicit confidence bands (Low/Medium/High) for every indicator, flagging when ground-truth soil testing is recommended.

---

## 4. Rotation Strategy Exploration & Multi-Criteria Engine

Field Shift evaluates and compares at least **three distinct rotation strategies** side-by-side:

### The 3 Core Rotation Scenarios:

| Strategy | Rotation Sequence | Primary Goal | NASA Evidence Base | Key Trade-Off |
|---|---|---|---|---|
| **1. Baseline (Existing)** | Continuous Monoculture (e.g. Corn-Soybean or Alfalfa-Alfalfa) | Familiar market channels, established equipment | Landsat shows 4.5 months bare soil; SMAP shows root-zone water depletion | High erosion risk during winter; declining soil organic matter; high synthetic N fertilizer cost |
| **2. Strategy A (Water Conserver)** | Sorghum-Sudangrass $\rightarrow$ Winter Rye Cover $\rightarrow$ Dryland Pulse (Chickpea/Lentil) | Maximize water-use efficiency; reduce irrigation reliance | ECOSTRESS shows 32% lower evaporative loss; NASA POWER verifies GDD fit | Requires marketing unfamiliar pulse crops; lower peak commodity revenue during wet years |
| **3. Strategy B (Soil Builder & Nitrogen Fixer)** | Small Grain (Winter Wheat) $\rightarrow$ Hairy Vetch / Crimson Clover Relay $\rightarrow$ Sunflower / Canola | Rebuild soil organic matter; fix biological nitrogen; break rootworm cycles | Landsat shows 11-month living canopy cover; GPM verifies rainfall match | Extra seed drilling pass; requires careful cover crop termination timing |

### 6 Evaluation Pillars for Every Strategy:
1. **Water Footprint & Consumptive Use:** Modeled mm of water required vs. SMAP/GPM seasonal supply.
2. **Biological Nitrogen Fixation ($\Delta\text{N kg/ha}$):** Legume contributions reducing synthetic fertilizer expenses.
3. **Soil Organic Matter (SOM) Trajectory:** Estimated 5-year SOM build-up rate through continuous living roots.
4. **Erosion & Bare-Field Mitigation:** Reduction in days with exposed topsoil during peak wind/rain events.
5. **Pest & Disease Cycle Disruption:** Breaks host cycles for corn rootworm, soybean cyst nematode, or alfalfa weevils.
6. **Economic & Equipment Feasibility:** Projected input savings, harvest complexity, and regional market liquidity.

---

## 5. Farmer-Centered Design & Interactive Features

To bridge the gap between complex Earth observations and practical farm management, Field Shift features:

1. **Interactive Field Geospatial Map:**
   - Multi-layer visualizer toggling between:
     * 🛰️ **Satellite True Color**
     * 🌿 **Landsat NDVI (Vegetation Vigor & Bare Soil)**
     * 💧 **SMAP Soil Moisture Anomaly**
     * ☀️ **ECOSTRESS Evapotranspiration Heat Stress**
     * ⛰️ **SRTM Slope & Erosion Risk Contours**
2. **Farmer Priority Weighting Sliders:**
   - Growers dial their exact operational goals:
     - 💧 *Water Conservation*
     - 🧪 *Soil Health & Organic Matter*
     - 💰 *Supplemental Revenue*
     - 🚜 *Low Equipment Overhead*
3. **Climate "What-If" Scenario Stress Tester:**
   - Sliders to adjust temperature anomalies ($\Delta T = 0^\circ\text{C}$ to $+3.5^\circ\text{C}$) and rainfall shifts ($\pm 35\%$), demonstrating how each rotation survives flash droughts or heatwaves.
4. **Transparent "Why Was This Suggested?" Evidence Cards:**
   - Every recommendation lists:
     - ✅ *Why it was suggested*
     - 🛰️ *NASA satellite evidence supporting it*
     - 🔍 *Information gaps & uncertainties*
     - ⚠️ *Local risks requiring agronomist review*
5. **Plain-Language Agricultural Glossary:**
   - Integrated explanations for farmers: *Evapotranspiration (ET)*, *NDVI*, *Growing Degree Days (GDD)*, *Root-Zone Moisture*, *Soil Organic Matter (SOM)*.

---

## 6. Technical Stack & Implementation Architecture

- **Frontend:** React 19 + Vite (lightning-fast, browser-based, mobile/tablet responsive for farm truck cabs).
- **Styling:** Custom Agricultural Glassmorphism (Earthy Emerald `#10b981`, Harvest Gold `#f59e0b`, Deep Soil `#1c1917`, Sky Cyan `#0284c7`).
- **Data Engine:**
  - `src/utils/nasaEarthData.js`: Curated, verified datasets for diverse agricultural zones (Great Basin / Nevada, US Corn Belt, California Central Valley, Mediterranean Drylands).
  - `src/utils/rotationScoringEngine.js`: Multi-criteria agronomic decision algorithms and climate sensitivity models.
- **Component Architecture:**
  - `src/components/Header.jsx`: Farm location selector, NASA Space Apps banner, and glossary toggle.
  - `src/components/FieldMapVisualizer.jsx`: Interactive GIS field map with NASA satellite layer overlays.
  - `src/components/FarmerPrioritySliders.jsx`: Weighting controls for farm goals and constraints.
  - `src/components/ClimateStressTester.jsx`: Scenario simulator ($\Delta T$, $\Delta P$) with vulnerability gauges.
  - `src/components/RotationComparisonMatrix.jsx`: Side-by-side strategy breakdown with trade-off cards.
  - `src/components/StrategyEvidenceModal.jsx`: Deep-dive into NASA satellite telemetry and local agronomist checklist.
  - `src/components/FarmerGlossaryModal.jsx`: Plain-English definitions of satellite remote sensing concepts.
