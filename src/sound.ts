// Pure 8-bit / Arcade sound synthesis via Web Audio API - Zero external MP3/WAV files needed

class SoundManager {
  private ctx: AudioContext | null = null;
  private tickInterval: number | null = null;
  private tickStep: boolean = false;
  public isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public playBlip() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // AudioContext might be blocked until user gesture
    }
  }

  public playWhistle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      // 2-tone referee whistle with slight trill vibrato
      osc1.frequency.setValueAtTime(2600, t);
      osc2.frequency.setValueAtTime(2850, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.setValueAtTime(0.18, t + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.35);
      osc2.stop(t + 0.35);
    } catch {
      // ignore
    }
  }

  public playKick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      // Low punch frequency dropping fast
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.18);
    } catch {
      // ignore
    }
  }

  public playGoal() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C, E, G, C, E, G arpeggio
      const t = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0.15, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.32);
      });

      // Crowd cheer white noise burst
      const bufferSize = this.ctx.sampleRate * 1.0;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t + 0.2);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, t);
      noiseGain.gain.linearRampToValueAtTime(0.18, t + 0.3);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(t + 0.1);
      noise.stop(t + 1.2);
    } catch {
      // ignore
    }
  }

  public playSave() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // Damped boing / thud + disappointed crowd groan
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.35);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.4);
    } catch {
      // ignore
    }
  }

  public playBuzzer() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.setValueAtTime(120, t + 0.1);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.3);
    } catch {
      // ignore
    }
  }

  public playTick(isHigh: boolean = true) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isHigh ? 980 : 740, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.045);
    } catch {
      // ignore
    }
  }

  public startTickTock() {
    this.stopTickTock();
    this.tickStep = true;
    this.playTick(true);

    if (typeof window !== 'undefined') {
      this.tickInterval = window.setInterval(() => {
        this.tickStep = !this.tickStep;
        this.playTick(this.tickStep);
      }, 500);
    }
  }

  public stopTickTock() {
    if (this.tickInterval !== null && typeof window !== 'undefined') {
      window.clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  public playCoachWhistle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(2950, t);
      osc2.frequency.setValueAtTime(3180, t);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.03);
      gain.gain.setValueAtTime(0.2, t + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.31);
      osc2.stop(t + 0.31);
    } catch {
      // ignore
    }
  }

  public playGoldenKick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // Impact kick thump
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'triangle';
      kickOsc.frequency.setValueAtTime(175, t);
      kickOsc.frequency.exponentialRampToValueAtTime(38, t + 0.22);
      kickGain.gain.setValueAtTime(0.45, t);
      kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      kickOsc.connect(kickGain);
      kickGain.connect(this.ctx.destination);
      kickOsc.start(t);
      kickOsc.stop(t + 0.25);

      // Golden soaring arpeggio shimmer
      const goldenNotes = [523.25, 659.25, 783.99, 1046.5];
      goldenNotes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + 0.08 + idx * 0.07);
        gain.gain.setValueAtTime(0.14, t + 0.08 + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08 + idx * 0.07 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + 0.08 + idx * 0.07);
        osc.stop(t + 0.08 + idx * 0.07 + 0.36);
      });
    } catch {
      // ignore
    }
  }

  public playChampionFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // Triumphant 8-bit stadium fanfare melody (C5 - C5 - C5 - G4 - A4 - G4 - C5 - E5 - G5)
      const sequence: Array<{ freq: number; start: number; dur: number; type?: OscillatorType }> = [
        { freq: 523.25, start: 0.0, dur: 0.14, type: 'square' },
        { freq: 523.25, start: 0.16, dur: 0.14, type: 'square' },
        { freq: 523.25, start: 0.32, dur: 0.14, type: 'square' },
        { freq: 659.25, start: 0.48, dur: 0.32, type: 'square' },
        { freq: 587.33, start: 0.82, dur: 0.18, type: 'square' },
        { freq: 659.25, start: 1.02, dur: 0.18, type: 'square' },
        { freq: 783.99, start: 1.22, dur: 0.42, type: 'square' },
        { freq: 1046.5, start: 1.68, dur: 0.7, type: 'triangle' },
        // Harmony bass notes
        { freq: 261.63, start: 0.0, dur: 0.45, type: 'triangle' },
        { freq: 329.63, start: 0.48, dur: 0.5, type: 'triangle' },
        { freq: 392.0, start: 1.22, dur: 0.42, type: 'triangle' },
        { freq: 523.25, start: 1.68, dur: 0.7, type: 'square' },
      ];

      sequence.forEach((n) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = n.type || 'square';
        osc.frequency.setValueAtTime(n.freq, t + n.start);
        gain.gain.setValueAtTime(0.11, t + n.start);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n.start + n.dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + n.start);
        osc.stop(t + n.start + n.dur + 0.02);
      });
    } catch {
      // ignore
    }
  }
}

export const sounds = new SoundManager();
