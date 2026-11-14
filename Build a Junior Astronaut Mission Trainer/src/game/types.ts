// Shared types for the immersive storytelling layer of AstroLab.

export type AgeGroup = 'cadet' | 'director';
export type Location = 'moon' | 'mars';

export interface AvatarConfig {
  id: string;
  name: string;
  role: string;
  bio: string;
  /** Main suit fabric colour */
  suit: string;
  /** Stripes, shoulder patches, chest control box */
  accent: string;
  /** Helmet visor tint */
  visor: string;
  skin: string;
}

export interface MissionResult {
  bestScore: number;  
  sols: number;
  badges: string[];
  completedAt: string;
}

export interface PilotProfile {
  id: string;
  callsign: string;
  ageGroup: AgeGroup;
  avatarId: string | null;
  /** Player-picked accent colour override for the chosen avatar */
  accentOverride: string | null;
  createdAt: string;
  completed: Record<string, MissionResult>;
}

export type ShotId =
  | 'establishing'
  | 'sky'
  | 'habitat'
  | 'greenhouse'
  | 'power'
  | 'rover'
  | 'bunker'
  | 'comms'
  | 'avatar'
  | 'helmet'
  | 'overview';

/** Visual overrides a story beat can force on the 3D scene. */
export interface SceneEffects {
  flare?: boolean;
  dust?: boolean;
  shield?: boolean;
  bunker?: boolean;
  eva?: boolean;
  /** Force the time of day (0–24) while the beat plays */
  hour?: number;
}

export interface DataCallout {
  label: string;
  value: string;
  source: string;
  live?: boolean;
}

export interface StoryBeat {
  shot: ShotId;
  kicker: string;
  text: string;
  data?: DataCallout[];
  effects?: SceneEffects;
}

/** Flat, render-only snapshot of the simulation that the 3D scene consumes. */
export interface SceneViewState {
  location: Location;
  hour: number;
  dust: boolean;
  dustTau: number;
  flare: boolean;
  shield: boolean;
  bunker: boolean;
  eva: boolean;
  solarKW: number;
  rtgKW: number;
  batteryPct: number;
  oxygen: number;
  cropGrowth: number;
  cropHealth: number;
  greenhouseKW: number;
  crewHealth: number;
}
