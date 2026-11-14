// Mission content, glossary and badges for AstroLab.
// Real-world numbers live in src/data/nasaFacts.ts (with sources); this file
// re-exports them in the shapes the UI uses and holds the mission campaign.

import { DATA_CATALOG, DONKI_ARCHIVE, OSDR_STUDIES, SITES } from '../data/nasaFacts';

export interface GlossaryEntry {
  title: string;
  definition: string;
  didYouKnow: string;
}

export const NASA_GLOSSARY: Record<string, GlossaryEntry> = {
  Sol: {
    title: 'Sol (a Mars day)',
    definition: 'One day on Mars. A sol lasts 24 hours, 39 minutes and 35 seconds, a little longer than an Earth day.',
    didYouKnow: 'Mission teams working on Mars time shift their schedule about 40 minutes later every day! In AstroLab we count every base day as a "sol", even on the Moon, to keep things simple.'
  },
  Gravity: {
    title: 'Gravity',
    definition: 'The pull that keeps your feet on the ground. The Moon pulls about 1/6 as hard as Earth, and Mars about 3/8. Weak gravity means you jump higher and fall slower.',
    didYouKnow: 'Living in low gravity makes muscles and bones weaker, so astronauts exercise every day (NASA study OSD-342).'
  },
  'kW and kWh': {
    title: 'kW and kWh (power and energy)',
    definition: 'kW (kilowatts) is how fast electricity is being made or used right now, like water flowing from a tap. kWh is how much is stored, like water in a bucket. Your battery holds kWh.',
    didYouKnow: 'A Moon base reactor of 40 kW could power about 30 homes on Earth.'
  },
  Battery: {
    title: 'Battery',
    definition: 'Stores extra energy from the solar panels so the base keeps running at night or in a dust storm. If it empties, life support slows down and the air gets worse.',
    didYouKnow: 'At night on the Moon, solar panels make nothing. The battery and the nuclear generator keep the crew alive.'
  },
  'Solar conjunction': {
    title: 'Solar conjunction',
    definition: 'About every 2 years the Sun sits exactly between Earth and Mars. Its glow scrambles radio signals, so Earth and Mars cannot talk for about 2 weeks.',
    didYouKnow: 'NASA plans for it: rovers get a to-do list before conjunction and work on their own.'
  },
  DONKI: {
    title: 'NASA DONKI',
    definition: 'NASA\'s space weather database. Forecasters record every big solar flare, solar storm cloud (CME) and particle storm in it.',
    didYouKnow: 'DONKI gets its information from spacecraft like SOHO and SDO that watch the Sun all the time.'
  },
  OSDR: {
    title: 'NASA OSDR',
    definition: 'NASA\'s Open Science Data Repository: a free library of space biology experiments on plants, animals, microbes and astronauts.',
    didYouKnow: 'Anyone in the world can download its data. It holds hundreds of studies.'
  },
  Regolith: {
    title: 'Regolith',
    definition: 'The loose, dusty soil that covers the Moon and Mars. Moon regolith is sharp, like crushed glass, because there is no wind or water to smooth it.',
    didYouKnow: 'Engineers plan to pile regolith on top of habitats as a radiation shield.'
  },
  ECLSS: {
    title: 'ECLSS (life support)',
    definition: 'The Environmental Control and Life Support System: machines that make oxygen, remove carbon dioxide, and clean water.',
    didYouKnow: 'On the ISS it recycles about 98% of the crew\'s water, including sweat and breath!'
  },
  CME: {
    title: 'Coronal Mass Ejection (CME)',
    definition: 'A giant cloud of electrically charged gas blasted out of the Sun. The fastest ones travel thousands of kilometers per second.',
    didYouKnow: 'When CMEs hit Earth they make auroras. On the Moon or Mars there is no magnetic field to protect astronauts from the particles.'
  },
  Sievert: {
    title: 'mSv (millisievert)',
    definition: 'A unit for how much radiation your body absorbs. People on Earth get about 2.4 mSv per year from nature.',
    didYouKnow: 'Curiosity measured 0.64 mSv per day on the Martian surface. That is about 100 times more than on Earth.'
  },
  RTG: {
    title: 'RTG (nuclear battery)',
    definition: 'A Radioisotope Thermoelectric Generator turns heat from decaying plutonium into electricity, day and night, for decades.',
    didYouKnow: 'Curiosity and Perseverance run on RTGs, so dust storms cannot switch them off.'
  },
  RadLab: {
    title: 'RadLab',
    definition: 'A NASA database of real radiation measurements taken by instruments on the International Space Station.',
    didYouKnow: 'Space agencies from several countries share their radiation readings in it.'
  },
  'Mars Trek': {
    title: 'NASA Mars Trek',
    definition: 'An online map of Mars made from real orbiter images and height data. Scientists use it to plan landing sites and rover drives.',
    didYouKnow: 'Jezero Crater, home of our Mars base, is about 45 km wide and was once a lake!'
  },
  'Lag / Latency': {
    title: 'Communication delay',
    definition: 'Radio travels at the speed of light. A message takes about 1.3 seconds to reach the Moon, and about 3 to 22 minutes to reach Mars.',
    didYouKnow: 'If a Mars crew asks Earth a question, the answer can take more than 40 minutes to come back.'
  },
  EVA: {
    title: 'EVA (spacewalk)',
    definition: 'Extravehicular activity: going outside in a spacesuit or on the rover. It is how astronauts collect samples.',
    didYouKnow: 'Outside the habitat, astronauts lose the protection of its walls, so they absorb more radiation.'
  }
};

// Shapes kept for older components ----------------------------------------
export const REAL_DONKI_EVENTS = DONKI_ARCHIVE;
export const REAL_OSDR_STUDIES = OSDR_STUDIES;

export const RESOURCE_LINKS = DATA_CATALOG.map((d) => ({ title: d.name, url: d.url, description: d.how, tag: d.name.split(' ')[1] ?? 'NASA' }));

export const PLANETARY_LOCATIONS = {
  moon: { ...SITES.moon, site: 'Shackleton Crater rim' },
  mars: { ...SITES.mars, site: 'Jezero Crater' }
};

// Missions ------------------------------------------------------------------
export interface Mission {
  id: string;
  title: string;
  location: 'moon' | 'mars';
  difficulty: string;
  tagline: string;
  story: string;
  tradeOff: string;
  goal: { targetSols: number; minO2: number; minBattery: number; scienceTarget: number; minFoodDays: number; minHealth: number };
  initialState: Record<string, number | boolean>;
  educationalLesson: string;
}

export const MISSION_CAMPAIGNS: Mission[] = [
  {
    id: 'mission-1',
    title: 'Mission 1: Lunar Dawn',
    location: 'moon',
    difficulty: 'Cadet friendly',
    tagline: 'Keep the lights on through the cold lunar night',
    story:
      'Welcome to Artemis Base Camp on the rim of Shackleton Crater! Each night the Sun drops behind the rim, the solar panels stop, and the heaters need extra power. Keep the crew breathing and the batteries charged for 3 sols, and finish your experiments.',
    tradeOff: 'Science now, or battery for tonight?',
    goal: { targetSols: 3, minO2: 60, minBattery: 15, scienceTarget: 30, minFoodDays: 2, minHealth: 50 },
    initialState: { batteryKWh: 95, batteryMaxKWh: 120, oxygenLevel: 95, waterLevel: 90, foodStockpileSols: 8, radiationShielding: 80, crewMorale: 95, sciencePoints: 5, crewHealth: 100 },
    educationalLesson: 'The Moon has no air to hold heat. When the Sun goes down, heaters need lots of stored energy, so smart crews charge their batteries before dark.'
  },
  {
    id: 'mission-2',
    title: 'Mission 2: Martian Dust Horizon',
    location: 'mars',
    difficulty: 'Intermediate',
    tagline: 'Outlast a dust storm that blocks the Sun',
    story:
      'A huge dust storm is sweeping over Jezero Crater. Dust in the sky is blocking most of the sunlight, so the solar panels make very little power. Your nuclear RTG keeps running. Decide what stays on and what goes dark.',
    tradeOff: 'Rover science in the storm, or save power and stay safe?',
    goal: { targetSols: 4, minO2: 65, minBattery: 15, scienceTarget: 16, minFoodDays: 2, minHealth: 50 },
    initialState: { batteryKWh: 60, batteryMaxKWh: 120, oxygenLevel: 90, waterLevel: 80, foodStockpileSols: 7, radiationShielding: 60, crewMorale: 85, sciencePoints: 10, crewHealth: 95, activeDustStorm: true },
    educationalLesson: 'In 2018 a planet-wide dust storm covered the solar-powered Opportunity rover and it never woke up. Curiosity and Perseverance use nuclear power, so they kept working.'
  },
  {
    id: 'mission-3',
    title: 'Mission 3: Solar Storm Alert',
    location: 'moon',
    difficulty: 'Advanced',
    tagline: 'A real solar storm is heading for the Moon',
    story:
      'NASA\'s DONKI space-weather database has flagged a powerful solar eruption. Particles from the Sun will reach the Moon in under a minute. Get the crew into the regolith bunker or raise the magnetic deflector, then keep the base running.',
    tradeOff: 'Shelter costs work time and power. Staying out costs health.',
    goal: { targetSols: 4, minO2: 70, minBattery: 20, scienceTarget: 40, minFoodDays: 3, minHealth: 50 },
    initialState: { batteryKWh: 95, batteryMaxKWh: 120, oxygenLevel: 98, waterLevel: 92, foodStockpileSols: 9, radiationShielding: 40, crewMorale: 80, sciencePoints: 10, crewHealth: 100, incomingSolarFlare: true },
    educationalLesson: 'The Moon has no magnetic field to push solar particles away. Shelters buried under regolith are the best protection Artemis astronauts will have.'
  },
  {
    id: 'mission-4',
    title: 'Mission 4: Greenhouse Crisis',
    location: 'mars',
    difficulty: 'Intermediate',
    tagline: 'Grow food faster than the crew eats it',
    story:
      'A leak spoiled most of the stored food. You have 3 sols of rations left. The greenhouse can grow more, but grow lights need power and plants need water. Feed the crew without running the base dry.',
    tradeOff: 'Power for the plants, or power for everything else?',
    goal: { targetSols: 5, minO2: 70, minBattery: 15, scienceTarget: 55, minFoodDays: 1, minHealth: 50 },
    initialState: { batteryKWh: 80, batteryMaxKWh: 100, oxygenLevel: 90, waterLevel: 60, foodStockpileSols: 3, radiationShielding: 70, crewMorale: 75, sciencePoints: 10, crewHealth: 90 },
    educationalLesson: 'NASA has grown lettuce on the ISS (OSDR study OSD-268) and grown plants in real Apollo Moon soil (OSD-476). Space farming works, but it needs steady water, light and power.'
  },
  {
    id: 'mission-5',
    title: 'Mission 5: On Your Own',
    location: 'mars',
    difficulty: 'Flight Director',
    tagline: 'The Sun blocks the radio. No help from Earth.',
    story:
      'It is solar conjunction: the Sun is right between Earth and Mars, and radio messages cannot get through. Then an air scrubber starts to fail. Mission Control cannot help you. Every decision is yours.',
    tradeOff: 'Fix it now and lose work, or wait and hope?',
    goal: { targetSols: 5, minO2: 75, minBattery: 20, scienceTarget: 65, minFoodDays: 3, minHealth: 50 },
    initialState: { batteryKWh: 90, batteryMaxKWh: 140, oxygenLevel: 82, waterLevel: 85, foodStockpileSols: 8, radiationShielding: 80, crewMorale: 80, sciencePoints: 10, crewHealth: 92 },
    educationalLesson: 'Because Mars is so far away, and sometimes hidden behind the Sun, Mars crews must be trained to solve problems themselves without waiting for Earth.'
  }
];

export const BADGE_DEFINITIONS = [
  { id: 'badge_solar_survivor', icon: '☀️🛡️', title: 'Solar Storm Survivor', description: 'Had the crew shielded when a solar storm hit.', rarity: 'Gold' },
  { id: 'badge_power_master', icon: '⚡🔋', title: 'Master of the Grid', description: 'Finished a mission without ever running the battery flat.', rarity: 'Silver' },
  { id: 'badge_botanist', icon: '🌱🥔', title: 'Space Botanist', description: 'Harvested crops during a successful mission.', rarity: 'Green' },
  { id: 'badge_flight_director', icon: '🚀⭐', title: 'Flight Director Wings', description: 'Completed a mission and met every goal.', rarity: 'Platinum' },
  { id: 'badge_data_scout', icon: '📡🔍', title: 'NASA Data Scout', description: 'Explored the real NASA data behind the game.', rarity: 'Bronze' }
];
