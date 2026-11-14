// Decision cards: the heart of the trade-off lesson.
//
// A card pauses the mission and asks the commander to choose. Every option has at
// least one gain AND at least one cost (checked by `validateDeck`, run in dev), so
// there is never a free "safe" answer. Each card ends with a real, sourced fact so
// the player sees the trade-off is one real mission planners face.

import { OSDR_STUDIES, QUICK_FACTS, SITES, type SourceRef } from '../data/nasaFacts';

export type EffectKey = 'battery' | 'oxygen' | 'food' | 'science' | 'health' | 'morale' | 'water' | 'dose' | 'crops';

/** Immediate change. battery in kWh, food in Sols, dose in mSv, the rest in % / points. */
export type Effects = Partial<Record<EffectKey, number>>;

export interface Modifier {
  id: string;
  label: string;
  hoursLeft: number;
  /** change per game hour */
  perHour?: Effects;
  /** extra electrical load while active, kW */
  loadKW?: number;
  /** multiplies solar output while active */
  solarMult?: number;
  /** multiplies how well life support cleans the air (1 = normal) */
  eclssMult?: number;
}

export interface DecisionOption {
  label: string;
  detail: string;
  effects: Effects;
  modifier?: Omit<Modifier, 'id'>;
  /** What this choice teaches, shown in the debrief */
  lesson: string;
}

export interface DecisionCard {
  id: string;
  title: string;
  icon: string;
  text: string;
  where?: 'moon' | 'mars';
  options: DecisionOption[];
  fact: { text: string; source: SourceRef };
}

const osdr = (acc: string) => {
  const s = OSDR_STUDIES.find((x) => x.accession === acc)!;
  return { text: `NASA ${s.accession}: ${s.kidFinding}`, source: { label: `NASA OSDR ${s.accession}`, url: s.url } };
};

/** Lower is better for these, so a positive number is a cost. */
const COST_IF_POSITIVE: EffectKey[] = ['dose'];

export function isGain(key: EffectKey, value: number): boolean {
  return COST_IF_POSITIVE.includes(key) ? value < 0 : value > 0;
}

export const DECISION_DECK: DecisionCard[] = [
  {
    id: 'ridge-sample',
    title: 'A strange rock on the ridge',
    icon: '🪨',
    text: 'The rover camera spotted an unusual rock 2 km away. Scientists on Earth would love a sample. Going out means suit power and time outside, away from the shelter of the habitat.',
    options: [
      {
        label: 'Go get it',
        detail: 'Two astronauts walk out in spacesuits.',
        effects: { science: 15, battery: -10, dose: 0.4, oxygen: -2 },
        lesson: 'Spacewalks bring the best science, but cost suit power, air and extra radiation.'
      },
      {
        label: 'Leave it for later',
        detail: 'Stay safe inside.',
        effects: { morale: -6, science: 2 },
        lesson: 'Playing it safe protects the crew, but missed discoveries cost the mission.'
      }
    ],
    fact: { text: 'On the Moon there is no air or magnetic field, so radiation outside the habitat is higher. The Chang\'e-4 lander measured about 1.37 mSv a day on the surface.', source: { label: 'Zhang et al. 2020, Science Advances', url: 'https://doi.org/10.1126/sciadv.aaz1334' } }
  },
  {
    id: 'night-prep',
    title: 'The long night is coming',
    icon: '🌑',
    where: 'moon',
    text: 'The Sun is about to dip behind the crater rim. Solar panels will make no power until it comes back. Do you pause experiments to fill the batteries now?',
    options: [
      {
        label: 'Pause experiments',
        detail: 'Charge batteries for the dark.',
        effects: { battery: 25, science: -8 },
        lesson: 'Saving energy before the night is how bases survive. It costs research time.'
      },
      {
        label: 'Keep experiments running',
        detail: 'Science now, hope the batteries last.',
        effects: { science: 10, battery: -15 },
        lesson: 'More science today can mean a dangerously empty battery tonight.'
      }
    ],
    fact: { text: QUICK_FACTS.fissionPower.text + ' A reactor keeps working when the Sun is gone.', source: QUICK_FACTS.fissionPower.source }
  },
  {
    id: 'dusty-panels',
    title: 'Dust on the solar panels',
    icon: '🌪️',
    where: 'mars',
    text: 'A layer of red dust is covering the solar panels and power output is dropping. Someone could go outside and brush them off.',
    options: [
      {
        label: 'Send a crew to clean them',
        detail: 'A short spacewalk with brushes.',
        effects: { oxygen: -3, dose: 0.2, morale: -2 },
        modifier: { label: 'Clean panels', hoursLeft: 48, solarMult: 1.25 },
        lesson: 'Cleaning panels costs air and radiation now, but gives more power for days.'
      },
      {
        label: 'Leave the dust',
        detail: 'Nobody goes outside.',
        effects: { morale: 2 },
        modifier: { label: 'Dusty panels', hoursLeft: 48, solarMult: 0.7 },
        lesson: 'Avoiding risk today means less solar power for days to come.'
      }
    ],
    fact: QUICK_FACTS.opportunity
  },
  {
    id: 'grow-lights',
    title: 'Extra grow lights?',
    icon: '🥬',
    text: 'The botanist says the lettuce would grow much faster with the grow lights on all night. Lights need electricity.',
    options: [
      {
        label: 'Lights on all night',
        detail: 'Faster food, bigger power bill.',
        effects: { crops: 25 },
        modifier: { label: 'Night grow lights', hoursLeft: 12, loadKW: 8 },
        lesson: 'Growing food in space costs energy. More food means less power for other jobs.'
      },
      {
        label: 'Normal schedule',
        detail: 'Save the power.',
        effects: { battery: 5, morale: -3 },
        lesson: 'Saving power means waiting longer for fresh food.'
      }
    ],
    fact: osdr('OSD-268')
  },
  {
    id: 'clogged-filter',
    title: 'Water recycler clogged',
    icon: '💧',
    text: 'A filter in the water recycler is clogged. Fixing it takes the engineer all afternoon, but waiting means water leaks away.',
    options: [
      {
        label: 'Fix it now',
        detail: 'The engineer stops their experiment.',
        effects: { science: -8, water: 4 },
        lesson: 'Repairs use crew time that could have gone to science.'
      },
      {
        label: 'Fix it tomorrow',
        detail: 'Keep working, lose some water.',
        effects: { science: 5 },
        modifier: { label: 'Leaky recycler', hoursLeft: 24, perHour: { water: -0.5 } },
        lesson: 'Small problems grow when you wait. Water you lose has to come from somewhere.'
      }
    ],
    fact: QUICK_FACTS.eclssWater
  },
  {
    id: 'exercise',
    title: 'Gym time or lab time?',
    icon: '🏋️',
    text: 'In low gravity, muscles and bones get weaker. The crew can spend two hours exercising, or use that time in the lab.',
    options: [
      {
        label: 'Exercise',
        detail: 'Two hours on the treadmill and weights.',
        effects: { health: 6, science: -6, food: -0.3 },
        lesson: 'Exercise keeps astronauts strong but uses time and burns extra food.'
      },
      {
        label: 'Skip the gym',
        detail: 'More time for experiments.',
        effects: { science: 8 },
        modifier: { label: 'No exercise', hoursLeft: 24, perHour: { health: -0.25 } },
        lesson: 'Skipping exercise gives more science but slowly weakens the crew.'
      }
    ],
    fact: osdr('OSD-342')
  },
  {
    id: 'big-downlink',
    title: 'Send your data home',
    icon: '📡',
    text: 'Earth is in view. A big data transfer would send all your photos and results to scientists, but the radio needs a lot of power.',
    options: [
      {
        label: 'Send everything',
        detail: 'Full power to the big antenna.',
        effects: { science: 12, battery: -18 },
        lesson: 'Science only counts when it reaches Earth. Talking to Earth costs power.'
      },
      {
        label: 'Send a short message',
        detail: 'A little data gets through, the rest waits.',
        effects: { science: 2, morale: -4 },
        lesson: 'Saving power means scientists and families wait longer to hear from you.'
      }
    ],
    fact: { text: 'Radio signals travel at the speed of light. ' + SITES.mars.lightDelay, source: { label: 'NASA Mars facts', url: 'https://science.nasa.gov/mars/' } }
  },
  {
    id: 'small-flare',
    title: 'Small flare spotted',
    icon: '☀️',
    text: 'Space weather forecasters saw a medium (M-class) flare. It might send particles our way, or it might not. Two crew members are outside working.',
    options: [
      {
        label: 'Call everyone inside',
        detail: 'Stop the outside work early. The crew feels safe.',
        effects: { science: -6, morale: 3 },
        lesson: 'Being careful protects the crew, even when it costs a day\'s work.'
      },
      {
        label: 'Finish the job first',
        detail: 'One more hour outside.',
        effects: { science: 8, dose: 0.8 },
        lesson: 'Staying out longer finishes the job but adds radiation the crew keeps for life.'
      }
    ],
    fact: { text: 'Every astronaut has a lifetime radiation limit of 600 mSv. Each choice to stay outside uses up some of it.', source: { label: 'National Academies 2021', url: 'https://doi.org/10.17226/26155' } }
  },
  {
    id: 'moon-soil-garden',
    title: 'Plant in Moon soil?',
    icon: '🌱',
    where: 'moon',
    text: 'The botanist wants to test growing plants in real lunar soil instead of the clean hydroponic trays. It would be a great experiment, but the plants might struggle.',
    options: [
      {
        label: 'Try lunar soil',
        detail: 'A real experiment with risk.',
        effects: { science: 12, crops: -15 },
        lesson: 'Experiments teach us new things, but they might cost food.'
      },
      {
        label: 'Stick with hydroponics',
        detail: 'Safe, proven food.',
        effects: { crops: 8, morale: -3 },
        lesson: 'The proven way is safer, but we learn nothing new.'
      }
    ],
    fact: osdr('OSD-476')
  },
  {
    id: 'scrubber-fault',
    title: 'Air scrubber warning',
    icon: '🫁',
    text: 'One of the machines that takes carbon dioxide out of the air is failing. You have one spare part. Use it now, or keep it for a worse emergency?',
    options: [
      {
        label: 'Use the spare now',
        detail: 'Shut the lab down while engineers swap it.',
        effects: { science: -10, battery: -8, oxygen: 3 },
        lesson: 'Fixing life support right away is safest, but costs power, time and your only spare.'
      },
      {
        label: 'Run on the backup',
        detail: 'Keep the spare for later.',
        effects: { science: 4 },
        modifier: { label: 'Weak air scrubber', hoursLeft: 36, eclssMult: 0.55 },
        lesson: 'Waiting saves the spare part, but the air slowly gets worse.'
      }
    ],
    fact: QUICK_FACTS.oxygenPerPerson
  }
];

export function findCard(id: string): DecisionCard | undefined {
  return DECISION_DECK.find((c) => c.id === id);
}

/** Dev-time guarantee that no option is free. */
export function validateDeck(): string[] {
  const problems: string[] = [];
  for (const c of DECISION_DECK) {
    for (const o of c.options) {
      const entries = Object.entries(o.effects) as [EffectKey, number][];
      const m = o.modifier;
      const modGain = m ? (m.solarMult ?? 1) > 1 || Object.entries(m.perHour ?? {}).some(([k, v]) => isGain(k as EffectKey, v)) : false;
      const modCost = m ? (m.loadKW ?? 0) > 0 || (m.solarMult ?? 1) < 1 || (m.eclssMult ?? 1) < 1 || Object.entries(m.perHour ?? {}).some(([k, v]) => !isGain(k as EffectKey, v)) : false;
      const gain = entries.some(([k, v]) => isGain(k, v)) || modGain;
      const cost = entries.some(([k, v]) => !isGain(k, v)) || modCost;
      if (!gain || !cost) problems.push(`${c.id} → "${o.label}" needs both a gain and a cost`);
    }
  }
  return problems;
}
