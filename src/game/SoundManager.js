export class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    this.enabled = true;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.masterVolume = 0.85;
    this.musicVolume = 0.7;
    this.sfxVolume = 0.85;

    this.initialized = false;
    this.paused = false;
    this.gameplayActive = false;
    this.currentStage = 'idle'; // 'idle' | 'beginning' | 'middle' | 'final20' | 'final10'
    this.tensionLevel = 0;

    // Active continuous gameplay soundtrack nodes & timers
    this.musicRig = null;
    this.musicSchedulerId = 0;
    this.oneShotTimers = new Set();
    this.subTickCount = 0;
    this.nextHostelNoiseAt = 16;
  }

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.enabled ? this.masterVolume : 0.0;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicEnabled ? this.musicVolume * 0.65 : 0.0;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxEnabled ? this.sfxVolume * 0.85 : 0.0;
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
    } catch {
      // AudioContext unavailable in restricted environments
    }
  }

  applyGainTargets(timeConstant = 0.04) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const pauseMul = this.paused ? 0.12 : 1.0;

    if (this.masterGain) {
      const target = this.enabled ? this.masterVolume : 0.0;
      this.masterGain.gain.setTargetAtTime(target, t, timeConstant);
    }
    if (this.musicGain) {
      const target = this.enabled && this.musicEnabled ? this.musicVolume * 0.65 * pauseMul : 0.0;
      this.musicGain.gain.setTargetAtTime(target, t, timeConstant);
    }
    if (this.sfxGain) {
      const target = this.enabled && this.sfxEnabled ? this.sfxVolume * 0.85 : 0.0;
      this.sfxGain.gain.setTargetAtTime(target, t, timeConstant);
    }
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    this.applyGainTargets(0.04);
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = Boolean(enabled);
    this.applyGainTargets(0.05);
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = Boolean(enabled);
    this.applyGainTargets(0.04);
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, Number(val)));
    this.applyGainTargets(0.04);
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, Number(val)));
    this.applyGainTargets(0.05);
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, Number(val)));
    this.applyGainTargets(0.04);
  }

  setPaused(paused) {
    this.paused = Boolean(paused);
    this.applyGainTargets(0.08);
  }

  scheduleTimeout(fn, delayMs) {
    const id = window.setTimeout(() => {
      this.oneShotTimers.delete(id);
      fn();
    }, delayMs);
    this.oneShotTimers.add(id);
    return id;
  }

  clearScheduledTimeouts() {
    this.oneShotTimers.forEach((id) => clearTimeout(id));
    this.oneShotTimers.clear();
  }

  startGameplayMusic() {
    this.init();
    this.stopGameplayMusic(0.06);
    this.gameplayActive = true;
    this.paused = false;
    this.currentStage = 'beginning';
    this.tensionLevel = 0;
    this.subTickCount = 0;
    this.nextHostelNoiseAt = 14;
    this.applyGainTargets(0.05);

    if (!this.ctx || !this.musicGain) return;

    const now = this.ctx.currentTime;
    const nodes = [];

    // Master envelope for the gameplay soundtrack so stopGameplayMusic fades cleanly to 0
    const musicBus = this.ctx.createGain();
    musicBus.gain.setValueAtTime(0.0001, now);
    musicBus.gain.linearRampToValueAtTime(1.0, now + 1.4);
    musicBus.connect(this.musicGain);

    // Warm dark lowpass filter sculpted dynamically as countdown drops
    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(170, now);
    droneFilter.Q.setValueAtTime(1.2, now);
    droneFilter.connect(musicBus);

    // Slow LFO subtly breathing the drone filter cutoff
    const filterLfo = this.ctx.createOscillator();
    const filterLfoGain = this.ctx.createGain();
    filterLfo.type = 'sine';
    filterLfo.frequency.value = 0.08;
    filterLfoGain.gain.value = 32;
    filterLfo.connect(filterLfoGain).connect(droneFilter.frequency);
    filterLfo.start(now);
    nodes.push(filterLfo);

    // 1. Deep dark cinematic sub-drones (E1 + slightly detuned E1 + B1 fifth)
    [
      { freq: 41.2, type: 'sine', gain: 0.2 },
      { freq: 41.52, type: 'triangle', gain: 0.09 },
      { freq: 61.74, type: 'sine', gain: 0.11 },
    ].forEach((cfg) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = cfg.type;
      osc.frequency.setValueAtTime(cfg.freq, now);
      g.gain.setValueAtTime(cfg.gain, now);
      osc.connect(g).connect(droneFilter);
      osc.start(now);
      nodes.push(osc);
    });

    // 2. Mysterious hostel minor-mode ambient pad (E2, G2, B2)
    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.055, now);
    padGain.connect(droneFilter);
    [82.41, 98.0, 123.47].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.32, now);
      osc.connect(g).connect(padGain);
      osc.start(now);
      nodes.push(osc);
    });

    // 3. Rising tension dissonance layer (Bb2 tritone + C3 minor-6th), silent initially
    const tensionGain = this.ctx.createGain();
    tensionGain.gain.setValueAtTime(0.0001, now);
    tensionGain.connect(droneFilter);
    [116.54, 130.81].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = idx === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(idx === 0 ? 0.16 : 0.25, now);
      osc.connect(g).connect(tensionGain);
      osc.start(now);
      nodes.push(osc);
    });

    // 4. Filtered subtle night wind / corridor air ambience on musicBus
    const airSeconds = 2;
    const airBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * airSeconds), this.ctx.sampleRate);
    const airData = airBuf.getChannelData(0);
    for (let i = 0; i < airData.length; i += 1) {
      airData[i] = Math.random() * 2 - 1;
    }
    const airSrc = this.ctx.createBufferSource();
    airSrc.buffer = airBuf;
    airSrc.loop = true;

    const airFilter = this.ctx.createBiquadFilter();
    airFilter.type = 'bandpass';
    airFilter.frequency.setValueAtTime(520, now);
    airFilter.Q.setValueAtTime(0.85, now);

    const airGain = this.ctx.createGain();
    airGain.gain.setValueAtTime(0.032, now);
    airSrc.connect(airFilter).connect(airGain).connect(musicBus);
    airSrc.start(now);
    nodes.push(airSrc);

    this.musicRig = {
      nodes,
      musicBus,
      droneFilter,
      padGain,
      tensionGain,
      airGain,
    };

    // Subtle procedural suspense pulse every 500ms while gameplay is active
    this.musicSchedulerId = window.setInterval(() => {
      if (!this.gameplayActive || this.paused || !this.ctx || !this.musicRig) return;
      this.onSuspenseBeat();
    }, 500);
  }

  onSuspenseBeat() {
    this.subTickCount += 1;
    const beat = this.subTickCount;
    const stage = this.currentStage;

    // Beginning: gentle slow low swell every 8 beats (4s)
    if (stage === 'beginning') {
      if (beat % 8 === 0) {
        this.playDarkPadSwell(82.41, 2.8, 0.045);
      }
      return;
    }

    // Middle: brooding minor undertone every 4 beats (2s)
    if (stage === 'middle') {
      if (beat % 4 === 0) {
        const note = beat % 8 === 0 ? 82.41 : 98.0;
        this.playDarkPadSwell(note, 1.9, 0.065);
      }
      return;
    }

    // Final 20s: stronger pulsing tension bass + off-beat second clock escapement tick
    if (stage === 'final20') {
      if (beat % 2 === 1) {
        this.playClockTick(0.72, true);
      }
      if (beat % 2 === 0) {
        this.playDarkPulse(61.74, 0.42, 0.09);
      }
      if (beat % 4 === 0) {
        this.playDarkPadSwell(116.54, 1.4, 0.075);
      }
      return;
    }

    // Final 10s: dramatic climax build with urgent double-time clock & rising dark pulse
    if (stage === 'final10') {
      if (beat % 2 === 1) {
        this.playClockTick(0.95, true);
      }
      this.playDarkPulse(beat % 2 === 0 ? 55.0 : 61.74, 0.34, 0.115);
      if (beat % 2 === 0) {
        this.playDarkPadSwell(123.47, 0.95, 0.09);
      }
    }
  }

  playDarkPadSwell(freq, duration, volume) {
    if (!this.ctx || !this.musicRig || !this.enabled || !this.musicEnabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(340 + this.tensionLevel * 240, t);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(volume, t + duration * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(filter).connect(gain).connect(this.musicRig.musicBus);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  playDarkPulse(freq, duration, volume) {
    if (!this.ctx || !this.musicRig || !this.enabled || !this.musicEnabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220 + this.tensionLevel * 220, t);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(filter).connect(gain).connect(this.musicRig.musicBus);
    osc.start(t);
    osc.stop(t + duration + 0.04);
  }

  updateCountdownMusic(remainingSeconds, totalSeconds = 600) {
    const safeTotal = Math.max(1, totalSeconds || 600);
    const remaining = Math.max(0, remainingSeconds || 0);
    const elapsed = safeTotal - remaining;
    const progress = Math.max(0, Math.min(1, elapsed / safeTotal));

    let stage = 'beginning';
    if (remaining <= 10) {
      stage = 'final10';
    } else if (remaining <= 20) {
      stage = 'final20';
    } else if (progress >= 0.45) {
      stage = 'middle';
    }
    this.currentStage = stage;

    // Combine normalized progress with urgent boost in final 20 seconds
    let tension = progress * 0.55;
    if (stage === 'middle') tension = Math.max(tension, 0.38 + (progress - 0.45) * 0.45);
    if (stage === 'final20') tension = Math.max(tension, 0.72);
    if (stage === 'final10') tension = 0.85 + ((10 - remaining) / 10) * 0.15;
    this.setTensionLevel(tension);

    // Subtle clock tick every second while gameplay runs
    this.playClockTick(tension, false);

    // Occasional distant hostel corridor noises (never loud or repetitive)
    if (elapsed > 0 && elapsed >= this.nextHostelNoiseAt && remaining > 12) {
      this.playDistantHostelNoise();
      this.nextHostelNoiseAt = elapsed + 16 + Math.floor(Math.random() * 10);
    }

    // Approaching corridor footsteps in final 10 seconds
    if (remaining === 8 || remaining === 4) {
      this.playApproachingStepPair();
    }
  }

  setTensionLevel(level) {
    const clamped = Math.max(0, Math.min(1, level));
    this.tensionLevel = clamped;
    if (!this.ctx || !this.musicRig) return;

    const t = this.ctx.currentTime;
    const { droneFilter, padGain, tensionGain, airGain } = this.musicRig;
    droneFilter.frequency.setTargetAtTime(165 + clamped * 360, t, 0.5);
    padGain.gain.setTargetAtTime(0.05 + clamped * 0.075, t, 0.5);
    tensionGain.gain.setTargetAtTime(clamped < 0.25 ? 0.0001 : (clamped - 0.2) * 0.18, t, 0.45);
    airGain.gain.setTargetAtTime(0.028 + clamped * 0.025, t, 0.5);
  }

  stopGameplayMusic(fadeSec = 0.15) {
    this.gameplayActive = false;
    this.currentStage = 'idle';
    if (this.musicSchedulerId) {
      clearInterval(this.musicSchedulerId);
      this.musicSchedulerId = 0;
    }

    const rig = this.musicRig;
    this.musicRig = null;
    if (!rig || !this.ctx) return;

    const t = this.ctx.currentTime;
    try {
      rig.musicBus.gain.cancelScheduledValues(t);
      rig.musicBus.gain.setValueAtTime(Math.max(0.0001, rig.musicBus.gain.value), t);
      rig.musicBus.gain.exponentialRampToValueAtTime(0.0001, t + fadeSec);
    } catch {
      // Ignore gain ramp errors on closed contexts
    }

    window.setTimeout(() => {
      rig.nodes.forEach((n) => {
        try {
          n.stop();
          n.disconnect();
        } catch {
          // Node already stopped
        }
      });
      try {
        rig.musicBus.disconnect();
      } catch {
        // Already disconnected
      }
    }, Math.ceil((fadeSec + 0.08) * 1000));
  }

  stopAllGameAudio(fadeSec = 0.12) {
    this.clearScheduledTimeouts();
    this.paused = false;
    this.setTensionLevel(0);
    this.stopGameplayMusic(fadeSec);
  }

  playTone(freq, duration, type = 'sine', volume = 0.08, delay = 0, channel = 'sfx') {
    if (!this.ctx || !this.enabled) return;
    if (channel === 'music' && !this.musicEnabled) return;
    if (channel === 'sfx' && !this.sfxEnabled) return;

    const dest = channel === 'music' ? this.musicGain : this.sfxGain;
    if (!dest) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(Math.max(0.0001, volume), t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  playFilteredNoiseBurst(duration, centerFreq, q, volume, delay = 0, channel = 'sfx') {
    if (!this.ctx || !this.enabled) return;
    if (channel === 'music' && !this.musicEnabled) return;
    if (channel === 'sfx' && !this.sfxEnabled) return;

    const dest = channel === 'music' ? this.musicGain : this.sfxGain;
    if (!dest) return;

    const len = Math.max(64, Math.floor(this.ctx.sampleRate * duration));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      const env = Math.pow(1 - i / len, 1.8);
      ch[i] = (Math.random() * 2 - 1) * env;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = centerFreq;
    filter.Q.value = q;

    const g = this.ctx.createGain();
    g.gain.value = volume;

    const t = this.ctx.currentTime + delay;
    src.connect(filter).connect(g).connect(dest);
    src.start(t);
  }

  playClick() {
    this.playTone(540, 0.08, 'triangle', 0.075);
    this.playTone(840, 0.07, 'sine', 0.045, 0.03);
  }

  playPageTurn() {
    if (!this.ctx || !this.sfxGain || !this.enabled || !this.sfxEnabled) return;
    const len = Math.floor(this.ctx.sampleRate * 0.16);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      const env = Math.sin((i / len) * Math.PI);
      ch[i] = (Math.random() * 2 - 1) * env;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3200, this.ctx.currentTime + 0.14);

    const g = this.ctx.createGain();
    g.gain.value = 0.12;
    src.connect(filter).connect(g).connect(this.sfxGain);
    src.start();
  }

  playDialTick() {
    this.playTone(980, 0.04, 'triangle', 0.06);
  }

  playKeypadBeep(digit) {
    const base = 620 + (Number(digit) || 0) * 38;
    this.playTone(base, 0.08, 'sine', 0.07);
  }

  playClockTick(tension = 0, isOffBeat = false) {
    // Muted mechanical clock escapement tick/tock
    const freq = isOffBeat ? 1180 : 1480;
    const vol = (isOffBeat ? 0.035 : 0.045) + tension * 0.045;
    this.playFilteredNoiseBurst(0.022, freq, 4.5, vol, 0, 'sfx');
    this.playTone(isOffBeat ? 620 : 780, 0.022, 'triangle', 0.008 + tension * 0.012, 0, 'sfx');
  }

  playDistantHostelNoise() {
    // Very subtle faraway corridor creak / muted pipe resonance
    const variant = Math.floor(Math.random() * 3);
    if (variant === 0) {
      this.playFilteredNoiseBurst(0.28, 360, 3.2, 0.045, 0, 'sfx');
    } else if (variant === 1) {
      this.playTone(92, 0.55, 'sine', 0.025, 0, 'sfx');
      this.playTone(138, 0.42, 'triangle', 0.014, 0.08, 'sfx');
    } else {
      this.playFilteredNoiseBurst(0.14, 520, 2.0, 0.035, 0, 'sfx');
      this.playFilteredNoiseBurst(0.18, 410, 2.5, 0.028, 0.35, 'sfx');
    }
  }

  playApproachingStepPair() {
    this.playTone(62, 0.14, 'sine', 0.075, 0, 'sfx');
    this.playFilteredNoiseBurst(0.08, 220, 1.4, 0.045, 0, 'sfx');
    this.playTone(58, 0.15, 'sine', 0.09, 0.42, 'sfx');
    this.playFilteredNoiseBurst(0.08, 240, 1.4, 0.055, 0.42, 'sfx');
  }

  playClueFound() {
    this.playTone(440, 0.18, 'triangle', 0.07, 0);
    this.playTone(523.25, 0.22, 'triangle', 0.07, 0.08);
    this.playTone(659.25, 0.32, 'sine', 0.075, 0.16);
  }

  playError() {
    this.playTone(190, 0.16, 'sawtooth', 0.065, 0);
    this.playTone(155, 0.22, 'sawtooth', 0.065, 0.11);
  }

  playHandleRattle() {
    this.playTone(145, 0.07, 'triangle', 0.09, 0);
    this.playTone(120, 0.09, 'triangle', 0.08, 0.09);
  }

  playDrawerUnlock() {
    this.playTone(360, 0.08, 'triangle', 0.09, 0);
    this.playTone(540, 0.14, 'triangle', 0.09, 0.07);
    this.playTone(135, 0.3, 'sine', 0.09, 0.12);
  }

  playDoorUnlock() {
    this.playTone(587.33, 0.16, 'sine', 0.09, 0);
    this.playTone(783.99, 0.18, 'sine', 0.09, 0.1);
    this.playTone(1046.5, 0.38, 'triangle', 0.1, 0.2);
    this.playTone(108, 0.45, 'sine', 0.11, 0.28);
    this.playFilteredNoiseBurst(0.45, 290, 1.6, 0.08, 0.3, 'sfx');
  }

  playVictoryMusic() {
    // Stop countdown suspense completely before victory resolution plays
    this.stopAllGameAudio(0.12);

    const notes = [
      [261.63, 0],
      [329.63, 0.16],
      [392.0, 0.32],
      [523.25, 0.48],
      [659.25, 0.68],
      [783.99, 0.88],
      [1046.5, 1.12],
    ];
    notes.forEach(([f, d]) => {
      this.playTone(f, 0.85, 'triangle', 0.09, d, 'music');
      this.playTone(f * 0.5, 1.0, 'sine', 0.06, d, 'music');
    });
  }

  playWardenFootsteps() {
    [0, 0.42, 0.86, 1.32].forEach((delay, idx) => {
      const vol = 0.075 + idx * 0.022;
      this.playTone(64 - idx * 2, 0.16, 'sine', vol, delay, 'sfx');
      this.playFilteredNoiseBurst(0.08, 220, 1.5, 0.04 + idx * 0.01, delay, 'sfx');
    });
  }

  playWardenEntranceSequence() {
    // Immediately stop countdown suspense music before door & footsteps cues
    this.stopAllGameAudio(0.12);

    // 1. Door handle latch turn + wooden door creak/swing open (0.15s - 0.9s)
    this.playTone(155, 0.08, 'triangle', 0.09, 0.12, 'sfx');
    this.playTone(115, 0.1, 'triangle', 0.085, 0.28, 'sfx');
    this.playFilteredNoiseBurst(0.55, 260, 2.2, 0.11, 0.62, 'sfx');
    this.playTone(94, 0.55, 'sawtooth', 0.03, 0.64, 'sfx');

    // 2. Heavy deliberate warden footsteps entering Room 13 (0.95s - 2.2s)
    [0.95, 1.4, 1.85, 2.25].forEach((delay, idx) => {
      this.playTone(58 - idx * 2, 0.18, 'sine', 0.11 + idx * 0.015, delay, 'sfx');
      this.playFilteredNoiseBurst(0.1, 210, 1.3, 0.07, delay, 'sfx');
    });

    // 3. Short dramatic musical sting as the warden confronts the player
    this.playTone(55.0, 2.2, 'sine', 0.13, 0.75, 'music');
    this.playTone(82.41, 2.0, 'triangle', 0.08, 0.82, 'music');
    this.playTone(87.31, 1.8, 'sine', 0.065, 0.95, 'music');
    this.playTone(164.81, 1.5, 'triangle', 0.045, 1.05, 'music');
  }

  playWardenFailureCue() {
    // Ensure no background loop remains active on game-over screen; play one short final chord
    this.stopAllGameAudio(0.1);
    this.playTone(110.0, 0.9, 'triangle', 0.075, 0.04, 'music');
    this.playTone(82.41, 1.15, 'sine', 0.095, 0.12, 'music');
    this.playTone(55.0, 1.45, 'sine', 0.12, 0.18, 'music');
  }

  // Backward-compatible alias
  playWardenCaughtSting() {
    this.playWardenEntranceSequence();
  }
}
