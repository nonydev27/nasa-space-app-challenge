// AstroLab soundtrack: original, procedural (Web Audio), no audio files.
//
// A tiny step sequencer plays layered tracks (pad, bass, arpeggio, lead, soft
// percussion). Each mission has its own mood; a tense "storm" track cuts in during
// solar-storm alerts; short stingers play for victory and defeat. Tracks crossfade.

import { soundFx } from './soundEffects';

export type TrackId = 'title' | 'map' | 'lunar-dawn' | 'mars-dust' | 'solar-storm' | 'greenhouse' | 'conjunction' | 'sandbox' | 'storm' | 'debrief';

interface Track {
  bpm: number;
  /** MIDI note of the key centre */
  root: number;
  /** chords as semitone offsets from root, one per bar */
  chords: number[][];
  /** arpeggio: index into the chord (−1 = rest), 16 steps per bar */
  arp?: number[];
  arpWave?: OscillatorType;
  arpOctave?: number;
  /** bass: semitone offset from chord root per 16th (null = rest) */
  bass?: Array<number | null>;
  /** lead melody: [step, semitones from root, length in steps], loops every bar count */
  lead?: Array<[number, number, number]>;
  hats?: boolean;
  kick?: boolean;
  padCutoff?: number;
  volume?: number;
}

const _ = -1;
const TRACKS: Record<TrackId, Track> = {
  // Hopeful, wide open: launch-day feeling
  title: {
    bpm: 92, root: 50, chords: [[0, 4, 7, 11], [5, 9, 12, 16], [9, 12, 16, 19], [7, 11, 14, 17]],
    arp: [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 2, 3, 2], arpWave: 'triangle', arpOctave: 12,
    bass: [0, null, null, null, null, null, 0, null, null, null, 7, null, null, null, null, null],
    lead: [[0, 16, 4], [4, 19, 4], [8, 21, 6], [16, 19, 4], [20, 16, 4], [24, 14, 8], [32, 16, 4], [36, 21, 4], [40, 23, 6], [48, 21, 4], [52, 19, 4], [56, 16, 8]],
    padCutoff: 1800
  },
  // Calm planning music for the mission map and the debrief
  map: {
    bpm: 78, root: 48, chords: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]],
    arp: [0, _, 2, _, 1, _, 3, _, 0, _, 2, _, 1, _, 3, _], arpWave: 'sine', arpOctave: 24,
    bass: [0, null, null, null, null, null, null, null, 0, null, null, null, null, null, null, null],
    padCutoff: 1200, volume: 0.85
  },
  debrief: {
    bpm: 72, root: 53, chords: [[0, 4, 7, 14], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]],
    arp: [0, _, _, 2, _, _, 1, _, 3, _, _, 2, _, _, 1, _], arpWave: 'sine', arpOctave: 24,
    bass: [0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    padCutoff: 1400, volume: 0.85
  },
  // Mission 1: quiet, shimmering lunar morning with a cold edge
  'lunar-dawn': {
    bpm: 70, root: 50, chords: [[0, 3, 7, 14], [-2, 2, 5, 9], [-4, 0, 3, 7], [-5, -1, 2, 7]],
    arp: [0, _, 1, _, 2, _, 3, _, 2, _, 1, _, 3, _, 2, _], arpWave: 'sine', arpOctave: 24,
    bass: [0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    lead: [[8, 26, 6], [24, 24, 6], [40, 22, 6], [56, 19, 8]],
    padCutoff: 900
  },
  // Mission 2: low, gritty, wind-like — the storm outside
  'mars-dust': {
    bpm: 76, root: 45, chords: [[0, 3, 7, 10], [0, 3, 7, 10], [-2, 2, 5, 9], [-4, 0, 3, 7]],
    arp: [0, 0, _, 1, _, 0, 2, _, 0, _, 1, _, 3, _, 2, _], arpWave: 'square', arpOctave: 12,
    bass: [0, null, null, 0, null, null, 0, null, 0, null, null, 0, null, null, 3, null],
    kick: true, padCutoff: 600, volume: 0.9
  },
  // Mission 3: alert, determined
  'solar-storm': {
    bpm: 96, root: 52, chords: [[0, 3, 7, 10], [-4, 0, 3, 7], [-2, 2, 5, 9], [-5, -1, 2, 7]],
    arp: [0, 1, 2, 1, 0, 1, 2, 3, 0, 1, 2, 1, 0, 2, 3, 2], arpWave: 'triangle', arpOctave: 12,
    bass: [0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 7, null],
    hats: true, padCutoff: 1100
  },
  // Mission 4: warm, bouncy, growing things
  greenhouse: {
    bpm: 100, root: 55, chords: [[0, 4, 7, 9], [5, 9, 12, 14], [-3, 0, 4, 7], [7, 11, 14, 17]],
    arp: [0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 2, 1, 0, _], arpWave: 'triangle', arpOctave: 12,
    bass: [0, null, null, 7, null, null, 0, null, 0, null, null, 7, null, 5, null, null],
    lead: [[0, 12, 2], [2, 14, 2], [4, 16, 4], [12, 14, 4], [16, 17, 2], [18, 16, 2], [20, 14, 4], [28, 12, 4]],
    hats: true, padCutoff: 2000
  },
  // Mission 5: lonely and thoughtful — nobody can hear you
  conjunction: {
    bpm: 64, root: 47, chords: [[0, 3, 7, 14], [-4, 0, 3, 10], [-7, -3, 0, 7], [-5, -2, 2, 9]],
    arp: [0, _, _, _, 2, _, _, _, 3, _, _, _, 1, _, _, _], arpWave: 'sine', arpOctave: 24,
    bass: [0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    lead: [[4, 22, 10], [36, 19, 10]],
    padCutoff: 700, volume: 0.9
  },
  sandbox: {
    bpm: 84, root: 52, chords: [[0, 4, 7, 11], [2, 5, 9, 12], [4, 7, 11, 14], [5, 9, 12, 16]],
    arp: [0, 1, 2, _, 3, _, 2, 1, 0, 1, 2, _, 3, _, 1, _], arpWave: 'triangle', arpOctave: 12,
    bass: [0, null, null, null, 0, null, null, null, 0, null, null, null, 0, null, null, null],
    padCutoff: 1500
  },
  // Alarm: driving, urgent, plays while a solar-storm countdown is running
  storm: {
    bpm: 132, root: 52, chords: [[0, 3, 7], [0, 3, 8], [-2, 3, 7], [-1, 2, 7]],
    arp: [0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2], arpWave: 'sawtooth', arpOctave: 12,
    bass: [0, 0, null, 0, 0, null, 0, 0, 0, 0, null, 0, 0, null, 3, 0],
    kick: true, hats: true, padCutoff: 900, volume: 0.8
  }
};

const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const BASE_VOLUME = 0.05;
const ENABLED_KEY = 'astrolab.music.enabled';

class MusicPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: GainNode | null = null;
  private current: TrackId | null = null;
  private wanted: TrackId | null = null;
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;
  private enabled = true;
  private noise: AudioBuffer | null = null;

  constructor() {
    try {
      this.enabled = window.localStorage.getItem(ENABLED_KEY) !== '0';
    } catch {
      /* storage blocked: default on */
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    try {
      window.localStorage.setItem(ENABLED_KEY, this.enabled ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (this.enabled && this.wanted) this.play(this.wanted);
    else this.stop();
    return this.enabled;
  }

  /** Follow the sound-effects mute button. */
  syncMute(): void {
    if (!this.master || !this.ctx) return;
    this.master.gain.setTargetAtTime(soundFx.isMuted() ? 0 : BASE_VOLUME, this.ctx.currentTime, 0.15);
  }

  /** Switch to a track (crossfade). Needs one user gesture first (browser autoplay rules). */
  play(id: TrackId): void {
    this.wanted = id;
    if (!this.enabled) return;
    soundFx.init();
    const ctx = (soundFx as unknown as { audioCtx: AudioContext | null }).audioCtx;
    if (!ctx) return;
    if (this.ctx !== ctx) {
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = soundFx.isMuted() ? 0 : BASE_VOLUME;
      this.master.connect(ctx.destination);
    }
    if (this.current === id && this.timer !== null) return;
    this.fadeOutBus(0.8);
    this.bus = ctx.createGain();
    this.bus.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.bus.gain.exponentialRampToValueAtTime(TRACKS[id].volume ?? 1, ctx.currentTime + 1.2);
    this.bus.connect(this.master!);
    this.current = id;
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.08;
    if (this.timer === null) this.timer = window.setInterval(this.schedule, 60);
  }

  stop(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.fadeOutBus(0.5);
    this.current = null;
  }

  /** One-shot jingle; the current track ducks underneath. */
  stinger(kind: 'victory' | 'defeat'): void {
    if (!this.enabled || !this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + 0.05;
    const notes = kind === 'victory' ? [[60, 0], [64, 0.14], [67, 0.28], [72, 0.42], [76, 0.62], [79, 0.82]] : [[64, 0], [62, 0.3], [59, 0.6], [55, 0.95]];
    if (this.bus) {
      this.bus.gain.setTargetAtTime(0.25, t0, 0.1);
      this.bus.gain.setTargetAtTime(TRACKS[this.current ?? 'map'].volume ?? 1, t0 + 2.4, 0.6);
    }
    for (const [m, at] of notes) this.voice(midiHz(m), t0 + at, kind === 'victory' ? 0.5 : 0.7, 'triangle', 0.5, this.master);
    if (kind === 'victory') for (const m of [60, 64, 67, 72]) this.voice(midiHz(m), t0 + 0.82, 1.6, 'sine', 0.22, this.master);
  }

  private fadeOutBus(sec: number): void {
    if (!this.bus || !this.ctx) return;
    const old = this.bus;
    old.gain.cancelScheduledValues(this.ctx.currentTime);
    old.gain.setTargetAtTime(0.0001, this.ctx.currentTime, sec / 4);
    window.setTimeout(() => old.disconnect(), sec * 1000 + 600);
    this.bus = null;
  }

  private schedule = () => {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.current) return;
    const tr = TRACKS[this.current];
    const stepDur = 60 / tr.bpm / 4;
    while (this.nextTime < ctx.currentTime + 0.25) {
      this.playStep(tr, this.step, this.nextTime, stepDur);
      this.step += 1;
      this.nextTime += stepDur;
    }
  };

  private playStep(tr: Track, step: number, t: number, dur: number): void {
    const bus = this.bus!;
    const bar = Math.floor(step / 16) % tr.chords.length;
    const s = step % 16;
    const chord = tr.chords[bar];

    if (s === 0) {
      // pad: two detuned voices per chord tone through a low-pass, the whole bar long
      const len = dur * 16;
      for (const n of chord) {
        for (const det of [-6, 6]) this.voice(midiHz(tr.root + n), t, len, 'sawtooth', 0.05, bus, tr.padCutoff ?? 1200, det);
      }
    }
    if (tr.bass && tr.bass[s] !== null && tr.bass[s] !== undefined) {
      this.voice(midiHz(tr.root - 12 + chord[0] + (tr.bass[s] as number)), t, dur * 1.8, 'triangle', 0.32, bus, 700);
    }
    if (tr.arp && tr.arp[s] >= 0) {
      const n = chord[tr.arp[s] % chord.length];
      this.voice(midiHz(tr.root + n + (tr.arpOctave ?? 12)), t, dur * 1.6, tr.arpWave ?? 'triangle', tr.arpWave === 'sawtooth' || tr.arpWave === 'square' ? 0.05 : 0.11, bus, 3000);
    }
    if (tr.lead) {
      const loop = tr.chords.length * 16;
      for (const [at, semi, len] of tr.lead) if (at === step % loop) this.voice(midiHz(tr.root + semi), t, dur * len, 'sine', 0.16, bus, 0, 0, true);
    }
    if (tr.kick && s % 8 === 0) this.kick(t, bus);
    if (tr.hats && s % 2 === 1) this.hat(t, bus, s % 4 === 3 ? 0.05 : 0.025);
  }

  private voice(freq: number, t: number, len: number, wave: OscillatorType, gain: number, out: AudioNode, cutoff = 0, detune = 0, vibrato = false): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t);
    osc.detune.setValueAtTime(detune, t);
    const env = ctx.createGain();
    const attack = Math.min(0.4, len * 0.25);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(gain, t + attack);
    env.gain.setValueAtTime(gain, t + Math.max(attack, len - 0.25));
    env.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.1);
    let node: AudioNode = osc;
    if (cutoff > 0) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = cutoff;
      osc.connect(f);
      node = f;
    }
    if (vibrato) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 5;
      depth.gain.value = 6;
      lfo.connect(depth).connect(osc.detune);
      lfo.start(t);
      lfo.stop(t + len + 0.2);
    }
    node.connect(env).connect(out);
    osc.start(t);
    osc.stop(t + len + 0.2);
    osc.onended = () => env.disconnect();
  }

  private kick(t: number, out: AudioNode): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.18);
    env.gain.setValueAtTime(0.5, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.connect(env).connect(out);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  private hat(t: number, out: AudioNode, gain: number): void {
    const ctx = this.ctx!;
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    src.connect(f).connect(env).connect(out);
    src.start(t);
    src.stop(t + 0.08);
  }
}

export const music = new MusicPlayer();

/** Which soundtrack and 3D theme each mission uses. */
export const MISSION_THEME: Record<string, 'lunar-dawn' | 'mars-dust' | 'solar-storm' | 'greenhouse' | 'conjunction' | 'sandbox'> = {
  'mission-1': 'lunar-dawn',
  'mission-2': 'mars-dust',
  'mission-3': 'solar-storm',
  'mission-4': 'greenhouse',
  'mission-5': 'conjunction',
  sandbox: 'sandbox'
};
