// Verified NASA facts and dataset records used by AstroLab.
//
// Every number shown to players as "real" comes from this file, and every entry
// carries a source a judge or teacher can open. Records retrieved from a NASA API
// say so (`retrieved`); numbers quoted from NASA pages / peer-reviewed papers cite
// them. Anything that is a game simplification lives in the simulation engine and
// is labelled "game model" in the UI, never as NASA data.

export type Provenance = 'live' | 'archive' | 'published' | 'model';

export interface SourceRef {
  label: string;
  url: string;
}

// ---------------------------------------------------------------------------
// DONKI archive: real space-weather events (offline fallback + story drills)
// ---------------------------------------------------------------------------
export interface DonkiArchiveEvent {
  id: string;
  kind: 'FLR' | 'GST' | 'SEP';
  date: string; // UTC day, yyyy-mm-dd
  headline: string;
  classType: string; // flare class or storm level
  region: string;
  kidText: string;
  /** Severity used by the game when this event drives a storm drill */
  hazard: 'Low' | 'Moderate' | 'Critical';
  sources: SourceRef[];
}

const donkiDay = (type: string, day: string) => `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/${type}?startDate=${day}&endDate=${day}`;

export const DONKI_ARCHIVE: DonkiArchiveEvent[] = [
  {
    id: 'flr-2024-10-03',
    kind: 'FLR',
    date: '2024-10-03',
    headline: 'X9.0 solar flare: the strongest flare of Solar Cycle 25 so far',
    classType: 'X9.0',
    region: 'Active region 13842',
    kidText: 'The Sun shot out its biggest flash of light in years. X-class is the strongest kind of flare.',
    hazard: 'Critical',
    sources: [{ label: 'DONKI flare record (JSON)', url: donkiDay('FLR', '2024-10-03') }]
  },
  {
    id: 'flr-2024-05-14',
    kind: 'FLR',
    date: '2024-05-14',
    headline: 'X8.7 solar flare from the sunspot group that caused May 2024\'s giant auroras',
    classType: 'X8.7',
    region: 'Active region 13664',
    kidText: 'This giant sunspot group fired off flare after flare for weeks. Its storms lit up auroras all over Earth.',
    hazard: 'Critical',
    sources: [{ label: 'DONKI flare record (JSON)', url: donkiDay('FLR', '2024-05-14') }]
  },
  {
    id: 'gst-2024-05-10',
    kind: 'GST',
    date: '2024-05-10',
    headline: 'G5 "extreme" geomagnetic storm (Kp 9), the first since 2003',
    classType: 'Kp 9 (G5)',
    region: 'CMEs from active region 13664',
    kidText: 'Several solar storm clouds hit Earth in a row. People saw auroras much farther south than usual.',
    hazard: 'Critical',
    sources: [{ label: 'DONKI storm record (JSON)', url: donkiDay('GST', '2024-05-10') }]
  },
  {
    id: 'sep-2024-05-20',
    kind: 'SEP',
    date: '2024-05-20',
    headline: 'Solar particle storm reaches Mars: biggest radiation surge Curiosity has measured since landing',
    classType: 'SEP event',
    region: 'Far-side eruption from active region 13664',
    kidText:
      'Curiosity\'s radiation detector saw its biggest jump ever. NASA said an astronaut standing next to the rover would have got about 8,100 micrograys, like 30 chest X-rays.',
    hazard: 'Critical',
    sources: [
      { label: 'NASA: Mars lights up during epic solar storm (2024)', url: 'https://www.nasa.gov/solar-system/nasa-watches-mars-light-up-during-epic-solar-storm/' },
      { label: 'NASA/JPL PIA26302 (Curiosity sees the storm)', url: 'https://photojournal.jpl.nasa.gov/catalog/PIA26302' },
      { label: 'DONKI SEP record (JSON)', url: donkiDay('SEP', '2024-05-20') }
    ]
  },
  {
    id: 'flr-2017-09-06',
    kind: 'FLR',
    date: '2017-09-06',
    headline: 'X9.3 solar flare: the strongest flare of Solar Cycle 24',
    classType: 'X9.3',
    region: 'Active region 12673',
    kidText: 'Four days later the same sunspot erupted again and sent a particle storm all the way to Mars.',
    hazard: 'Critical',
    sources: [
      { label: 'DONKI flare record (JSON)', url: donkiDay('FLR', '2017-09-06') },
      { label: 'NASA/JPL PIA21958', url: 'https://photojournal.jpl.nasa.gov/catalog/PIA21958' }
    ]
  },
  {
    id: 'sep-2017-09-10',
    kind: 'SEP',
    date: '2017-09-10',
    headline: 'X8.2 flare and particle storm: radiation on the Martian surface more than doubled',
    classType: 'X8.2 + SEP',
    region: 'Active region 12673',
    kidText: 'Curiosity measured more than double the normal radiation, and NASA\'s MAVEN orbiter saw a glowing aurora across Mars.',
    hazard: 'Moderate',
    sources: [{ label: 'DONKI SEP record (JSON)', url: donkiDay('SEP', '2017-09-10') }]
  }
];

/** Not in DONKI (it predates it) but the classic lesson for lunar astronauts. */
export const APOLLO_1972_STORM = {
  title: 'August 1972: the storm between Apollo 16 and Apollo 17',
  text: 'A huge solar particle storm hit the Moon between two Apollo missions. No one was there, but mission planners still use it to design storm shelters for Artemis.'
};

// ---------------------------------------------------------------------------
// Radiation dose references (published measurements, mSv per day)
// ---------------------------------------------------------------------------
export interface DoseReference {
  id: string;
  place: string;
  mSvPerDay: number;
  display: string;
  note: string;
  source: SourceRef;
}

export const DOSE_REFERENCES: DoseReference[] = [
  {
    id: 'earth',
    place: 'Living on Earth',
    mSvPerDay: 0.0066,
    display: '≈ 0.007 mSv/day',
    note: 'Natural background radiation, about 2.4 mSv per year on average.',
    source: { label: 'UNSCEAR world average', url: 'https://www.unscear.org/unscear/en/publications.html' }
  },
  {
    id: 'mars-surface',
    place: 'Surface of Mars (Gale Crater)',
    mSvPerDay: 0.64,
    display: '0.64 mSv/day',
    note: 'Measured by Curiosity\'s RAD instrument. The thin air and the planet underneath block some radiation.',
    source: { label: 'Hassler et al. 2014, Science (Curiosity RAD)', url: 'https://doi.org/10.1126/science.1244797' }
  },
  {
    id: 'moon-surface',
    place: 'Surface of the Moon',
    mSvPerDay: 1.37,
    display: '1.37 mSv/day',
    note: 'No air and no magnetic field. Measured on the Moon\'s surface by the Chang\'e-4 lander\'s LND detector.',
    source: { label: 'Zhang et al. 2020, Science Advances', url: 'https://doi.org/10.1126/sciadv.aaz1334' }
  },
  {
    id: 'mars-cruise',
    place: 'Flying between Earth and Mars',
    mSvPerDay: 1.84,
    display: '1.84 mSv/day',
    note: 'Measured inside the Curiosity spacecraft on its way to Mars.',
    source: { label: 'Zeitlin et al. 2013, Science (MSL RAD cruise)', url: 'https://doi.org/10.1126/science.1235989' }
  }
];

export const NASA_CAREER_LIMIT_MSV = 600;
export const CAREER_LIMIT_SOURCE: SourceRef = {
  label: 'NASA 600 mSv career limit (National Academies 2021 review)',
  url: 'https://doi.org/10.17226/26155'
};

/** Game baselines, in mSv per hour, taken straight from the measurements above. */
export const SURFACE_DOSE_MSV_PER_HOUR = {
  moon: 1.37 / 24,
  mars: 0.64 / 24
} as const;

// ---------------------------------------------------------------------------
// NASA OSDR studies, checked against the OSDR search API (osdr.nasa.gov)
// ---------------------------------------------------------------------------
export interface OsdrStudy {
  accession: string;
  title: string;
  organism: string;
  kidFinding: string;
  gameLink: string;
  topic: 'food' | 'body' | 'radiation';
  url: string;
}

const osd = (n: number) => `https://osdr.nasa.gov/bio/repo/data/studies/OSD-${n}`;

export const OSDR_STUDIES: OsdrStudy[] = [
  {
    accession: 'OSD-476',
    title: 'Plants grown in Apollo lunar regolith present stress-associated transcriptomes that inform prospects for lunar exploration',
    organism: 'Arabidopsis thaliana (thale cress)',
    kidFinding:
      'Scientists planted seeds in real Moon soil brought back by Apollo 11, 12 and 17. The plants grew, but slowly, and showed signs of stress. Moon dirt is not friendly soil yet.',
    gameLink: 'Your greenhouse can grow food, but it needs steady water and power to keep plants healthy.',
    topic: 'food',
    url: osd(476)
  },
  {
    accession: 'OSD-268',
    title: 'Microbiological and nutritional analysis of lettuce crops grown on the International Space Station (VEG-01B)',
    organism: 'Red romaine lettuce (Veggie payload)',
    kidFinding: 'Astronauts grew lettuce in the Veggie garden on the ISS. Tests back on Earth showed it was safe to eat.',
    gameLink: 'Fresh crops add Sols of food, but grow lights cost power every hour.',
    topic: 'food',
    url: osd(268)
  },
  {
    accession: 'OSD-342',
    title: 'Targeting myostatin/activin A protects against skeletal muscle and bone loss during spaceflight',
    organism: 'Mice on the ISS',
    kidFinding:
      'Mice that spent 33 days on the space station lost a lot of muscle and bone. Astronauts Jessica Meir and Christina Koch are among the study\'s authors.',
    gameLink: 'Crew health falls when you skip exercise time or run low on food.',
    topic: 'body',
    url: osd(342)
  },
  {
    accession: 'OSD-714',
    title: 'Lunar gravity prevents skeletal muscle atrophy but not myofiber type shift in mice',
    organism: 'Mice in a spinning artificial-gravity habitat',
    kidFinding: 'Mice living at Moon gravity (1/6 of Earth\'s) kept their leg muscle size, but mice in zero gravity lost it.',
    gameLink: 'Even weak gravity helps. Moon and Mars crews still exercise every day.',
    topic: 'body',
    url: osd(714)
  },
  {
    accession: 'OSD-569',
    title: 'Whole blood measurements from the SpaceX Inspiration4 mission',
    organism: 'Humans (4 private astronauts, 3-day flight)',
    kidFinding: 'Even three days in orbit changed the astronauts\' blood and immune cells. Most changes went back to normal after landing.',
    gameLink: 'Radiation and stress add up, which is why your crew needs rest and shelter.',
    topic: 'radiation',
    url: osd(569)
  }
];

// ---------------------------------------------------------------------------
// Outpost sites (Mars Trek / Moon Trek / mission facts)
// ---------------------------------------------------------------------------
export interface SiteFacts {
  name: string;
  body: string;
  coords: string;
  gravity: string;
  air: string;
  day: string;
  temps: string;
  lightDelay: string;
  /** one-way light time used by the game, seconds (Moon) or minutes (Mars) */
  oneWayDelay: { value: number; unit: 's' | 'min' };
  powerNote: string;
  image: { url: string; credit: string; caption: string; link: string };
  trek: SourceRef;
}

export const SITES: Record<'moon' | 'mars', SiteFacts> = {
  moon: {
    name: 'Shackleton Crater rim, lunar south pole',
    body: 'The Moon',
    coords: '89.6° S, 132.3° E (crater centre, NASA Moon Trek)',
    gravity: '0.166 g: you weigh about 1/6 of what you weigh on Earth',
    air: 'None. The Moon has no air, so no wind and no weather.',
    day: 'Polar ridges get sunlight most of the time; dark crater floors never see the Sun.',
    temps: 'Shadowed crater floors are colder than −200 °C',
    lightDelay: 'Radio takes about 1.3 seconds to reach Earth (2.6 s there and back).',
    oneWayDelay: { value: 1.3, unit: 's' },
    powerNote: 'NASA\'s Fission Surface Power project is designing a 40 kW reactor for the Moon, so bases can keep running through the long night.',
    image: {
      url: 'https://images-assets.nasa.gov/image/PIA13523/PIA13523~medium.jpg',
      credit: 'NASA/GSFC/Arizona State University (LRO)',
      caption: 'The lunar south pole seen by NASA\'s Lunar Reconnaissance Orbiter.',
      link: 'https://images.nasa.gov/details/PIA13523'
    },
    trek: { label: 'NASA Moon Trek', url: 'https://trek.nasa.gov/moon/' }
  },
  mars: {
    name: 'Jezero Crater, Mars',
    body: 'Mars',
    coords: '18.4° N, 77.4° E (THEMIS image PIA26252)',
    gravity: '0.38 g: about 3/8 of Earth\'s gravity',
    air: 'Very thin and mostly carbon dioxide, less than 1% of Earth\'s air pressure',
    day: 'One sol (a Mars day) lasts 24 hours 39 minutes 35 seconds.',
    temps: 'Often below −70 °C at night, even in summer',
    lightDelay: 'Radio takes between about 3 and 22 minutes each way, depending on where Earth and Mars are.',
    oneWayDelay: { value: 12, unit: 'min' },
    powerNote: 'In 2018 a planet-wide dust storm blocked so much sunlight that the solar-powered Opportunity rover ran out of power and never woke up.',
    image: {
      url: 'https://images-assets.nasa.gov/image/PIA26252/PIA26252~medium.jpg',
      credit: 'NASA/JPL-Caltech/ASU (THEMIS)',
      caption: 'Jezero Crater\'s delta, left by an ancient river that flowed into a lake.',
      link: 'https://photojournal.jpl.nasa.gov/catalog/PIA26252'
    },
    trek: { label: 'NASA Mars Trek (Jezero)', url: 'https://trek.nasa.gov/mars/' }
  }
};

/** Short, sourced facts used by decision cards and the debrief. */
export const QUICK_FACTS = {
  eclssWater: { text: 'The ISS life support system recycles about 98% of the crew\'s water, including sweat and breath.', source: { label: 'NASA, 2023', url: 'https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/' } },
  oxygenPerPerson: { text: 'Each astronaut breathes about 0.84 kg of oxygen per day.', source: { label: 'NASA Baseline Values and Assumptions Document', url: 'https://ntrs.nasa.gov/citations/20210024855' } },
  opportunity: { text: 'Opportunity, a solar-powered Mars rover, went silent in the 2018 global dust storm.', source: { label: 'NASA Mars Exploration Rovers', url: 'https://science.nasa.gov/mission/mer-opportunity/' } },
  conjunction: { text: 'About every 2 years the Sun sits between Earth and Mars and NASA pauses most commands to Mars for a couple of weeks. This is called solar conjunction.', source: { label: 'NASA: Mars Solar Conjunction', url: 'https://science.nasa.gov/mars/' } },
  fissionPower: { text: 'NASA is developing a 40 kW Fission Surface Power system for the Moon.', source: { label: 'NASA Fission Surface Power', url: 'https://www.nasa.gov/space-technology-mission-directorate/tdm/fission-surface-power' } }
} as const;

/** One place listing every external resource, for the Sources screen and README. */
export const DATA_CATALOG = [
  { name: 'NASA DONKI (space weather)', how: 'Live solar flares, CMEs and geomagnetic storms from the last 30 days set the storm risk in every mission. Six real past events drive the storm drills when offline.', url: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/' },
  { name: 'NASA Open APIs (api.nasa.gov)', how: 'Gateway used to call DONKI with a free API key.', url: 'https://api.nasa.gov/' },
  { name: 'NASA OSDR (space biology)', how: 'Five real studies (accession numbers checked with the OSDR search API) explain the food and crew-health rules. The Science Explorer can also search OSDR live.', url: 'https://osdr.nasa.gov/bio/repo/' },
  { name: 'Radiation measurements (RAD, LND, ISS)', how: 'Published dose rates set how much radiation your crew absorbs on the Moon and Mars.', url: 'https://doi.org/10.1126/science.1244797' },
  { name: 'RadLab (OSDR dosimetry)', how: 'Linked for further exploring. Its service was down (HTTP 500) when this build was made, so the game uses the published Moon and Mars measurements above.', url: 'https://visualization.osdr.nasa.gov/radlab/' },
  { name: 'NASA Mars Trek / Moon Trek', how: 'Site coordinates for Jezero Crater and Shackleton Crater.', url: 'https://trek.nasa.gov/' },
  { name: 'NASA Image and Video Library', how: 'Real photos of the outpost sites and solar storms (public domain, credited).', url: 'https://images.nasa.gov/' },
  { name: 'CSA youth & food-production resources', how: 'Linked for teachers who want follow-up activities.', url: 'https://www.asc-csa.gc.ca/eng/' }
];
