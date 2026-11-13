// Real NASA Open Data & STEM Educational Content
// References: DONKI, OSDR, Artemis, and Mars Exploration Missions

export const NASA_GLOSSARY = {
  Sol: {
    title: "Sol (Martian Day)",
    definition: "One day on Mars! A Sol lasts 24 hours, 39 minutes, and 35 seconds — just a little longer than an Earth day.",
    didYouKnow: "Astronauts living on Mars have to shift their bedtime 39 minutes later every single day!"
  },
  DONKI: {
    title: "NASA DONKI",
    definition: "Space Weather Database Of Notifications, Knowledge, and Information. It monitors solar flares, solar storms, and Coronal Mass Ejections (CMEs).",
    didYouKnow: "DONKI satellites orbit between Earth and the Sun, giving us an early warning before solar radiation hits astronauts!"
  },
  OSDR: {
    title: "NASA OSDR",
    definition: "Open Science Data Repository. NASA's open database of space biology experiments on astronaut genes, bone density, and space plants.",
    didYouKnow: "Over 600 space biological experiments are freely downloadable by anyone in the world!"
  },
  Regolith: {
    title: "Lunar / Martian Regolith",
    definition: "The fine powdery soil that covers the Moon and Mars. It's sharp like crushed volcanic glass because there is no wind or water to erode it on the Moon.",
    didYouKnow: "Engineers plan to pile 2 to 3 meters of regolith on top of inflatable habitats to shield astronauts from deadly space radiation."
  },
  ECLSS: {
    title: "ECLSS (Life Support)",
    definition: "Environmental Control and Life Support System. The high-tech recycling engine that scrubs carbon dioxide from air and purifies every drop of water.",
    didYouKnow: "On the International Space Station, ECLSS recycles 98% of all water — including astronaut sweat and breath!"
  },
  CME: {
    title: "Coronal Mass Ejection (CME)",
    definition: "A giant magnetic bubble of superheated plasma blasted out of the Sun at up to 3,000 kilometers per second (over 6 million mph)!",
    didYouKnow: "A powerful CME can create vibrant auroras on Earth, but can be dangerous to astronauts on the Moon or Mars who don't have Earth's thick magnetic shield."
  },
  Sievert: {
    title: "mSv (Millisievert)",
    definition: "The scientific unit used to measure radiation absorbed by living tissue. People on Earth get about 3 mSv per year from natural background radiation.",
    didYouKnow: "A 6-month journey to Mars exposes an astronaut to roughly 300 mSv — equal to dozens of chest CT scans!"
  },
  RTG: {
    title: "Radioisotope Thermoelectric Generator (RTG)",
    definition: "A nuclear space battery that turns heat from decaying plutonium into reliable electricity, running nonstop for 30+ years without sunlight.",
    didYouKnow: "NASA's Curiosity and Perseverance rovers on Mars are powered by RTGs, allowing them to work even during pitch-black dust storms."
  },
  "Lag / Latency": {
    title: "Communication Delay",
    definition: "Radio signals travel at the speed of light (300,000 km/s). It takes ~1.3 seconds to reach the Moon, but between 4 and 24 minutes to reach Mars!",
    didYouKnow: "If an astronaut on Mars says 'Houston, we have a problem', it could take up to 48 minutes to hear Earth's answer back!"
  }
};

export const REAL_DONKI_EVENTS = [
  {
    id: "DONKI-X9-2024",
    catalogId: "2024-05-14T02:13:00-FLR-001",
    type: "Solar Flare",
    classType: "X9.3 Extreme",
    sourceLocation: "Active Region AR3664",
    cmeSpeedKms: 2150,
    kpIndex: 8.7,
    warningLeadTimeSec: 45,
    description: "An immense X-class solar flare erupted from sunspot AR3664, hurling an ultra-fast Coronal Mass Ejection straight into interplanetary space.",
    hazardLevel: "Critical",
    recommendedAction: "Order immediate emergency lockdown into the subterranean regolith bunker. Cut non-essential science power to boost magnetic deflector."
  },
  {
    id: "DONKI-M4-2024",
    catalogId: "2024-08-08T19:40:00-FLR-002",
    type: "Solar Energetic Particles",
    classType: "M4.8 Moderate",
    sourceLocation: "Active Region AR3780",
    cmeSpeedKms: 1100,
    kpIndex: 6.0,
    warningLeadTimeSec: 65,
    description: "Moderate M-class flare detected with elevated proton radiation. Astronauts on EVA (spacewalks) must return to airlock immediately.",
    hazardLevel: "Moderate",
    recommendedAction: "Abort active rover missions, recall astronauts from surface, and run ECLSS radiation scrubbers."
  },
  {
    id: "DONKI-C8-2024",
    catalogId: "2024-10-02T11:15:00-FLR-003",
    type: "Coronal Mass Ejection",
    classType: "C8.1 Minor",
    sourceLocation: "Active Region AR3842",
    cmeSpeedKms: 650,
    kpIndex: 4.0,
    warningLeadTimeSec: 90,
    description: "Minor solar event with slight radio noise. Solar panel generation drops slightly, but safe for normal indoor operations.",
    hazardLevel: "Low",
    recommendedAction: "Monitor battery levels and schedule solar panel angle alignment."
  }
];

export const REAL_OSDR_STUDIES = [
  {
    accession: "OSD-379",
    title: "Plants Grown in Apollo Lunar Regolith Simulant",
    organism: "Arabidopsis thaliana (Thale Cress)",
    keyFinding: "Plants germinated and grew in lunar soil, but showed elevated stress-related gene expression. Adding organic compost and recycling water reduced plant stress by 64%.",
    gameplayImpact: "Hydroponics bay requires steady water flow to prevent crops from withering in alien soil."
  },
  {
    accession: "OSD-137",
    title: "DNA Double-Strand Break Repair in Microgravity",
    organism: "Human Lymphoblastoid Cells / ISS Crew",
    keyFinding: "Cosmic rays damage DNA strands faster than normal. Sleep, antioxidant nutrition, and shielding under 1.5m regolith restore DNA repair enzymes.",
    gameplayImpact: "Crew health regenerates when radiation shielding is active and food quality is high."
  },
  {
    accession: "OSD-204",
    title: "Bone Mineral Loss Mitigation via Resistive Exercise",
    organism: "Astronaut Biomarkers",
    keyFinding: "Astronauts lose 1.0% to 1.5% bone density per month without 2 hours of daily resistive exercise. Exercise requires extra calorie intake.",
    gameplayImpact: "Higher crew morale and physical fitness requires maintaining adequate food calories per Sol."
  }
];

export const PLANETARY_LOCATIONS = {
  moon: {
    name: "Lunar South Pole (Artemis Base Camp)",
    targetBody: "The Moon (Luna)",
    site: "Shackleton Crater Rim / Malapert Mountain",
    gravity: "0.166 g (1/6th Earth)",
    atmosphere: "Vacuum (0 kPa)",
    dayNightCycle: "14 Earth days daylight, followed by 14 Earth days darkness",
    tempRange: "-246°C to +120°C",
    commDelay: "1.3 seconds",
    description: "The crater peaks receive nearly continuous sunlight ('Peaks of Eternal Light'), while the deep permanently shadowed craters conceal billions of tons of water ice.",
    primaryChallenge: "Surviving the deep cryogenic cold and managing power during eclipse transitions."
  },
  mars: {
    name: "Jezero Crater Outpost",
    targetBody: "Mars",
    site: "Jezero Delta / Olympus Mons Foothills",
    gravity: "0.38 g (3/8th Earth)",
    atmosphere: "0.6 kPa (95% Carbon Dioxide)",
    dayNightCycle: "1 Sol (24h 39m)",
    tempRange: "-125°C to +20°C",
    commDelay: "4 to 24 minutes (Simulated ~12 min average)",
    description: "An ancient river lake bed rich in clay minerals. Subject to global dust storms that can shroud the sun for months at a time.",
    primaryChallenge: "Catastrophic dust storms cutting solar power and communication latency with Earth."
  }
};

export const MISSION_CAMPAIGNS = [
  {
    id: "mission-1",
    title: "Mission 1: Lunar Dawn (Artemis Base)",
    location: "moon",
    difficulty: "Cadet Friendly",
    tagline: "Survive the Lunar South Pole Transition",
    story: "Welcome to Artemis Base Camp at Shackleton Crater! The Sun is dipping behind the crater rim. You have 3 Sols to balance battery storage, power life-support heaters, and maintain oxygen reserves.",
    goal: {
      targetSols: 5,
      minO2: 70,
      minBattery: 25,
      minFoodDays: 3,
      scienceTarget: 80
    },
    initialState: {
      powerCapacityKW: 120,
      baseLoadKW: 35,
      batteryKWh: 85,
      batteryMaxKWh: 100,
      oxygenLevel: 95,
      waterLevel: 90,
      foodStockpileSols: 8,
      radiationShielding: 75,
      crewMorale: 90,
      sciencePoints: 10,
      crewHealth: 100,
      activeDustStorm: false
    },
    educationalLesson: "The Moon has no atmosphere to trap heat. When darkness falls, temperatures plunge to -130°C, and heaters require immense battery reserves."
  },
  {
    id: "mission-2",
    title: "Mission 2: Martian Dust Horizon",
    location: "mars",
    difficulty: "Intermediate",
    tagline: "Outlast a Planet-Wide Martian Dust Storm",
    story: "A massive atmospheric dust storm has swept over Jezero Crater! Dust optical depth (tau) has quadrupled, slashing solar array output by 80%. You must throttle non-essential research and rely on the nuclear RTG baseload.",
    goal: {
      targetSols: 6,
      minO2: 65,
      minBattery: 20,
      minFoodDays: 2,
      scienceTarget: 120
    },
    initialState: {
      powerCapacityKW: 140,
      baseLoadKW: 40,
      batteryKWh: 75,
      batteryMaxKWh: 120,
      oxygenLevel: 90,
      waterLevel: 80,
      foodStockpileSols: 7,
      radiationShielding: 60,
      crewMorale: 85,
      sciencePoints: 20,
      crewHealth: 95,
      activeDustStorm: true
    },
    educationalLesson: "Martian dust storms can envelop the entire globe for weeks. Rovers like Opportunity lost power when dust covered their solar panels; Perseverance relies on an RTG nuclear battery."
  },
  {
    id: "mission-3",
    title: "Mission 3: DONKI Solar Storm Alert",
    location: "moon",
    difficulty: "Advanced Flight Director",
    tagline: "NASA DONKI Class-X Flare Emergency Evacuation",
    story: "NASA's DONKI space weather monitor has detected a coronal mass ejection traveling at 2,150 km/s! You have 90 seconds to activate the magnetic shield deflector and evacuate the crew into the underground regolith bunker.",
    goal: {
      targetSols: 6,
      minO2: 70,
      minBattery: 30,
      minFoodDays: 4,
      scienceTarget: 150,
      mustShieldDONKI: true
    },
    initialState: {
      powerCapacityKW: 150,
      baseLoadKW: 45,
      batteryKWh: 95,
      batteryMaxKWh: 120,
      oxygenLevel: 98,
      waterLevel: 92,
      foodStockpileSols: 9,
      radiationShielding: 40,
      crewMorale: 80,
      sciencePoints: 30,
      crewHealth: 100,
      incomingSolarFlare: true
    },
    educationalLesson: "Without Earth's protective magnetic field (magnetosphere), astronauts are directly exposed to solar cosmic rays. Regolith bunkers and active shielding are critical to survival."
  },
  {
    id: "mission-4",
    title: "Mission 4: Greenhouse Crisis (OSDR)",
    location: "mars",
    difficulty: "Intermediate",
    tagline: "Cultivate High-Yield Crops Under Water Rationing",
    story: "A water pipe leak contaminated part of the dry ration stock! Following NASA OSDR biological research protocols, optimize the Hydroponic Greenhouse to cultivate rapid-cycle microgreens while conserving recycled water.",
    goal: {
      targetSols: 7,
      minO2: 75,
      minBattery: 25,
      minFoodDays: 6,
      scienceTarget: 180
    },
    initialState: {
      powerCapacityKW: 130,
      baseLoadKW: 38,
      batteryKWh: 80,
      batteryMaxKWh: 100,
      oxygenLevel: 90,
      waterLevel: 55,
      foodStockpileSols: 3,
      radiationShielding: 70,
      crewMorale: 75,
      sciencePoints: 40,
      crewHealth: 90,
      greenhouseCrisis: true
    },
    educationalLesson: "NASA's OSDR shows that space crops produce oxygen, absorb toxic CO2, and provide fresh vitamins that prevent astronaut vision degradation (SANS) and depression."
  },
  {
    id: "mission-5",
    title: "Mission 5: The Deep Space Latency Crisis",
    location: "mars",
    difficulty: "Flight Director Elite",
    tagline: "Autonomous Decision Making with 15-Minute Comms Lag",
    story: "Earth is on the opposite side of the Sun (Solar Conjunction). Communication lag is 18 minutes! An unexpected ECLSS air scrubber failure occurs. You cannot wait for Houston; you must triage and resolve it locally.",
    goal: {
      targetSols: 8,
      minO2: 80,
      minBattery: 35,
      minFoodDays: 5,
      scienceTarget: 220
    },
    initialState: {
      powerCapacityKW: 160,
      baseLoadKW: 50,
      batteryKWh: 90,
      batteryMaxKWh: 140,
      oxygenLevel: 80,
      waterLevel: 85,
      foodStockpileSols: 8,
      radiationShielding: 80,
      crewMorale: 80,
      sciencePoints: 50,
      crewHealth: 92,
      commsBlackout: true
    },
    educationalLesson: "Because light takes minutes to reach Mars, astronauts cannot be micro-managed by Earth Mission Control. They must be empowered with local decision-making tools."
  }
];

export const BADGE_DEFINITIONS = [
  {
    id: "badge_solar_survivor",
    icon: "☀️🛡️",
    title: "Solar Storm Survivor",
    description: "Successfully shielded the outpost during a major DONKI space weather alert without crew harm.",
    rarity: "Gold"
  },
  {
    id: "badge_power_master",
    icon: "⚡🔋",
    title: "Master of the Grid",
    description: "Balanced power allocation and prevented total battery blackout during a crisis.",
    rarity: "Silver"
  },
  {
    id: "badge_botanist",
    icon: "🌱🥔",
    title: "Martian Botanist",
    description: "Grew self-sustaining hydroponic crops using OSDR plant biology principles.",
    rarity: "Green"
  },
  {
    id: "badge_flight_director",
    icon: "🚀⭐",
    title: "Flight Director Wings",
    description: "Successfully commanded and completed a 2026 Space Apps Mission.",
    rarity: "Platinum"
  },
  {
    id: "badge_data_scout",
    icon: "📡🔍",
    title: "NASA Data Scout",
    description: "Explored and learned from the live DONKI and OSDR open science datasets.",
    rarity: "Bronze"
  }
];
