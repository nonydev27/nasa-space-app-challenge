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

export const MISSION_GUIDELINES: Record<string, MissionGuideline> = {
  'mission-1': {
    missionId: 'mission-1',
    title: 'Mission 1: Lunar Dawn (Artemis Base)',
    location: 'moon',
    difficulty: 'Cadet Friendly',
    summary: 'A beginner-friendly introduction to lunar survival. Learn to balance solar power during the day, conserve battery reserves across the freezing lunar night, and board the Lunar Rover for field surveys.',
    primaryObjectives: [
      'Survive for 3 Sols (Lunar Days)',
      'Keep Oxygen levels above 60%',
      'Keep Battery reserve above 15% during night',
      'Maintain food stockpile above 2 Sols',
      'Board the Lunar Rover ([E] key or tap) and conduct an EVA survey'
    ],
    stepByStepWalkthrough: [
      {
        step: 1,
        phase: 'Dawn (Daylight)',
        action: 'Look at the top bar cycle icon. While the Sun is up (Daylight), your solar panels generate peak power (~100-120 kW). Open the Power drawer and ensure ECLSS has at least 28 kW and Science Lab has 15 kW.',
        proTip: 'Surplus solar power automatically charges your battery buffer up to 100% before sunset.'
      },
      {
        step: 2,
        phase: 'Field Expedition',
        action: 'Walk or jetpack toward the Lunar Rover docked near (10, 10). When near, press [E] or click "Board Rover" to hop in. Use W/A/S/D to drive across the lunar terrain and survey Shackleton crater!',
        proTip: 'Driving the rover or toggling EVA in the dock multiplies science point accumulation from 0.5 to 1.8 points per hour.'
      },
      {
        step: 3,
        phase: 'Sunset & Freezing Night',
        action: 'When the Moon clock reaches night, solar generation drops to 0 kW! The base heaters need +15 kW extra. Lower Science Lab to 5 kW or 0 kW to stop battery drainage.',
        proTip: 'Your RTG baseload provides ~40 kW continually, keeping life support running if you throttle non-essentials.'
      },
      {
        step: 4,
        phase: 'Time Warp to Victory',
        action: 'Use the 5× or 20× time warp buttons to safely advance through Sol 3 while keeping vitals in the green.',
        proTip: 'If battery falls below 20%, pause immediately and cut greenhouse lights and comms until dawn.'
      }
    ],
    criticalRules: [
      'Shift is your thruster fuel burn; Spacebar is your low-gravity jump.',
      'Never leave Science Lab at maximum power during lunar night.',
      'Life support (ECLSS) needs at least 28 kW during day and 43 kW during night.'
    ],
    nasaScienceFacts: [
      'NASA Artemis III targets the Lunar South Pole where crater rims experience near-permanent sunlight ("peaks of eternal light") while deep craters harbor water ice.',
      'Lunar surface temperatures swing by more than 260°C between day (+120°C) and night (-140°C).'
    ],
    suggestedAllocations: {
      eclss: 30,
      shields: 0,
      greenhouse: 16,
      scienceLab: 15,
      commsRover: 15,
      notes: 'Daytime configuration. At night, drop Science Lab to 0 kW and increase ECLSS to 45 kW.'
    }
  },

  'mission-2': {
    missionId: 'mission-2',
    title: 'Mission 2: Martian Dust Horizon',
    location: 'mars',
    difficulty: 'Intermediate',
    summary: 'A massive atmospheric dust storm sweeps Jezero Crater. Solar panels lose 80% efficiency. You must rely on the nuclear RTG baseload and manage scarce water.',
    primaryObjectives: [
      'Survive 6 Martian Sols',
      'Rely on the 40 kW RTG nuclear baseload',
      'Maintain Oxygen above 65% and Crew Health above 70%',
      'Accumulate 120 Science Points despite dust blackout'
    ],
    stepByStepWalkthrough: [
      {
        step: 1,
        phase: 'Dust Storm Influx',
        action: 'As soon as the mission starts, note the active dust storm warning. Solar output is choked to under 25 kW. Immediately open the Power Matrix.',
        proTip: 'The MMRTG (Multi-Mission Radioisotope Thermoelectric Generator) generates heat and electricity from plutonium decay, unaffected by dust.'
      },
      {
        step: 2,
        phase: 'Power Triage',
        action: 'Drop Science Lab to 10 kW and Comms to 10 kW. Keep ECLSS locked at 28 kW. Do NOT turn on the magnetic shield deflector—dust storms do not carry solar protons.',
        proTip: 'Leaving the deflector on costs 45 kW and will instantly trigger a blackout.'
      },
      {
        step: 3,
        phase: 'Hydroponic Management',
        action: 'Open the Systems drawer. Keep crop lighting at standby. If water reserves fall below 35%, turn on Water Rationing in the dock or Systems deck.',
        proTip: 'Water rationing slightly decreases crew morale but preserves hydration for the wheat and potatoes.'
      },
      {
        step: 4,
        phase: 'Dust Clearing',
        action: 'During brief daylight clearing intervals, spin up the Science Lab to 20 kW to reach the 120-point milestone before Sol 6 ends.',
        proTip: 'Keep the rover docked during high dust gusts so telemetry isn’t lost in the storm.'
      }
    ],
    criticalRules: [
      'Never activate the Magnetic Deflector during a dust storm; it wastes 45 kW.',
      'Ensure RTG output is always fully prioritized to ECLSS first.',
      'Harvest crops as soon as growth progress reaches 70% to refresh dry rations.'
    ],
    nasaScienceFacts: [
      'NASA Opportunity rover ceased operations in 2018 when a planet-encircling dust storm blocked all sunlight from its solar arrays.',
      'NASA Perseverance uses a 110 W plutonium RTG specifically so it can operate through dust storms and cold winter seasons.'
    ],
    suggestedAllocations: {
      eclss: 28,
      shields: 0,
      greenhouse: 16,
      scienceLab: 10,
      commsRover: 10,
      notes: 'Total load 64 kW, powered by RTG (40 kW) + degraded solar (24 kW).'
    }
  },

  'mission-3': {
    missionId: 'mission-3',
    title: 'Mission 3: DONKI Solar Storm Alert',
    location: 'moon',
    difficulty: 'Advanced Flight Director',
    summary: 'NASA DONKI space weather detectors issue a Class-X Coronal Mass Ejection alert. You have 90 seconds to activate magnetic shielding and seal the crew in the underground regolith bunker.',
    primaryObjectives: [
      'Respond to DONKI Alert before the countdown reaches zero',
      'Seal crew in the Underground Regolith Bunker',
      'Engage Magnetic Deflector Shield (-45 kW)',
      'Protect crew from lethal proton radiation dosage',
      'Survive 6 Sols with crew health above 80%'
    ],
    stepByStepWalkthrough: [
      {
        step: 1,
        phase: 'CME Warning Siren',
        action: 'When the DONKI alert banner flashes red with the countdown, immediately press the "Bunker" button in the dock or on the alert banner.',
        proTip: 'The 2.5 meters of lunar regolith above the bunker absorbs over 90% of energetic solar protons.'
      },
      {
        step: 2,
        phase: 'Active Deflector Activation',
        action: 'Tap the "Deflector" button in the dock. The magnetic coil deflector requires 45 kW of power. Open Power Matrix and throttle Science to zero.',
        proTip: 'The deflector deflects charged particles away from surface modules like the greenhouse and solar linkages.'
      },
      {
        step: 3,
        phase: 'Storm Duration',
        action: 'Monitor the Telemetry Log. Keep the crew sheltered until the DONKI "All-Clear" message is received. Do not send anyone outside on EVA.',
        proTip: 'Walking outside during an active solar particle event inflicts severe radiation damage to crew health.'
      },
      {
        step: 4,
        phase: 'Post-Storm Recovery',
        action: 'Once the all-clear is logged, deactivate the magnetic deflector to restore battery power, unseal the bunker, and resume crop harvesting.',
        proTip: 'Check crew vitals. If health took a small hit, keep morale high with ample food rations.'
      }
    ],
    criticalRules: [
      'Crew MUST be in the bunker before the countdown hits 0 seconds.',
      'Deflector requires 45 kW continuous draw—cut science lab to balance the grid.',
      'Do not disembark or recall the bunker lockdown until all-clear is signaled.'
    ],
    nasaScienceFacts: [
      'NASA DONKI (Space Weather Database of Notifications, Knowledge, Information) monitors Coronal Mass Ejections (CMEs) from spacecraft like SOHO and STEREO.',
      'Lunar regolith is rich in basalt and anorthosite, making it an excellent radiation barrier when placed 2 to 3 meters deep.'
    ],
    suggestedAllocations: {
      eclss: 28,
      shields: 45,
      greenhouse: 10,
      scienceLab: 0,
      commsRover: 10,
      notes: 'Emergency Storm Grid: 93 kW total load. Battery handles any deficit until storm passes.'
    }
  },

  'mission-4': {
    missionId: 'mission-4',
    title: 'Mission 4: Greenhouse Crisis (OSDR Space Biology)',
    location: 'mars',
    difficulty: 'Intermediate',
    summary: 'A plumbing failure contaminates part of the food stores. Using NASA Open Science Data Repository (OSDR) plant biology findings, optimize hydroponics under strict water rationing.',
    primaryObjectives: [
      'Overcome contaminated food stockpile emergency',
      'Activate High-Yield Crop Cycle to accelerate microgreens',
      'Enable Water Rationing to conserve moisture',
      'Harvest 2 or more complete crop cycles',
      'Survive 7 Sols with food stockpile ≥ 6 Sols'
    ],
    stepByStepWalkthrough: [
      {
        step: 1,
        phase: 'Triage Food Crisis',
        action: 'Food stockpile starts at only 3 Sols! Immediately open the Systems deck and inspect the Hydroponics tab.',
        proTip: 'Standard crop cycles take too long; you must switch to rapid-cycle microgreens.'
      },
      {
        step: 2,
        phase: 'Engage Fast Crop Cycle',
        action: 'Toggle "High-Yield Crop Cycle" in the Systems deck. This boosts daily growth by +40% but increases greenhouse power to 28 kW.',
        proTip: 'Allocate at least 28 kW to the Greenhouse module in the Power Matrix to keep photosynthetic lamps burning.'
      },
      {
        step: 3,
        phase: 'Enable Water Rationing',
        action: 'Click the "Ration" button in the dock. Water usage drops from 18 L/sol down to 8 L/sol.',
        proTip: 'OSDR research proved that targeted root-zone misting reduces transpiration loss by 64%.'
      },
      {
        step: 4,
        phase: 'Harvest & Replenish',
        action: 'Watch crop growth in the vitals panel. The moment it reaches 70%, the "Harvest" button turns green. Click it immediately to gain +2 Sols of food!',
        proTip: 'Harvest twice during the mission to safely surpass the 6-Sol food objective.'
      }
    ],
    criticalRules: [
      'Keep Greenhouse power at 28 kW or higher; lower power halts growth.',
      'Harvest as soon as progress hits 70%—do not let crops sit unharvested.',
      'Maintain Water Rationing until water reserve is safely over 60%.'
    ],
    nasaScienceFacts: [
      'NASA OSDR (Open Science Data Repository) includes genomic data from the Veggie and Advanced Plant Habitat facilities on the ISS.',
      'Crops in space suffer elevated stress from cosmic rays and microgravity; supplemental red-blue LED spectra improve resilience.'
    ],
    suggestedAllocations: {
      eclss: 28,
      shields: 0,
      greenhouse: 28,
      scienceLab: 15,
      commsRover: 10,
      notes: 'High-yield farming profile: 81 kW load easily supported by solar arrays.'
    }
  },

  'mission-5': {
    missionId: 'mission-5',
    title: 'Mission 5: Deep Space Latency Crisis',
    location: 'mars',
    difficulty: 'Flight Director Elite',
    summary: 'Earth and Mars are in Solar Conjunction, causing an 18-minute communication roundtrip lag. When an ECLSS air scrubber failure occurs, you cannot wait for Houston; you must solve it locally.',
    primaryObjectives: [
      'Solve ECLSS failure autonomously with 18-minute comms delay',
      'Keep CO2 level below 1,000 ppm and Oxygen above 80%',
      'Reroute emergency power to secondary life support loops',
      'Collect 220 Science Points via independent Rover EVA',
      'Survive 8 Martian Sols'
    ],
    stepByStepWalkthrough: [
      {
        step: 1,
        phase: 'Conjunction Comms Delay',
        action: 'Earth Mission Control messages take 18 minutes to arrive. Look at the Comms readout. You must make all critical decisions autonomously.',
        proTip: 'Do not wait for Earth confirmation before taking emergency measures.'
      },
      {
        step: 2,
        phase: 'ECLSS Scrubber Failure',
        action: 'When cabin CO2 ppm begins climbing toward red, open Power Matrix immediately. Boost ECLSS allocation to 45 kW to force backup chemical scrubbers into operation.',
        proTip: 'High-pressure CO2 scrubbers require extra power but rapidly restore breathable air.'
      },
      {
        step: 3,
        phase: 'Rover EVA Science Sprint',
        action: 'Board the Rover ([E] key) or toggle EVA from the dock during the sunny afternoon hours. Drive to high-elevation rock outcrops to gather maximum sample points.',
        proTip: 'Rover science yields +1.8 science pts/hour while active, crucial for hitting the 220-point target.'
      },
      {
        step: 4,
        phase: 'Long-term Sol Endurance',
        action: 'Balance nighttime battery usage so morning arrives with at least 35% battery remaining. Pace time warps carefully through Sol 8.',
        proTip: 'Check AstroBot for autonomous diagnostics if unexpected anomalies arise.'
      }
    ],
    criticalRules: [
      'Never allow CO2 to exceed 1,500 ppm; crew health rapidly deteriorates.',
      'Boost ECLSS to 45 kW immediately upon any scrubber alert.',
      'Deploy the rover on EVA during daylight to ensure the 220 science quota is achieved.'
    ],
    nasaScienceFacts: [
      'During Mars Solar Conjunction, the Sun stands between Earth and Mars, ionizing radio waves and preventing safe communication for up to two weeks.',
      'Crewed Mars missions will require autonomous diagnostic systems with on-board edge AI, since Houston can never provide real-time assistance.'
    ],
    suggestedAllocations: {
      eclss: 45,
      shields: 0,
      greenhouse: 18,
      scienceLab: 20,
      commsRover: 15,
      notes: 'Autonomous high-capacity profile: 98 kW total load.'
    }
  },

  'sandbox': {
    missionId: 'sandbox',
    title: 'Sandbox Outpost Exploration',
    location: 'moon',
    difficulty: 'Open Sandbox',
    summary: 'A completely unrestricted playground on either the Moon or Mars. Fly freely with the jetpack, drive the rover all across the outpost terrain, trigger simulated alerts, and test extreme grid allocations.',
    primaryObjectives: [
      'Test your astronaut piloting skills with low-gravity jumps and jetpack thrust',
      'Board and freely steer the Lunar / Martian Rover',
      'Switch planetary environments between Lunar Shackleton and Martian Jezero',
      'Experiment with maximum power overloads and crop hydroponics'
    ],
    stepByStepWalkthrough: [
      {
        step: 1,
        phase: 'Free Flight & Mobility',
        action: 'Press Space to jump in 1/6th gravity (Moon) or 3/8th gravity (Mars). Hold Shift to fire your hydrazine jetpack thrusters and soar high above the outpost modules!',
        proTip: 'Watch the fuel gauge at the bottom center. Releasing Shift gently recharges your jetpack fuel.'
      },
      {
        step: 2,
        phase: 'Rover Driving',
        action: 'Walk over to the Rover, press [E] to board, and drive anywhere using W/A/S/D. Press [E] again when you wish to exit.',
        proTip: 'You can switch camera views to Orbit, Follow, or Helmet Cam while driving.'
      },
      {
        step: 3,
        phase: 'Subsystem Stress Testing',
        action: 'Open the Power and Systems drawers to deliberately simulate nightfall, dust storms, or radiation events and observe how the outpost reacts.',
        proTip: 'Invite a crewmate via multiplayer crew code to explore the outpost together!'
      }
    ],
    criticalRules: [
      'Spacebar = Jump only; Shift = Jetpack thrust only.',
      'Press [E] or click near the vehicle to board or exit the rover.',
      'Explore and have fun!'
    ],
    nasaScienceFacts: [
      'Human exploration of the Moon and Mars relies on open data from NASA missions like LRO, DONKI, OSDR, and the Deep Space Network.',
      'NASA Space Apps Challenge 2026 inspires the next generation of engineers, scientists, and astronauts.'
    ],
    suggestedAllocations: {
      eclss: 30,
      shields: 0,
      greenhouse: 20,
      scienceLab: 20,
      commsRover: 15,
      notes: 'Nominal sandbox baseline.'
    }
  }
};
