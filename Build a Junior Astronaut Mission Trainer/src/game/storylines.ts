// Cinematic story beats for each mission, assembled from the real NASA datasets
// in utils/nasaData.js (planetary facts, DONKI archive, OSDR studies) plus an
// optional live DONKI feed fetched at briefing time.

import {
  MISSION_CAMPAIGNS,
  PLANETARY_LOCATIONS,
  REAL_DONKI_EVENTS,
  REAL_OSDR_STUDIES
} from '../utils/nasaData';
import type { DataCallout, StoryBeat } from './types';

export interface LiveDonkiEvent {
  catalogId: string;
  classType: string;
  sourceLocation: string;
  cmeSpeedKms: number | null;
  beginTime?: string;
  hazardLevel: string;
}

export interface StoryContext {
  callsign: string;
  avatarName: string;
  /** null = not requested, [] = fetched but empty/offline */
  liveDonki: LiveDonkiEvent[] | null;
}

type Mission = (typeof MISSION_CAMPAIGNS)[number];

const MOON = PLANETARY_LOCATIONS.moon;
const MARS = PLANETARY_LOCATIONS.mars;
const [X_FLARE] = REAL_DONKI_EVENTS;
const [OSD_379, OSD_137, OSD_204] = REAL_OSDR_STUDIES;

function goalCallouts(m: Mission): DataCallout[] {
  return [
    { label: 'Survive', value: `${m.goal.targetSols} Sols`, source: 'Mission rules' },
    { label: 'Oxygen', value: `≥ ${m.goal.minO2}%`, source: 'ECLSS limit' },
    { label: 'Battery', value: `≥ ${m.goal.minBattery}%`, source: 'Power reserve' }
  ];
}

function liveDonkiCallout(ctx: StoryContext): DataCallout {
  const live = ctx.liveDonki;
  if (live && live.length > 0) {
    const strongest = [...live].sort((a, b) => rankFlare(b.classType) - rankFlare(a.classType))[0];
    const when = strongest.beginTime ? new Date(strongest.beginTime).toLocaleDateString() : 'this month';
    return {
      label: 'Strongest flare in the last 30 days',
      value: `${strongest.classType.split(' ')[0]} · ${strongest.sourceLocation} · ${when}`,
      source: 'NASA DONKI live feed',
      live: true
    };
  }
  return {
    label: 'Live DONKI feed',
    value: 'Offline. Using the archived record instead',
    source: 'NASA DONKI archive'
  };
}

function rankFlare(classType: string): number {
  const letter = classType?.[0]?.toUpperCase();
  const mag = parseFloat(classType?.slice(1)) || 0;
  const base = letter === 'X' ? 300 : letter === 'M' ? 200 : letter === 'C' ? 100 : 0;
  return base + mag;
}

function introBeats(m: Mission, ctx: StoryContext): StoryBeat[] {
  const you = ctx.callsign;
  switch (m.id) {
    case 'mission-1':
      return [
        {
          shot: 'establishing',
          kicker: 'ARTEMIS BASE CAMP · LUNAR SOUTH POLE',
          text: `Touchdown confirmed. Commander ${you}, welcome to the rim of Shackleton Crater, the first permanent human outpost on the Moon.`,
          data: [
            { label: 'Gravity', value: MOON.gravity, source: 'Artemis / LRO' },
            { label: 'Atmosphere', value: MOON.atmosphere, source: 'Artemis / LRO' }
          ],
          effects: { hour: 9 }
        },
        {
          shot: 'sky',
          kicker: 'LOOK UP',
          text: `That blue marble is home, 384,400 km away. A radio call to Mission Control takes ${MOON.commDelay} each way.`,
          data: [{ label: 'Signal delay', value: MOON.commDelay, source: 'Deep Space Network' }],
          effects: { hour: 10 }
        },
        {
          shot: 'power',
          kicker: 'POWER GRID',
          text: 'At the pole the Sun barely clears the horizon. Our solar wings turn to follow it, while the nuclear RTG hums out steady power day and night.',
          data: [
            { label: 'Solar peak', value: '95 kW', source: 'Base design' },
            { label: 'RTG baseload', value: '25 kW', source: 'Kilopower class' },
            { label: 'Battery', value: `${m.initialState.batteryKWh} / ${m.initialState.batteryMaxKWh} kWh`, source: 'Mission start' }
          ],
          effects: { hour: 15 }
        },
        {
          shot: 'habitat',
          kicker: 'NIGHT IS COMING',
          text: m.educationalLesson,
          data: [{ label: 'Temperature range', value: MOON.tempRange, source: 'LRO Diviner' }],
          effects: { hour: 19.5 }
        },
        {
          shot: 'avatar',
          kicker: 'YOUR ORDERS',
          text: `${ctx.avatarName}, suit up. Keep the crew breathing and the batteries charged until the base is self-sufficient.`,
          data: goalCallouts(m),
          effects: { hour: 8 }
        }
      ];

    case 'mission-2':
      return [
        {
          shot: 'establishing',
          kicker: 'JEZERO CRATER · MARS',
          text: `Commander ${you}, this ancient lake bed is where Perseverance hunts for signs of past life. It is also home now.`,
          data: [
            { label: 'Gravity', value: MARS.gravity, source: 'Mars 2020' },
            { label: 'Atmosphere', value: MARS.atmosphere, source: 'Mars 2020 MEDA' }
          ],
          effects: { hour: 11, dust: false }
        },
        {
          shot: 'sky',
          kicker: 'STORM ON THE HORIZON',
          text: m.story,
          data: [
            { label: 'Dust optical depth τ', value: '0.6 → 3.8', source: 'Mars 2020 MEDA' },
            { label: 'Solar loss', value: '≈ 80%', source: 'Mission model' }
          ],
          effects: { hour: 13, dust: true }
        },
        {
          shot: 'power',
          kicker: 'THE NUCLEAR LIFELINE',
          text: m.educationalLesson,
          data: [{ label: 'RTG baseload', value: '40 kW', source: 'MMRTG class' }],
          effects: { hour: 14, dust: true }
        },
        {
          shot: 'avatar',
          kicker: 'YOUR ORDERS',
          text: `${ctx.avatarName}, decide what gets power and what goes dark. Life support comes first.`,
          data: goalCallouts(m),
          effects: { hour: 9, dust: true }
        }
      ];

    case 'mission-3':
      return [
        {
          shot: 'comms',
          kicker: 'INCOMING · NASA DONKI',
          text: `Commander ${you}, the space weather desk is calling. NASA's DONKI database tracks every flare and CME the Sun throws at us.`,
          data: [liveDonkiCallout(ctx)],
          effects: { hour: 10 }
        },
        {
          shot: 'sky',
          kicker: 'REAL EVENT · MAY 2024',
          text: `Today's drill uses a real storm: an ${X_FLARE.classType.split(' ')[0]} flare from sunspot ${X_FLARE.sourceLocation.replace('Active Region ', '')}. ${X_FLARE.description}`,
          data: [
            { label: 'Flare class', value: X_FLARE.classType, source: X_FLARE.catalogId },
            { label: 'CME speed', value: `${X_FLARE.cmeSpeedKms.toLocaleString()} km/s`, source: 'DONKI CME analysis' },
            { label: 'Kp index', value: `${X_FLARE.kpIndex}`, source: 'NOAA SWPC' }
          ],
          effects: { hour: 11, flare: true }
        },
        {
          shot: 'bunker',
          kicker: 'NO MAGNETIC SHIELD HERE',
          text: m.educationalLesson,
          data: [{ label: 'Regolith shelter', value: '2.5 m blocks ~90%', source: 'OSDR / NASA HRP' }],
          effects: { hour: 11, flare: true, bunker: true }
        },
        {
          shot: 'avatar',
          kicker: 'YOUR ORDERS',
          text: `When the alarm sounds you have seconds, not minutes. Seal the bunker or raise the deflector, then ride out ${m.goal.targetSols} Sols.`,
          data: goalCallouts(m),
          effects: { hour: 9 }
        }
      ];

    case 'mission-4':
      return [
        {
          shot: 'greenhouse',
          kicker: 'FOOD BAY ALERT',
          text: m.story,
          data: [
            { label: 'Food left', value: `${m.initialState.foodStockpileSols} Sols`, source: 'Stores inventory' },
            { label: 'Water tank', value: `${m.initialState.waterLevel}%`, source: 'ECLSS' }
          ],
          effects: { hour: 12 }
        },
        {
          shot: 'greenhouse',
          kicker: `NASA ${OSD_379.accession}`,
          text: `${OSD_379.title}: ${OSD_379.keyFinding}`,
          data: [{ label: 'Organism', value: OSD_379.organism, source: 'NASA OSDR' }],
          effects: { hour: 13 }
        },
        {
          shot: 'habitat',
          kicker: `NASA ${OSD_204.accession}`,
          text: `${OSD_204.keyFinding} Fresh crops keep the crew strong.`,
          data: [{ label: 'Bone loss', value: '1–1.5% / month', source: 'NASA OSDR' }],
          effects: { hour: 17 }
        },
        {
          shot: 'avatar',
          kicker: 'YOUR ORDERS',
          text: `${ctx.avatarName}, grow food faster than the crew eats it, without draining the water tank.`,
          data: goalCallouts(m),
          effects: { hour: 9 }
        }
      ];

    case 'mission-5':
      return [
        {
          shot: 'comms',
          kicker: 'SOLAR CONJUNCTION',
          text: m.story,
          data: [
            { label: 'Earth–Mars delay', value: MARS.commDelay, source: 'Deep Space Network' },
            { label: 'Today', value: '18 min one-way', source: 'Mission model' }
          ],
          effects: { hour: 20 }
        },
        {
          shot: 'habitat',
          kicker: 'AIR SCRUBBER FAULT',
          text: `Oxygen is already at ${m.initialState.oxygenLevel}%. By the time Houston hears about it, it would be too late. You are the Flight Director now.`,
          data: [{ label: 'Oxygen', value: `${m.initialState.oxygenLevel}%`, source: 'ECLSS telemetry' }],
          effects: { hour: 21 }
        },
        {
          shot: 'avatar',
          kicker: 'YOUR ORDERS',
          text: m.educationalLesson,
          data: goalCallouts(m),
          effects: { hour: 8 }
        }
      ];


    case 'mission-6':
      return[
        {
          shot: 'establishing',
          kicker: 'LUNAR SOUTH POLE',
          text: `Commander ${you}, the Artemis Base Camp is now a permanent outpost. The crew is healthy, the batteries are charged, and the solar wings are tracking the Sun.`,
          data: [
            { label: 'Gravity', value: MOON.gravity, source: 'Artemis / LRO' },
          ]
        }
      ];

      case 'mission-7':
      return[
        {
          shot: 'establishing',
          kicker: 'JEZERO CRATER · MARS',
          text: `Commander ${you}, the Jezero outpost is now a permanent settlement. The crew is healthy, the batteries are charged, and the solar wings are tracking the Sun.`,
          data: [
            { label: 'Gravity', value: MARS.gravity, source: 'Mars 2020' },
          ]
        }
      ];  
      case 'mission-8':
        return[
          {
            shot: 'establishing',
            kicker: 'LUNAR SOUTH POLE',
            text: `Commander ${you}, the Artemis Base Camp is now a permanent outpost. The crew is healthy, the batteries are charged, and the solar wings are tracking the Sun.`,
            data: [
              { label: 'Gravity', value: MOON.gravity, source: 'Artemis / LRO' },
            ]
          }
        ]; 

    default:
      return [];
  }
}

export function buildIntro(missionId: string, ctx: StoryContext): StoryBeat[] {
  const m = MISSION_CAMPAIGNS.find((x) => x.id === missionId);
  if (!m) {
    return [
      {
        shot: 'establishing',
        kicker: 'SANDBOX OUTPOST',
        text: `No timers, no orders. Commander ${ctx.callsign}, the base is yours to experiment with.`,
        effects: { hour: 10 }
      }
    ];
  }
  return introBeats(m, ctx);
}

export function buildOutro(missionId: string, ctx: StoryContext, success: boolean, sols: number, failureReason: string): StoryBeat[] {
  const m = MISSION_CAMPAIGNS.find((x) => x.id === missionId);
  if (success) {
    const beats: StoryBeat[] = [
      {
        shot: 'establishing',
        kicker: `SOL ${sols} · MISSION COMPLETE`,
        text: `The lights are still on and every crew member is breathing easy. Well done, Commander ${ctx.callsign}.`,
        effects: { hour: 7 }
      }
    ];
    if (m?.id === 'mission-3') {
      beats.push({
        shot: 'bunker',
        kicker: `NASA ${OSD_137.accession}`,
        text: OSD_137.keyFinding,
        data: [{ label: 'Lesson', value: 'Shelter + rest = DNA repair', source: 'NASA OSDR' }]
      });
    }
    beats.push({
      shot: 'avatar',
      kicker: 'TRANSMISSION TO EARTH',
      text: m ? m.educationalLesson : 'Your experiments are logged for the next crew.',
      effects: { hour: 7 }
    });
    return beats;
  }
  return [
    {
      shot: 'habitat',
      kicker: 'MISSION LOST',
      text: failureReason || 'The outpost could not be sustained.',
      effects: { hour: 22 }
    },
    {
      shot: 'avatar',
      kicker: 'FLIGHT DIRECTOR NOTE',
      text: `Apollo 13 failed its mission and still brought everyone home, because the team learned fast. ${m?.educationalLesson ?? ''}`,
      effects: { hour: 6 }
    }
  ];
}
