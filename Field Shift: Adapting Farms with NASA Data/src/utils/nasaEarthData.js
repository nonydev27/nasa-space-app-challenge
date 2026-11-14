// NASA Earth Observations Datasets & Regional Farming Profiles
// For 2026 NASA Space Apps Challenge: Field Shift (Adapting Farms with NASA Data)

export const REGIONAL_FARMS = {
  nevada: {
    id: "nevada",
    name: "Great Basin Alfalfa & Forage",
    location: "Fallon / Lovelock, Nevada (Denise Moyle Region)",
    climate: "Cold Arid High Desert (Köppen BWk)",
    soilType: "Lahontan Silt Loam & Silty Clay",
    annualRainfallMm: 142,
    growingSeasonDays: 135,
    irrigationSource: "Truckee-Carson Irrigation District & Deep Wells",
    currentRotation: "Continuous Alfalfa (7-8 year stand) → Bare Winter Soil",
    satelliteHighlights: {
      smap: "Surface soil moisture drops to 0.08 m³/m³ by July (Severe Deficit)",
      ecostress: "Summer Evapotranspiration (ET) peaks at 7.8 mm/day under pivot irrigation",
      gpm: "82% of precipitation occurs during non-growing winter/early spring",
      landsat: "NDVI drops from 0.78 (active cut) to 0.18 for 5 months of winter bare ground",
      grace: "Regional groundwater storage shows -2.4 cm/year drawdown over 20-year trend",
      power: "Late spring frost risk remains elevated through May 20 (GDD base 10°C: 1,420)"
    },
    fieldParcels: [
      { id: "p1", name: "North Pivot (Alfalfa Stand)", acres: 125, soilMoisture: 0.12, ndvi: 0.68, etRate: 6.4, slopePct: 0.8, erosionRisk: "Low" },
      { id: "p2", name: "South Pivot (Old Alfalfa / Weedy)", acres: 120, soilMoisture: 0.09, ndvi: 0.42, etRate: 5.1, slopePct: 1.2, erosionRisk: "Moderate" },
      { id: "p3", name: "East Flat (Bare Fallow)", acres: 80, soilMoisture: 0.06, ndvi: 0.14, etRate: 1.2, slopePct: 0.5, erosionRisk: "High (Wind)" }
    ]
  },
  iowa: {
    id: "iowa",
    name: "Corn-Soy Belt Prairie Farm",
    location: "Story County / Ames, Iowa",
    climate: "Humid Continental (Köppen Dfa)",
    soilType: "Clarion-Nicollet-Webster Loam (High SOM 3.8%)",
    annualRainfallMm: 915,
    growingSeasonDays: 165,
    irrigationSource: "Rainfed (Tile Drained)",
    currentRotation: "Corn → Soybean (2-Year Monoculture)",
    satelliteHighlights: {
      smap: "Root-zone saturation (0.38 m³/m³) in spring, followed by flash drought risk in August",
      ecostress: "Peak corn transpiration reaches 6.2 mm/day in mid-July",
      gpm: "Extreme precipitation events (>50mm in 24hr) have increased by 28% since 2000",
      landsat: "Fields are completely bare (NDVI < 0.20) for 210 days between harvest and canopy closure",
      grace: "Shallow aquifer storage stable, but nitrate export to Gulf of Mexico watershed high",
      power: "Cumulative Growing Degree Days (GDD): 2,850; early fall freeze risk after Oct 10"
    },
    fieldParcels: [
      { id: "p1", name: "Ridge Field (Grain Corn)", acres: 160, soilMoisture: 0.28, ndvi: 0.82, etRate: 5.8, slopePct: 4.5, erosionRisk: "High (Water)" },
      { id: "p2", name: "Lowland Prairie (Soybeans)", acres: 140, soilMoisture: 0.35, ndvi: 0.74, etRate: 4.9, slopePct: 1.0, erosionRisk: "Low" },
      { id: "p3", name: "Creek Buffer Field (Corn)", acres: 100, soilMoisture: 0.32, ndvi: 0.79, etRate: 5.2, slopePct: 6.2, erosionRisk: "Severe" }
    ]
  },
  california: {
    id: "california",
    name: "Central Valley Irrigated Basin",
    location: "Fresno / Kings County, California",
    climate: "Mediterranean Semi-Arid (Köppen BSh)",
    soilType: "Panoche Fine Sandy Loam",
    annualRainfallMm: 265,
    growingSeasonDays: 250,
    irrigationSource: "State Water Project Allocation + Deep Aquifer Pumping",
    currentRotation: "Almond Orchards & Continuous Cotton/Silage Corn",
    satelliteHighlights: {
      smap: "Severe surface moisture depletion (<0.07 m³/m³) across all un-irrigated zones",
      ecostress: "Extreme Land Surface Temperature (LST > 48°C) on bare fallowed ground",
      gpm: "Virtually zero precipitation from June through September",
      landsat: "Fallow parcels show prolonged heat island signature and dust mobilization",
      grace: "Severe multi-decadal subsidence and cumulative groundwater depletion of -18.5 cm TWSA",
      power: "Growing Degree Days: 3,450; extreme heat (>38°C / 100°F) for 42 days annually"
    },
    fieldParcels: [
      { id: "p1", name: "West Canal Block (Silage Corn)", acres: 150, soilMoisture: 0.18, ndvi: 0.71, etRate: 7.2, slopePct: 0.3, erosionRisk: "Low" },
      { id: "p2", name: "Deep Well Field (Cotton)", acres: 180, soilMoisture: 0.14, ndvi: 0.58, etRate: 5.9, slopePct: 0.4, erosionRisk: "Moderate" },
      { id: "p3", name: "Fallowed Transition Block", acres: 120, soilMoisture: 0.05, ndvi: 0.11, etRate: 0.8, slopePct: 0.2, erosionRisk: "Severe (Dust)" }
    ]
  },
  plains: {
    id: "plains",
    name: "High Plains Dryland Farm",
    location: "Colby, Western Kansas / Eastern Colorado",
    climate: "Semi-Arid Steppe (Köppen BSk)",
    soilType: "Richfield Silt Loam (Moderate Hardpan)",
    annualRainfallMm: 460,
    growingSeasonDays: 150,
    irrigationSource: "Dryland (Declining Ogallala Aquifer fringe)",
    currentRotation: "Winter Wheat → Summer Fallow (14-Month Bare Fallow)",
    satelliteHighlights: {
      smap: "Prolonged dry soil anomalies; surface crusting limits rainwater infiltration",
      ecostress: "High summer evaporative demand during summer fallow wastes up to 60% of rain to evaporation",
      gpm: "Convective spring thunderstorms cause rapid sheet erosion on bare wheat-fallow ground",
      landsat: "Bare soil periods correspond directly to peak spring windstorm erosion events",
      grace: "Ogallala aquifer decline renders deep irrigation economically unfeasible within 10 years",
      power: "High solar radiation; frost risk extends into late April; intense heat in July"
    },
    fieldParcels: [
      { id: "p1", name: "Section 14 (Winter Wheat)", acres: 240, soilMoisture: 0.16, ndvi: 0.65, etRate: 4.1, slopePct: 2.1, erosionRisk: "Moderate" },
      { id: "p2", name: "Section 15 (Summer Fallow)", acres: 240, soilMoisture: 0.10, ndvi: 0.12, etRate: 2.0, slopePct: 1.8, erosionRisk: "Critical (Wind)" },
      { id: "p3", name: "South Pasture Edge", acres: 160, soilMoisture: 0.14, ndvi: 0.38, etRate: 2.8, slopePct: 3.5, erosionRisk: "Moderate" }
    ]
  }
};

export const CROP_DATABASE = {
  alfalfa: {
    name: "Alfalfa (Lucerne)",
    category: "Perennial Legume Forage",
    waterNeedMm: 750,
    nFixationKgHa: 120,
    somImpact: "High (+0.15%/yr through deep taproots)",
    erosionProtection: "High when established; Zero during post-kill tillage",
    marketValue: "High (Dairy & Export Forage)",
    equipmentNeeds: "Standard Swather, Baler, Accumulator",
    notes: "Deep root system (up to 3m) opens hardpan, but consumes heavy water during summer cuts."
  },
  corn: {
    name: "Grain Corn (Maize)",
    category: "Warm-Season C4 Grass",
    waterNeedMm: 620,
    nFixationKgHa: 0,
    somImpact: "Neutral (High residue, but high tillage & soil oxidation)",
    erosionProtection: "Poor (Leaves soil exposed Nov-May)",
    marketValue: "High Commodity Liquidity",
    equipmentNeeds: "Planter, High-Clearance Sprayer, Combine Header",
    notes: "Heavy nitrogen feeder (~180-220 kg N/ha). Vulnerable to mid-summer silking heat stress."
  },
  soybean: {
    name: "Soybean",
    category: "Warm-Season Legume",
    waterNeedMm: 480,
    nFixationKgHa: 45,
    somImpact: "Low (Easily decomposable residue leaves little stable carbon)",
    erosionProtection: "Poor in winter/spring",
    marketValue: "High Commodity Liquidity",
    equipmentNeeds: "Standard Grain Drill / Planter, Combine",
    notes: "Fixes modest N, but high harvest index removes most nitrogen in grain."
  },
  sorghum: {
    name: "Grain Sorghum (Milo) / Sudangrass",
    category: "Drought-Tolerant C4 Grass",
    waterNeedMm: 380,
    nFixationKgHa: 0,
    somImpact: "High (Massive fibrous root biomass, carbon sequestration)",
    erosionProtection: "Excellent standing winter stubble",
    marketValue: "Moderate (Feed grain & regional ethanol)",
    equipmentNeeds: "Same as corn/wheat; no specialized equipment needed",
    notes: "Requires 35-40% less water than corn. Secondary metabolites disrupt corn rootworm cycles."
  },
  winterRye: {
    name: "Winter Cereal Rye",
    category: "Cool-Season Cover / Forage Grain",
    waterNeedMm: 180,
    nFixationKgHa: 0,
    somImpact: "Very High (+0.25%/yr root exudates & organic carbon)",
    erosionProtection: "Exceptional (Armor against wind & torrential spring rain)",
    marketValue: "Cover Crop seed or High-Protein Spring Silage",
    equipmentNeeds: "Standard grain drill, roller-crimper or termination spray",
    notes: "Scavenges residual soil nitrogen, prevents leaching into aquifers, and suppresses weeds."
  },
  hairyVetch: {
    name: "Hairy Vetch / Crimson Clover",
    category: "Cool-Season Annual Legume Cover",
    waterNeedMm: 220,
    nFixationKgHa: 135,
    somImpact: "High (Rapid biological nitrogen and root nodulation)",
    erosionProtection: "Dense creeping spring carpet",
    marketValue: "Direct fertilizer offset ($80-$120/acre synthetic N savings)",
    equipmentNeeds: "Drill with legume inoculant box",
    notes: "Fixes massive biological N for the following crop, reducing synthetic fertilizer inputs."
  },
  chickpea: {
    name: "Dryland Chickpea / Field Pea",
    category: "Cool/Warm Pulse Crop",
    waterNeedMm: 280,
    nFixationKgHa: 70,
    somImpact: "Moderate (Improves soil microbial diversity)",
    erosionProtection: "Moderate",
    marketValue: "High (Human food / Plant-based protein market)",
    equipmentNeeds: "Standard grain drill & combine with flex header",
    notes: "Thrives in low-moisture environments; leaves clean stubble; fixes biological nitrogen."
  },
  sunflower: {
    name: "Oilseed Sunflower",
    category: "Deep-Rooted Broadleaf Cash Crop",
    waterNeedMm: 410,
    nFixationKgHa: 0,
    somImpact: "High (Deep 2.5m taproot scours subsoil nutrients and water)",
    erosionProtection: "Moderate stubble",
    marketValue: "High (Confection & High-Oleic Oil markets)",
    equipmentNeeds: "Row crop planter, pan headers on combine",
    notes: "Breaks monoculture grass weed cycles; scavenges deep nitrogen that leached past corn roots."
  }
};

export const NASA_EO_SENSORS = {
  smap: {
    name: "SMAP (Soil Moisture Active Passive)",
    agency: "NASA JPL",
    orbit: "Sun-Synchronous (685 km)",
    resolution: "9 km L-band Radiometer (Downscaled to 30m via DEM/Landsat)",
    whatItMeasures: "Top 5 cm volumetric soil moisture (m³/m³) and 0–100 cm root-zone soil anomaly index.",
    whyItMattersToFarmers: "Tells you whether your subsoil has enough water reserves to carry a thirsty crop through July without costly irrigation."
  },
  ecostress: {
    name: "ECOSTRESS (ECOsystem Spaceborne Thermal Radiometer Experiment)",
    agency: "NASA JPL on ISS",
    orbit: "International Space Station (400 km)",
    resolution: "70 meter thermal infrared pixels",
    whatItMeasures: "Evapotranspiration (ET), Evaporative Stress Index (ESI), and Land Surface Temperature (LST).",
    whyItMattersToFarmers: "Detects crop water stress days before leaves visually wilt, showing exactly which field corners are overheating."
  },
  gpm: {
    name: "GPM (Global Precipitation Measurement) IMERG",
    agency: "NASA GSFC & JAXA",
    orbit: "Constellation Satellite Network",
    resolution: "10 km half-hourly multi-satellite calibration",
    whatItMeasures: "Rainfall rate, precipitation intensity, dry-spell lengths, and extreme storm volumes.",
    whyItMattersToFarmers: "Helps plan planting windows and warns when torrential rains are likely to wash bare topsoil away."
  },
  landsat: {
    name: "Landsat 8 & 9 (OLI/TIRS)",
    agency: "NASA & USGS",
    orbit: "Sun-Synchronous (705 km, 8-day repeat)",
    resolution: "30 meter multispectral & 15m panchromatic",
    whatItMeasures: "Normalized Difference Vegetation Index (NDVI), canopy greenness, and bare-soil days.",
    whyItMattersToFarmers: "Maps exactly how many weeks each year your field has bare, unprotected soil exposed to erosion."
  },
  grace: {
    name: "GRACE-FO (Gravity Recovery and Climate Experiment)",
    agency: "NASA & GFZ (Germany)",
    orbit: "Twin satellites tracking micro-gravitational shifts",
    resolution: "Regional (~300 km monthly gravity anomaly)",
    whatItMeasures: "Total Water Storage Anomaly (TWSA) — deep regional aquifer depletion.",
    whyItMattersToFarmers: "Shows whether your local groundwater table is sustainably recharging or in danger of running dry."
  },
  power: {
    name: "NASA POWER Agroclimatology",
    agency: "NASA Langley Research Center",
    orbit: "Integrated Surface & Satellite Assimilation",
    resolution: "0.5° x 0.5° daily meteorological grid",
    whatItMeasures: "Growing Degree Days (GDD), solar radiation, relative humidity, and frost probability.",
    whyItMattersToFarmers: "Calculates whether a new rotation crop will mature before the first autumn killing frost."
  },
  srtm: {
    name: "SRTM (Shuttle Radar Topography Mission)",
    agency: "NASA & NGA",
    orbit: "Space Shuttle Endeavour Radar",
    resolution: "30 meter digital elevation model (DEM)",
    whatItMeasures: "Slope gradient, aspect, water flow pathways, and Topographic Wetness Index (TWI).",
    whyItMattersToFarmers: "Pinpoints high-slope hill zones where soil erosion is severe unless covered with living roots."
  }
};

export const FARMER_GLOSSARY = {
  Evapotranspiration: {
    term: "Evapotranspiration (ET)",
    simpleDefinition: "The total amount of water evaporating from soil PLUS water pulled through plant roots and breathed out through leaves.",
    farmerTakeaway: "High ET means your crops are guzzling water fast. NASA ECOSTRESS measures ET at 70-meter resolution so you can choose crops that sip instead of chug."
  },
  NDVI: {
    term: "NDVI (Normalized Difference Vegetation Index)",
    simpleDefinition: "A satellite score from 0.0 (bare dirt or asphalt) to 1.0 (thick, healthy green plant canopy).",
    farmerTakeaway: "Whenever your field's NDVI drops below 0.20, your soil is completely naked and exposed to wind and rain erosion."
  },
  SoilMoistureAnomaly: {
    term: "Soil Moisture Anomaly",
    simpleDefinition: "How much wetter or drier your soil is right now compared to the 20-year average for this exact week.",
    farmerTakeaway: "If NASA SMAP shows a -30% anomaly in April, spring subsoil recharge failed, and planting a high-water crop is risky."
  },
  GrowingDegreeDays: {
    term: "Growing Degree Days (GDD)",
    simpleDefinition: "A heat measurement that tracks how much warmth your crops accumulate day by day to reach maturity.",
    farmerTakeaway: "NASA POWER tracks GDD so you can verify if a second crop (like buckwheat or winter rye) will mature before the ground freezes."
  },
  BareFieldPeriod: {
    term: "Bare-Field Period",
    simpleDefinition: "The days between when one crop is harvested and the next crop covers the ground with living leaves.",
    farmerTakeaway: "During bare periods, valuable topsoil blows away, organic carbon burns off in the sun, and weeds take hold."
  },
  BiologicalNitrogen: {
    term: "Biological Nitrogen Fixation",
    simpleDefinition: "The natural process where legume roots partner with soil bacteria to pull free nitrogen from air into plant food.",
    farmerTakeaway: "Crops like hairy vetch or peas can put 80-140 lbs of free natural nitrogen into your field, slashing fertilizer bills."
  },
  TWSA: {
    term: "Total Water Storage Anomaly (TWSA / GRACE)",
    simpleDefinition: "Satellite gravity measurements that weigh the total water in your region, including deep underground aquifers.",
    farmerTakeaway: "If GRACE shows a steady downward line in your valley, deep well pumping will get more expensive each season."
  }
};
