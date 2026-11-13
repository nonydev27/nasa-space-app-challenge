import type { AvatarConfig } from './types';

export const AVATARS: AvatarConfig[] = [
  {
    id: 'nova',
    name: 'Nova',
    role: 'Mission Commander',
    bio: 'Calm under pressure. Nova makes the final call when power and lives are on the line.',
    suit: '#eef0f2',
    accent: '#1f5fd1',
    visor: '#d9a441',
    skin: '#8d5a3b'
  },
  {
    id: 'orion',
    name: 'Orion',
    role: 'Power Systems Engineer',
    bio: 'Knows every solar cell and battery on the base. Wears Artemis launch orange.',
    suit: '#f1efe9',
    accent: '#f26a1b',
    visor: '#c9cfd6',
    skin: '#e0b48f'
  },
  {
    id: 'luna',
    name: 'Luna',
    role: 'Planetary Scientist',
    bio: 'Collects regolith and ice samples. First to volunteer for rover EVAs.',
    suit: '#eceff0',
    accent: '#11b5a4',
    visor: '#5d8fc9',
    skin: '#c68863'
  },
  {
    id: 'kepler',
    name: 'Kepler',
    role: 'Lander Pilot',
    bio: 'Flew the descent onto the crater rim. Always watching the comms dish.',
    suit: '#f0eeeb',
    accent: '#d7263d',
    visor: '#d9a441',
    skin: '#f1c9a5'
  },
  {
    id: 'vega',
    name: 'Vega',
    role: 'Astro-Botanist',
    bio: 'Grows food in alien soil, using real NASA OSDR plant experiments.',
    suit: '#edf0ea',
    accent: '#3fa34d',
    visor: '#9fb7a0',
    skin: '#6b4430'
  },
  {
    id: 'sol',
    name: 'Sol',
    role: 'Flight Surgeon',
    bio: 'Tracks every millisievert of radiation and keeps the crew healthy.',
    suit: '#efedf2',
    accent: '#8b5cf6',
    visor: '#b9a3e3',
    skin: '#a8714f'
  },

  {
    id: 'nonydev',
    name: 'Nonydev',
    role: 'Mission Specialist',
    bio: 'A skilled engineer and problem solver, Nonydev is always ready to tackle any challenge that comes their way.',
    suit: '#f5f5f5',
    accent: '#f2c12e',
    visor: '#d9a441',
    skin: '#c69c7b'
  }
];

export const ACCENT_SWATCHES = ['#1f5fd1', '#f26a1b', '#11b5a4', '#d7263d', '#3fa34d', '#8b5cf6', '#f2c12e', '#e64fa6'];

export const CREW_NPC: AvatarConfig = {
  id: 'npc',
  name: 'Crew',
  role: 'Crew',
  bio: '',
  suit: '#e9e9e6',
  accent: '#7c8794',
  visor: '#d9a441',
  skin: '#c69c7b'
};

export function findAvatar(id: string | null | undefined, accentOverride?: string | null): AvatarConfig {
  const base = AVATARS.find((a) => a.id === id) ?? AVATARS[0];
  return accentOverride ? { ...base, accent: accentOverride } : base;
}
