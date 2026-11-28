// ZAP 100T — Procedural Web Audio Engine (Weapon-tier dynamic SFX, Electric Sizzle, Overdrive Beat, Boss Telegraph & Stamps)
window.ZAP = window.ZAP || {};

(function () {
  const PENTATONIC = [
    523.25, 587.33, 659.25, 783.99, 880.0,
    1046.5, 1174.66, 1318.51, 1567.98, 1760.0,
    2093.0, 2349.32, 2637.02,
  ];

  const AudioEngine = {
    ctx: null,
    master: null,
    noiseBuffer: null,
    volume: 0.65,
    muted: false,
    lastZapAt: 0,
    lastOrbAt: 0,
    lastArcAt: 0,
    orbPitchStep: 0,

    unlock() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : this.volume;
        this.master.connect(this.ctx.destination);
        this._buildNoiseBuffer();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },

    _buildNoiseBuffer() {
      const sampleRate = this.ctx.sampleRate;
      const length = Math.floor(sampleRate * 0.25);
      const buf = this.ctx.createBuffer(1, length, sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 1.4);
      }
      this.noiseBuffer = buf;
    },

    setVolume(v) {
      this.volume = Math.max(0, Math.min(1, v));
      if (this.master && !this.muted) {
        this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
      }
    },

    setMuted(m) {
      this.muted = !!m;
      if (this.master) {
        this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.02);
      }
    },

    // Weapon-adaptive hit/kill sound
    playHit(soundType = 'zap', combo = 0, isCrit = false, isKill = false) {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      if (now - this.lastZapAt < 0.024) return;
      this.lastZapAt = now;

      const idx = Math.min(PENTATONIC.length - 1, Math.floor(combo / 3));
      const musicalFreq = PENTATONIC[idx] * (isCrit ? 1.25 : 1);

      if (soundType === 'slap' || soundType === 'smack') {
        if (this.noiseBuffer) {
          const src = this.ctx.createBufferSource();
          src.buffer = this.noiseBuffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(soundType === 'slap' ? 1280 : 1780, now);
          filter.Q.value = soundType === 'slap' ? 1.35 : 2.1;

          const gain = this.ctx.createGain();
          const peak = isKill ? (isCrit ? 0.5 : 0.36) : 0.2;
          gain.gain.setValueAtTime(peak, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (soundType === 'slap' ? 0.055 : 0.068));

          src.connect(filter);
          filter.connect(gain);
          gain.connect(this.master);
          src.start(now);
          src.stop(now + 0.08);
        }
        const osc = this.ctx.createOscillator();
        const og = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isKill ? musicalFreq * 0.75 : 220, now);
        osc.frequency.exponentialRampToValueAtTime(isKill ? musicalFreq * 0.5 : 95, now + 0.06);
        og.gain.setValueAtTime(isKill ? 0.16 : 0.12, now);
        og.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.connect(og);
        og.connect(this.master);
        osc.start(now);
        osc.stop(now + 0.075);
        return;
      }

      if (soundType === 'spray') {
        if (this.noiseBuffer) {
          const src = this.ctx.createBufferSource();
          src.buffer = this.noiseBuffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(3800, now);
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(isKill ? 0.19 : 0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
          src.connect(filter);
          filter.connect(gain);
          gain.connect(this.master);
          src.start(now);
          src.stop(now + 0.1);
        }
        if (isKill) {
          const osc = this.ctx.createOscillator();
          const og = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(musicalFreq, now);
          osc.frequency.exponentialRampToValueAtTime(musicalFreq * 1.2, now + 0.065);
          og.gain.setValueAtTime(0.12, now);
          og.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
          osc.connect(og);
          og.connect(this.master);
          osc.start(now);
          osc.stop(now + 0.08);
        }
        return;
      }

      // Electric Zap / Plasma Crackle + High-Voltage 60Hz Arc Snap
      const isPlasma = soundType === 'plasma';
      if (this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isCrit ? 3700 : 2500 + Math.random() * 1400, now);
        filter.Q.value = isPlasma ? 1.8 : 3.2;

        const gain = this.ctx.createGain();
        const peak = isKill ? (isCrit ? 0.44 : 0.31) : 0.16;
        gain.gain.setValueAtTime(peak, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isKill ? 0.08 : 0.045));

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        src.start(now);
        src.stop(now + 0.085);
      }

      const osc = this.ctx.createOscillator();
      const og = this.ctx.createGain();
      osc.type = isCrit || isPlasma ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(musicalFreq * (isPlasma ? 1.5 : 1.35), now);
      osc.frequency.exponentialRampToValueAtTime(musicalFreq * 0.65, now + (isKill ? 0.09 : 0.045));

      og.gain.setValueAtTime(isKill ? (isCrit ? 0.2 : 0.13) : 0.06, now);
      og.gain.exponentialRampToValueAtTime(0.001, now + (isKill ? 0.1 : 0.05));

      osc.connect(og);
      og.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.105);
    },

    // Crisp multi-target high-voltage sizzle (when zapping 3+ mosquitoes at once!)
    playArcSizzle() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      if (now - this.lastArcAt < 0.09) return;
      this.lastArcAt = now;

      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(118, now);
      osc.frequency.linearRampToValueAtTime(142, now + 0.07);
      g.gain.setValueAtTime(0.085, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.095);
    },

    // Subtle rhythmic 138 BPM Overdrive pulse beat
    playOverdriveBeat(accent = false) {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(accent ? 115 : 88, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.11);
      g.gain.setValueAtTime(accent ? 0.14 : 0.09, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.13);
    },

    // Boss dash whoosh
    playBossDash() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.16);
      g.gain.setValueAtTime(0.11, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.18);
    },

    // Heavy ink stamp sound for signing Core Contracts!
    playStamp() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.14);
      g.gain.setValueAtTime(0.35, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.17);
      this.playMilestone();
    },

    playOrb() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      if (now - this.lastOrbAt < 0.032) return;
      if (now - this.lastOrbAt > 0.35) this.orbPitchStep = 0;
      else this.orbPitchStep = Math.min(PENTATONIC.length - 1, this.orbPitchStep + 1);
      this.lastOrbAt = now;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const freq = PENTATONIC[this.orbPitchStep];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.06, now + 0.07);

      gain.gain.setValueAtTime(0.085, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.095);
    },

    playEMP(soundType = 'zap') {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;

      if (soundType === 'slap' || soundType === 'smack') {
        if (this.noiseBuffer) {
          const src = this.ctx.createBufferSource();
          src.buffer = this.noiseBuffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1100, now);
          filter.Q.value = 1.1;
          const g = this.ctx.createGain();
          g.gain.setValueAtTime(0.55, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
          src.connect(filter);
          filter.connect(g);
          g.connect(this.master);
          src.start(now);
          src.stop(now + 0.14);
        }
        const sub = this.ctx.createOscillator();
        const sg = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(160, now);
        sub.frequency.exponentialRampToValueAtTime(55, now + 0.12);
        sg.gain.setValueAtTime(0.32, now);
        sg.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        sub.connect(sg);
        sg.connect(this.master);
        sub.start(now);
        sub.stop(now + 0.15);
        return;
      }

      const sub = this.ctx.createOscillator();
      const sg = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(195, now);
      sub.frequency.exponentialRampToValueAtTime(42, now + 0.22);
      sg.gain.setValueAtTime(0.38, now);
      sg.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      sub.connect(sg);
      sg.connect(this.master);
      sub.start(now);
      sub.stop(now + 0.25);

      if (this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1400, now);
        const ng = this.ctx.createGain();
        ng.gain.setValueAtTime(0.3, now);
        ng.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        src.connect(filter);
        filter.connect(ng);
        ng.connect(this.master);
        src.start(now);
        src.stop(now + 0.17);
      }
    },

    playUpgrade(isEvolution = false) {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const notes = isEvolution
        ? [523.25, 659.25, 783.99, 1046.5, 1318.51]
        : [523.25, 659.25, 1046.5];
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = isEvolution ? 'sawtooth' : 'triangle';
        const t = now + i * (isEvolution ? 0.055 : 0.04);
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(isEvolution ? 0.13 : 0.14, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + (isEvolution ? 0.28 : 0.18));
        osc.connect(g);
        g.connect(this.master);
        osc.start(t);
        osc.stop(t + (isEvolution ? 0.3 : 0.2));
      });
    },

    playFeverStart() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + i * 0.045);
        g.gain.setValueAtTime(0.12, now + i * 0.045);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.35);
        osc.connect(g);
        g.connect(this.master);
        osc.start(now + i * 0.045);
        osc.stop(now + i * 0.045 + 0.38);
      });
    },

    playBossWarning() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        const t = now + i * 0.22;
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.linearRampToValueAtTime(520, t + 0.15);
        g.gain.setValueAtTime(0.16, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(g);
        g.connect(this.master);
        osc.start(t);
        osc.stop(t + 0.21);
      }
    },

    playBossKill() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      this.playEMP('zap');
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        const t = now + 0.05 + i * 0.06;
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
        osc.connect(g);
        g.connect(this.master);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    },

    playOrbitalBeam() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.75);
      g.gain.setValueAtTime(0.22, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.82);
    },

    playBombBlast() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const sub = this.ctx.createOscillator();
      const sg = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(240, now);
      sub.frequency.exponentialRampToValueAtTime(36, now + 0.28);
      sg.gain.setValueAtTime(0.42, now);
      sg.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      sub.connect(sg);
      sg.connect(this.master);
      sub.start(now);
      sub.stop(now + 0.32);

      if (this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now);
        const ng = this.ctx.createGain();
        ng.gain.setValueAtTime(0.32, now);
        ng.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        src.connect(filter);
        filter.connect(ng);
        ng.connect(this.master);
        src.start(now);
        src.stop(now + 0.24);
      }
    },

    playMilestone() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const notes = [659.25, 880, 1318.51];
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        const t = now + i * 0.05;
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.14, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        osc.connect(g);
        g.connect(this.master);
        osc.start(t);
        osc.stop(t + 0.26);
      });
    },

    playSwarmRush() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 2; i++) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        const t = now + i * 0.16;
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.12);
        g.gain.setValueAtTime(0.16, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(g);
        g.connect(this.master);
        osc.start(t);
        osc.stop(t + 0.16);
      }
    },
  };

  window.ZAP.Audio = AudioEngine;
})();
