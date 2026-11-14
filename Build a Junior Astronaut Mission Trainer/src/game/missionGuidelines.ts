// Walkthroughs shown in the Mission Guidelines modal. Numbers match the game
// model in src/utils/simulationEngine.ts (POWER, SCIENCE); science facts come
// from src/data/nasaFacts.ts.

import { POWER } from '../utils/simulationEngine';

export interface MissionGuideline {
  missionId: string;
  title: string;
  location: 'moon' | 'mars';
  difficulty: string;
  summary: string;
  primaryObjectives: string[];
  stepByStepWalkthrough: {
    step: number;
    phase: string;
    action: string;
    proTip: string;
  }[];
  criticalRules: string[];
  nasaScienceFacts: string[];
  suggestedAllocations: {
    eclss: number;
    shields: number;
    greenhouse: number;
    scienceLab: number;
    commsRover: number;
    notes: string;
  };
}

const NIGHT_MOON = POWER.eclssDayKW + POWER.eclssNightExtraKW.moon;
const NIGHT_MARS = POWER.eclssDayKW + POWER.eclssNightExtraKW.mars;

const DECISION_STEP = {
  phase: 'Decision cards',
  action: 'Sometimes the clock stops and a card asks you to choose. Read the green (gain) and red (cost) chips on each option. No option is free!',
  proTip: 'Press 1 or 2 on the keyboard to choose quickly. Your choices and what they teach appear in the debrief.'
};

export const MISSION_GUIDELINES: Record<string, MissionGuideline> = {
  'mission-1': {
    missionId: 'mission-1',
    title: 'Mission 1: Lunar Dawn',
    location: 'moon',
    difficulty: 'Cadet friendly',
    summary: 'Learn the most important trade-off on the Moon: use power for science in the day, but save enough battery for the cold night when the solar panels stop.',
    primaryObjectives: ['Survive 3 sols', 'Keep air (oxygen) at 60% or more', 'Keep the battery at 15% or more', 'Reach 30 science points', 'Keep at least 2 sols of food'],
    stepByStepWalkthrough: [
      { step: 1, phase: 'Daytime', action: `While the Sun is up, the solar panels make up to ${POWER.solarPeakKW.moon} kW and the nuclear generator makes ${POWER.baseloadKW.moon} kW. Open Power and give the Science Lab some power.`, proTip: 'Extra power you do not use fills the battery.' },
      { step: 2, phase: 'Before sunset', action: 'Watch the clock. About 4 hours before 18:00, turn the lab down so the battery is full at dark.', proTip: 'Call Mission Control: on the Moon the answer comes back in just 2.6 seconds.' },
      { step: 3, phase: 'Night', action: `At night the panels make 0 kW and the heaters need more. Raise Life Support to ${NIGHT_MOON} kW and turn the lab off.`, proTip: 'If the Power meter says "draining", switch off something you do not need.' },
      { step: 4, ...DECISION_STEP }
    ],
    criticalRules: [`Life support needs ${POWER.eclssDayKW} kW in the day and ${NIGHT_MOON} kW at night.`, 'Never run the lab at full power through the night.', 'Space = jump, hold Shift = jetpack.'],
    nasaScienceFacts: [
      'Artemis astronauts will explore the lunar south pole, where some ridges get sunlight most of the time and crater floors stay dark and frozen.',
      "NASA is designing a 40 kW fission reactor so Moon bases can keep running through the night."
    ],
    suggestedAllocations: { eclss: 22, shields: 0, greenhouse: 10, scienceLab: 15, commsRover: 3, notes: `Daytime setup. At night: Life Support ${NIGHT_MOON} kW, Science Lab 0 kW.` }
  },

  'mission-2': {
    missionId: 'mission-2',
    title: 'Mission 2: Martian Dust Horizon',
    location: 'mars',
    difficulty: 'Intermediate',
    summary: 'A dust storm blocks most of the sunlight. Decide what to switch off so the air keeps flowing until the storm ends.',
    primaryObjectives: ['Survive 4 sols', 'Keep air at 65% or more', 'Keep the battery at 15% or more', 'Reach 20 science points', 'Keep at least 2 sols of food'],
    stepByStepWalkthrough: [
      { step: 1, phase: 'Triage', action: `The panels make very little power in the storm, but the nuclear generator still makes ${POWER.baseloadKW.mars} kW. Open Power and turn down everything except Life Support.`, proTip: 'Engineers call choosing what to switch off "triage".' },
      { step: 2, phase: 'Food vs. power', action: 'You have food stored. You can turn the greenhouse down for a while and turn it back up when the battery recovers.', proTip: 'Plants slowly lose health without power. Do not leave them off for days.' },
      { step: 3, phase: 'Science', action: 'Short rover trips earn science, but the dust storm hurts the crew\'s health while they are outside. Keep trips short.', proTip: 'Watch Crew health in Flight Director mode.' },
      { step: 4, ...DECISION_STEP }
    ],
    criticalRules: ['The deflector uses 30 kW. There are no solar particles in a dust storm, so leave it off.', `At night Life Support needs ${NIGHT_MARS} kW.`],
    nasaScienceFacts: [
      'In 2018 a planet-wide dust storm blocked the sunlight and the solar-powered Opportunity rover never woke up.',
      'Curiosity and Perseverance use nuclear power (RTGs), so they kept working through dust storms.'
    ],
    suggestedAllocations: { eclss: 22, shields: 0, greenhouse: 3, scienceLab: 0, commsRover: 0, notes: 'Storm setup: only what keeps the crew alive.' }
  },

  'mission-3': {
    missionId: 'mission-3',
    title: 'Mission 3: Solar Storm Alert',
    location: 'moon',
    difficulty: 'Advanced',
    summary: 'A real solar storm, taken from NASA DONKI, is about to hit the Moon. Get the crew to shelter in time, then keep the base running.',
    primaryObjectives: ['Shelter the crew before the countdown reaches 0', 'Survive 4 sols', 'Keep air at 70% or more', 'Keep the battery at 20% or more', 'Reach 40 science points'],
    stepByStepWalkthrough: [
      { step: 1, phase: 'Take cover', action: 'When the red alert appears, press Bunker on the alert or in the dock straight away.', proTip: 'The bunker is buried under Moon soil, which blocks most of the particles.' },
      { step: 2, phase: 'Or raise the deflector', action: 'The magnetic deflector also protects the crew, but it uses 30 kW. Turn the lab down to pay for it.', proTip: 'The deflector is a game idea; real bases plan to use soil and water shielding.' },
      { step: 3, phase: 'Wait for the all-clear', action: 'Stay sheltered until the log says "All clear". Then open the bunker and get back to work.', proTip: 'In the bunker, no science happens and the crew gets bored. That is the cost of being safe.' },
      { step: 4, ...DECISION_STEP }
    ],
    criticalRules: ['Be sheltered before the countdown reaches 0.', 'No rover trips during a storm.'],
    nasaScienceFacts: [
      'The Moon has no magnetic field. Its surface gets about 1.37 mSv of radiation per day (Chang\'e-4 measurement), about 200 times more than on Earth.',
      'In May 2024 a solar storm reached Mars and Curiosity measured its biggest radiation jump since landing.'
    ],
    suggestedAllocations: { eclss: 22, shields: 0, greenhouse: 10, scienceLab: 10, commsRover: 3, notes: 'Normal setup. In a storm: Bunker on, lab off.' }
  },

  'mission-4': {
    missionId: 'mission-4',
    title: 'Mission 4: Greenhouse Crisis',
    location: 'mars',
    difficulty: 'Intermediate',
    summary: 'Most of the stored food was spoiled. Use the greenhouse to grow food faster than the crew eats it, without running out of power or water.',
    primaryObjectives: ['Survive 5 sols', 'Keep air at 70% or more', 'Keep the battery at 15% or more', 'Reach 55 science points', 'Keep at least 1 sol of food at the end'],
    stepByStepWalkthrough: [
      { step: 1, phase: 'Fast-grow mode', action: `Open Systems → Food Bay and switch on the high-yield cycle. Then give the greenhouse ${POWER.greenhouseHighKW} kW in Power.`, proTip: `With less than ${POWER.greenhouseHighKW} kW the plants stop growing.` },
      { step: 2, phase: 'Harvest', action: 'When crops reach 70%, press Harvest in the dock for +2 sols of food.', proTip: 'Each crew day eats 1 sol of food.' },
      { step: 3, phase: 'Water', action: 'Plants need water. If the tank drops below 30%, press Ration. The crew gets grumpier but the water lasts longer.', proTip: 'Below 15% water, plants stop growing.' },
      { step: 4, ...DECISION_STEP }
    ],
    criticalRules: [`High-yield crops need ${POWER.greenhouseHighKW} kW.`, 'Harvest as soon as the button lights up.'],
    nasaScienceFacts: [
      'NASA OSD-268: lettuce grown in the Veggie garden on the ISS was tested back on Earth and found safe to eat.',
      'NASA OSD-476: plants grew in real Apollo Moon soil, but slowly and stressed.'
    ],
    suggestedAllocations: { eclss: 22, shields: 0, greenhouse: 18, scienceLab: 10, commsRover: 3, notes: 'Farming setup. Turn the lab down at night.' }
  },

  'mission-5': {
    missionId: 'mission-5',
    title: 'Mission 5: On Your Own',
    location: 'mars',
    difficulty: 'Flight Director',
    summary: 'The Sun is between Earth and Mars, so nobody on Earth can hear you. An air scrubber starts failing. Every decision is yours.',
    primaryObjectives: ['Survive 5 sols', 'Keep air at 75% or more', 'Keep the battery at 20% or more', 'Reach 65 science points', 'Keep at least 3 sols of food'],
    stepByStepWalkthrough: [
      { step: 1, phase: 'No help from Earth', action: 'The Mission Control button shows "No signal". This guide is your only help, just like a real crew\'s training manuals.', proTip: 'Real Mars crews will train for months to solve problems alone.' },
      { step: 2, phase: 'The scrubber', action: 'Soon a card asks about the failing air scrubber. Using the spare costs power and science now; waiting makes the air worse for a day and a half.', proTip: 'Air starts at 82% and must end at 75% or more.' },
      { step: 3, phase: 'Pace yourself', action: `Keep Life Support at ${POWER.eclssDayKW} kW in the day and ${NIGHT_MARS} kW at night. Do science on sunny days when the battery is above 60%.`, proTip: 'Only use 2× or 4× speed when everything is in the green.' },
      { step: 4, ...DECISION_STEP }
    ],
    criticalRules: ['Mission Control cannot answer during solar conjunction.', 'Air must end at 75% or more.'],
    nasaScienceFacts: [
      'About every two years the Sun sits between Earth and Mars and NASA pauses most commands to Mars for a couple of weeks (solar conjunction).',
      'Radio takes about 3 to 22 minutes to travel between Mars and Earth, even on a normal day.'
    ],
    suggestedAllocations: { eclss: 22, shields: 0, greenhouse: 10, scienceLab: 12, commsRover: 0, notes: 'Comms off: nobody can hear you anyway!' }
  },

  sandbox: {
    missionId: 'sandbox',
    title: 'Sandbox Outpost',
    location: 'moon',
    difficulty: 'Open play',
    summary: 'No goals and no time limit. Fly with the jetpack, drive the rover, and test what happens when you push the base to its limits.',
    primaryObjectives: ['Try switching life support off. What happens to the air?', 'Drive the rover around the outpost', 'Compare the Moon and Mars'],
    stepByStepWalkthrough: [
      { step: 1, phase: 'Fly', action: 'Press Space to jump in low gravity. Hold Shift to fire the jetpack.', proTip: 'Releasing Shift slowly refills jetpack fuel.' },
      { step: 2, phase: 'Drive', action: 'Walk to the rover and press E to board. Drive with W A S D. Press E again to get out.', proTip: 'Try the Helmet cam while driving.' },
      { step: 3, phase: 'Experiment', action: 'Open Power and Systems and try extreme settings. Watch the meters.', proTip: 'Invite friends with a crew code to experiment together.' }
    ],
    criticalRules: ['Space = jump, Shift = jetpack, E = rover.', 'Have fun!'],
    nasaScienceFacts: ['Real mission planners test ideas in simulators before trying them on a real mission, just like this sandbox.'],
    suggestedAllocations: { eclss: 22, shields: 0, greenhouse: 10, scienceLab: 15, commsRover: 3, notes: 'Normal setup.' }
  }
};
