// Cinematic story beats for each mission, assembled from verified NASA facts
// (src/data/nasaFacts.ts) plus the space weather fetched before launch.

import { MISSION_CAMPAIGNS, type Mission } from '../utils/nasaData';
import { DONKI_ARCHIVE, OSDR_STUDIES, QUICK_FACTS } from '../data/nasaFacts';
import type { SpaceWeather } from '../data/donki';
import type { DataCallout, StoryBeat } from './types';

export interface StoryContext {
  callsign: string;
  avatarName: string;
  /** null while loading */
  weather: SpaceWeather | null;
}

const study = (acc: string) => OSDR_STUDIES.find((s) => s.accession === acc)!;

function goalCallouts(m: Mission): DataCallout[] {
  return [
    { label: 'Survive', value: `${m.goal.targetSols} sols`, source: 'Mission goal' },
    { label: 'Science', value: `${m.goal.scienceTarget} points`, source: 'Mission goal' },
    { label: 'Keep air', value: `≥ ${m.goal.minO2}%`, source: 'Mission goal' }
  ];
}

export function weatherCallout(w: SpaceWeather | null): DataCallout {
  if (w?.status === 'live') {
    const top = w.flares[0];
    return {
      label: top ? 'Strongest flare, last 30 days' : 'Last 30 days',
      value: top ? `${top.classType} · ${new Date(top.peak).toLocaleDateString()}` : 'A quiet Sun',
      source: `NASA DONKI (live) · storm risk ${w.risk}`,
      live: true
    };
  }
  return { label: 'Space weather', value: 'Offline: storms use real archived events', source: 'NASA DONKI archive' };
}

function introBeats(m: Mission, ctx: StoryContext): StoryBeat[] {
  const you = ctx.callsign;
  switch (m.id) {
    case 'mission-1':
      return [
        {
          shot: 'establishing',
          kicker: 'ARTEMIS BASE CAMP · LUNAR SOUTH POLE',
          text: `Touchdown confirmed. Commander ${you}, welcome to the rim of Shackleton Crater, home of the first base on the Moon.`,
          data: [
            { label: 'Gravity', value: '1/6 of Earth', source: 'NASA' },
            { label: 'Air', value: 'None', source: 'NASA' }
          ],
          effects: { hour: 9 }
        },
        {
          shot: 'sky',
          kicker: 'LOOK UP',
          text: 'That blue marble is home. A radio message to Mission Control takes 1.3 seconds to get there, so you can ask Earth for help almost straight away.',
          data: [{ label: 'Radio delay', value: '1.3 s each way', source: 'Speed of light' }],
          effects: { hour: 10 }
        },
        {
          shot: 'power',
          kicker: 'POWER',
          text: 'Solar panels follow the Sun. A small nuclear generator makes steady power day and night, like the 40 kW reactor NASA is designing for the Moon.',
          data: [
            { label: 'Nuclear baseload', value: '40 kW', source: 'NASA Fission Surface Power target' },
            { label: 'Battery', value: `${m.initialState.batteryKWh} / ${m.initialState.batteryMaxKWh} kWh`, source: 'Mission start' }
          ],
          effects: { hour: 15 }
        },
        { shot: 'habitat', kicker: 'NIGHT IS COMING', text: m.educationalLesson, data: [{ label: 'Shadowed craters', value: 'below −200 °C', source: 'NASA LRO' }], effects: { hour: 19.5 } },
        { shot: 'avatar', kicker: 'YOUR ORDERS', text: `${ctx.avatarName}, suit up. Every choice costs something. Keep the crew breathing, keep the lights on, and finish your science.`, data: goalCallouts(m), effects: { hour: 8 } }
      ];
    case 'mission-2':
      return [
        {
          shot: 'establishing',
          kicker: 'JEZERO CRATER · MARS',
          text: `Commander ${you}, this crater was once a lake. Perseverance explores it looking for signs of ancient life. Now it is your home too.`,
          data: [
            { label: 'Gravity', value: '3/8 of Earth', source: 'NASA' },
            { label: 'Location', value: '18.4° N, 77.4° E', source: 'NASA THEMIS / Mars Trek' }
          ],
          effects: { hour: 11, dust: false }
        },
        { shot: 'sky', kicker: 'STORM ON THE HORIZON', text: m.story, data: [{ label: 'Sunlight lost', value: 'most of it', source: 'Game model' }], effects: { hour: 13, dust: true } },
        { shot: 'power', kicker: 'A REAL LESSON', text: m.educationalLesson, data: [{ label: 'Opportunity rover', value: 'lost in the 2018 storm', source: QUICK_FACTS.opportunity.source.label }], effects: { hour: 14, dust: true } },
        { shot: 'avatar', kicker: 'YOUR ORDERS', text: `${ctx.avatarName}, decide what gets power and what goes dark. Air comes first.`, data: goalCallouts(m), effects: { hour: 9, dust: true } }
      ];
    case 'mission-3': {
      const real = DONKI_ARCHIVE.find((e) => e.id === 'sep-2024-05-20')!;
      return [
        {
          shot: 'comms',
          kicker: 'INCOMING · NASA DONKI',
          text: `Commander ${you}, the space weather desk is calling. NASA's DONKI database records every flare and solar storm. Here is what the Sun did this month:`,
          data: [weatherCallout(ctx.weather)],
          effects: { hour: 10 }
        },
        {
          shot: 'sky',
          kicker: `REAL EVENT · ${real.date}`,
          text: real.kidText,
          data: [{ label: 'Measured by', value: "Curiosity's RAD instrument", source: real.sources[0].label }],
          effects: { hour: 11, flare: true }
        },
        { shot: 'bunker', kicker: 'NO MAGNETIC SHIELD HERE', text: m.educationalLesson, data: [{ label: 'Moon surface radiation', value: '1.37 mSv/day', source: "Chang'e-4 LND, 2020" }], effects: { hour: 11, flare: true, bunker: true } },
        { shot: 'avatar', kicker: 'YOUR ORDERS', text: 'When the alarm sounds you have seconds. Press Bunker or raise the deflector, then keep the base running.', data: goalCallouts(m), effects: { hour: 9 } }
      ];
    }
    case 'mission-4': {
      const veggie = study('OSD-268');
      const apollo = study('OSD-476');
      return [
        { shot: 'greenhouse', kicker: 'FOOD ALERT', text: m.story, data: [{ label: 'Food left', value: `${m.initialState.foodStockpileSols} sols`, source: 'Stores' }, { label: 'Water tank', value: `${m.initialState.waterLevel}%`, source: 'Life support' }], effects: { hour: 12 } },
        { shot: 'greenhouse', kicker: `NASA ${veggie.accession}`, text: veggie.kidFinding, data: [{ label: 'Crop', value: veggie.organism, source: 'NASA OSDR' }], effects: { hour: 13 } },
        { shot: 'habitat', kicker: `NASA ${apollo.accession}`, text: apollo.kidFinding, data: [{ label: 'Plant', value: apollo.organism, source: 'NASA OSDR' }], effects: { hour: 17 } },
        { shot: 'avatar', kicker: 'YOUR ORDERS', text: `${ctx.avatarName}, grow food faster than the crew eats it, without running out of power or water.`, data: goalCallouts(m), effects: { hour: 9 } }
      ];
    }
    case 'mission-5':
      return [
        { shot: 'comms', kicker: 'SOLAR CONJUNCTION', text: QUICK_FACTS.conjunction.text, data: [{ label: 'Messages to Earth', value: 'Blocked by the Sun', source: QUICK_FACTS.conjunction.source.label }], effects: { hour: 20 } },
        { shot: 'habitat', kicker: 'AIR SCRUBBER FAULT', text: `Air is already at ${m.initialState.oxygenLevel}%, and a machine that cleans it is failing. Nobody on Earth can hear you. You are the Flight Director now.`, data: [{ label: 'Air', value: `${m.initialState.oxygenLevel}%`, source: 'Life support' }], effects: { hour: 21 } },
        { shot: 'avatar', kicker: 'YOUR ORDERS', text: m.educationalLesson, data: goalCallouts(m), effects: { hour: 8 } }
      ];
    default:
      return [];
  }
}

export function buildIntro(missionId: string, ctx: StoryContext): StoryBeat[] {
  const m = MISSION_CAMPAIGNS.find((x) => x.id === missionId);
  if (!m) {
    return [
      { shot: 'establishing', kicker: 'SANDBOX OUTPOST', text: `No goals, no orders. Commander ${ctx.callsign}, the base is yours to experiment with. What happens if you switch life support off?`, data: [weatherCallout(ctx.weather)], effects: { hour: 10 } }
    ];
  }
  return introBeats(m, ctx);
}

export function buildOutro(missionId: string, ctx: StoryContext, success: boolean, sols: number, failureReason: string): StoryBeat[] {
  const m = MISSION_CAMPAIGNS.find((x) => x.id === missionId);
  if (success) {
    const beats: StoryBeat[] = [
      { shot: 'establishing', kicker: `SOL ${sols} · MISSION COMPLETE`, text: `The lights are still on, the air is clean, and the science is on its way to Earth. Well done, Commander ${ctx.callsign}.`, effects: { hour: 7 } }
    ];
    if (m?.id === 'mission-3') {
      const s = study('OSD-569');
      beats.push({ shot: 'bunker', kicker: `NASA ${s.accession}`, text: s.kidFinding, data: [{ label: 'Lesson', value: 'Shelter protects the crew', source: 'NASA OSDR' }] });
    }
    beats.push({ shot: 'avatar', kicker: 'TRANSMISSION TO EARTH', text: m ? m.educationalLesson : 'Your experiments are logged for the next crew.', effects: { hour: 7 } });
    return beats;
  }
  return [
    { shot: 'habitat', kicker: 'MISSION NOT COMPLETE', text: failureReason || 'The outpost could not be kept running.', effects: { hour: 22 } },
    {
      shot: 'avatar',
      kicker: 'FLIGHT DIRECTOR NOTE',
      text: `Apollo 13 never landed on the Moon, but the team worked the problem and brought everyone home. Failing in training is how astronauts learn. ${m?.educationalLesson ?? ''}`,
      effects: { hour: 6 }
    }
  ];
}

