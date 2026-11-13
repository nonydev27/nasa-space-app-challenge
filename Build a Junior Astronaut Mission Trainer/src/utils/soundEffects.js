// Web Audio API procedural sound synthesizer
// Provides rich auditory feedback without external audio files

class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.muted = false;
  }

  init() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.setThruster(false);
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  playTone(freq, type, duration, gainStart = 0.1, gainEnd = 0.001) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(gainStart, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(gainEnd, 0.0001), this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // AudioContext may be blocked before first interaction
    }
  }

  playClick() {
    this.playTone(800, 'sine', 0.05, 0.08);
  }

  playToggle(active = true) {
    if (active) {
      this.playTone(520, 'sine', 0.08, 0.1);
      setTimeout(() => this.playTone(780, 'sine', 0.1, 0.1), 60);
    } else {
      this.playTone(650, 'sine', 0.08, 0.1);
      setTimeout(() => this.playTone(390, 'sine', 0.1, 0.08), 60);
    }
  }

  playAlert() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.15);
      osc.frequency.linearRampToValueAtTime(440, now + 0.3);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  playShieldActivate() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {}
  }

  playSuccess() {
    if (this.muted) return;
    const notes = [440, 554.37, 659.25, 880]; // A major chord
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.25, 0.12);
      }, idx * 90);
    });
  }

  playEmergency() {
    this.playAlert();
    setTimeout(() => this.playAlert(), 350);
  }

  // ---------------------------------------------------------------- movement & fun
  noiseBuffer() {
    if (this._noise) return this._noise;
    const ctx = this.audioCtx;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this._noise = buf;
    return buf;
  }

  /** Filtered noise burst — the building block for whooshes, thuds and rumbles. */
  playNoise({ duration = 0.4, freq = 800, q = 0.8, gain = 0.15, sweepTo = null, type = 'bandpass' } = {}) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer();
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.setValueAtTime(freq, now);
      if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, now + duration);
      filter.Q.value = q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(gain, now + Math.min(0.08, duration / 4));
      g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      src.connect(filter);
      filter.connect(g);
      g.connect(ctx.destination);
      src.start(now);
      src.stop(now + duration + 0.05);
    } catch {
      /* audio unavailable */
    }
  }

  playJump() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const g = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.18);
      g.gain.setValueAtTime(0.09, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      osc.connect(g);
      g.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      /* audio unavailable */
    }
    this.playNoise({ duration: 0.18, freq: 500, gain: 0.05 });
  }

  playLand(strength = 1) {
    this.playNoise({ duration: 0.3, freq: 140, q: 0.6, gain: 0.12 * Math.min(1.5, strength), type: 'lowpass' });
  }

  /** Continuous jetpack hiss while `on`. */
  setThruster(on) {
    if (this.muted && on) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      if (on && !this._thruster) {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer();
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 900;
        filter.Q.value = 0.5;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.12);
        src.connect(filter);
        filter.connect(g);
        g.connect(ctx.destination);
        src.start();
        this._thruster = { src, g };
      } else if (!on && this._thruster) {
        const { src, g } = this._thruster;
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        src.stop(ctx.currentTime + 0.25);
        this._thruster = null;
      }
    } catch {
      /* audio unavailable */
    }
  }

  playWarp() {
    this.playNoise({ duration: 1.6, freq: 200, sweepTo: 6000, q: 1.2, gain: 0.18 });
    this.playTone(110, 'sawtooth', 1.4, 0.05);
  }

  playCountdownBeep(final = false) {
    this.playTone(final ? 1320 : 880, 'square', final ? 0.5 : 0.15, 0.07);
  }

  playLiftoff() {
    this.playNoise({ duration: 3.2, freq: 90, q: 0.4, gain: 0.35, type: 'lowpass' });
    this.playNoise({ duration: 2.4, freq: 1200, sweepTo: 300, q: 0.6, gain: 0.12 });
  }

  playPop() {
    this.playTone(660, 'triangle', 0.12, 0.08);
    setTimeout(() => this.playTone(990, 'triangle', 0.12, 0.06), 70);
  }
}

export const soundFx = new SoundManager();
