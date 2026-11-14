// Pilot accounts + mission progress, stored on this device (localStorage).
// There is no server: a classroom Chromebook can hold several pilots, each with
// their own avatar and unlocked missions. Every storage access is guarded so the
// game still runs (without persistence) in private windows or locked-down browsers.

import { MISSION_CAMPAIGNS } from '../utils/nasaData';
import type { AgeGroup, MissionResult, PilotProfile } from './types';

const PILOTS_KEY = 'outpost-commander.pilots.v1';
const ACTIVE_KEY = 'outpost-commander.active-pilot.v1';

export const MISSION_ORDER: string[] = MISSION_CAMPAIGNS.map((m) => m.id);
export const SANDBOX_ID = 'sandbox';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable — progress lasts for this session only.
  }
}

export function loadPilots(): PilotProfile[] {
  const list = read<PilotProfile[]>(PILOTS_KEY, []);
  // Older builds stored a real name; strip it when loading.
  return Array.isArray(list) ? list.filter((p) => p && typeof p === 'object' && typeof p.id === 'string').map(({ fullName: _drop, ...p }: PilotProfile & { fullName?: string }) => p) : [];
}

export function loadActivePilot(): PilotProfile | null {
  const id = read<string | null>(ACTIVE_KEY, null);
  return loadPilots().find((p) => p.id === id) ?? null;
}

export function setActivePilot(id: string | null): void {
  write(ACTIVE_KEY, id);
}

export function savePilot(pilot: PilotProfile): PilotProfile {
  const pilots = loadPilots();
  const idx = pilots.findIndex((p) => p.id === pilot.id);
  if (idx >= 0) pilots[idx] = pilot;
  else pilots.push(pilot);
  write(PILOTS_KEY, pilots);
  return pilot;
}

export function deletePilot(id: string): void {
  write(PILOTS_KEY, loadPilots().filter((p) => p.id !== id));
  if (read<string | null>(ACTIVE_KEY, null) === id) setActivePilot(null);
}

export function callsignTaken(callsign: string): boolean {
  const c = callsign.trim().toLowerCase();
  return loadPilots().some((p) => p.callsign.toLowerCase() === c);
}

/** Only a made-up callsign is stored: no real names, no accounts (players are children). */
export function createPilot(callsign: string, ageGroup: AgeGroup): PilotProfile {
  const pilot: PilotProfile = {
    id: `pilot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    callsign: callsign.trim(),
    ageGroup,
    avatarId: null,
    accentOverride: null,
    createdAt: new Date().toISOString(),
    completed: {}
  };
  savePilot(pilot);
  setActivePilot(pilot.id);
  return pilot;
}

/** Mission N unlocks only once mission N-1 is complete. Sandbox unlocks after the full campaign. */
export function isMissionUnlocked(pilot: PilotProfile, missionId: string): boolean {
  if (missionId === SANDBOX_ID) return MISSION_ORDER.every((id) => pilot.completed[id]);
  const idx = MISSION_ORDER.indexOf(missionId);
  if (idx <= 0) return idx === 0;
  return Boolean(pilot.completed[MISSION_ORDER[idx - 1]]);
}

export function nextMissionId(missionId: string): string | null {
  const idx = MISSION_ORDER.indexOf(missionId);
  if (idx < 0) return null;
  return idx + 1 < MISSION_ORDER.length ? MISSION_ORDER[idx + 1] : SANDBOX_ID;
}

export function recordMissionComplete(pilot: PilotProfile, missionId: string, result: Omit<MissionResult, 'completedAt'>): PilotProfile {
  const prev = pilot.completed[missionId];
  const merged: MissionResult = {
    bestScore: Math.max(prev?.bestScore ?? 0, result.bestScore),
    sols: result.sols,
    badges: Array.from(new Set([...(prev?.badges ?? []), ...result.badges])),
    completedAt: prev?.completedAt ?? new Date().toISOString()
  };
  return savePilot({ ...pilot, completed: { ...pilot.completed, [missionId]: merged } });
}

export function allBadges(pilot: PilotProfile): string[] {
  return Array.from(new Set(Object.values(pilot.completed).flatMap((r) => r.badges)));
}
