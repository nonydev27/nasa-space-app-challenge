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
}

export const soundFx = new SoundManager();
