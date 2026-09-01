import { AudioSettings, EnvironmentMode, BassBoostLevel } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  
  // Equalizer & Filter DSP Chain Nodes
  private highPassFilter: BiquadFilterNode | null = null; // Rumble & Noise Reduction
  private lowPassFilter: BiquadFilterNode | null = null; // Hiss Reduction
  private bassShelfFilter: BiquadFilterNode | null = null; // Low Shelf Bass
  private bassPeakFilter: BiquadFilterNode | null = null; // Sub-Bass Punch & Resonance
  private midFilter: BiquadFilterNode | null = null; // Mid-range
  private vocalPresenceFilter: BiquadFilterNode | null = null; // Vocal Clarity & Intelligibility
  private trebleShelfFilter: BiquadFilterNode | null = null; // High Shimmer / Air
  private compressor: DynamicsCompressorNode | null = null; // Studio Limiter/Compressor
  private waveShaper: WaveShaperNode | null = null; // Harmonic Bass Exciter

  // Speech Synthesis
  private voices: SpeechSynthesisVoice[] = [];
  private ttsReady = false;
  private pendingSpeak: string | null = null;

  // Current Settings
  public settings: AudioSettings = {
    volume: 0.9,
    ttsVolume: 1.0,
    ttsRate: 0.85,
    environmentMode: 'auto',
    noiseReduction: true,
    frequencyEnhancer: true,
    bassBoostLevel: 'medium',
    bassGain: 6,
    midGain: 2,
    trebleGain: 4,
    vocalClarity: 8,
  };

  private listeners: Array<() => void> = [];

  constructor() {
    this.loadPersistedSettings();
    this.initTTS();
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  private loadPersistedSettings() {
    try {
      const saved = localStorage.getItem('fun_learning_audio_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('fun_learning_audio_settings', JSON.stringify(this.settings));
    } catch {
      // Ignore
    }
    this.notify();
  }

  // Ensure AudioContext is ready and resumed
  public initAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.buildDspGraph();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private makeDistortionCurve(amount = 20): Float32Array {
    const k = typeof amount === 'number' ? amount : 20;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      // Soft saturation curve for warm harmonic exciter
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private buildDspGraph() {
    if (!this.ctx) return;

    // Create DSP nodes
    this.highPassFilter = this.ctx.createBiquadFilter();
    this.highPassFilter.type = 'highpass';
    this.highPassFilter.frequency.value = 50; // Filter low frequency mic rumble

    this.lowPassFilter = this.ctx.createBiquadFilter();
    this.lowPassFilter.type = 'lowpass';
    this.lowPassFilter.frequency.value = 16000; // Filter extreme hiss

    // Bass Boost Filter (Low Shelf @ 90Hz)
    this.bassShelfFilter = this.ctx.createBiquadFilter();
    this.bassShelfFilter.type = 'lowshelf';
    this.bassShelfFilter.frequency.value = 95;

    // Sub-Bass Punch Filter (Peaking @ 65Hz)
    this.bassPeakFilter = this.ctx.createBiquadFilter();
    this.bassPeakFilter.type = 'peaking';
    this.bassPeakFilter.frequency.value = 65;
    this.bassPeakFilter.Q.value = 1.4;

    // Mid-range Filter (Peaking @ 750Hz)
    this.midFilter = this.ctx.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 750;
    this.midFilter.Q.value = 1.0;

    // Vocal Clarity & Presence Filter (Peaking @ 3200Hz)
    this.vocalPresenceFilter = this.ctx.createBiquadFilter();
    this.vocalPresenceFilter.type = 'peaking';
    this.vocalPresenceFilter.frequency.value = 3200;
    this.vocalPresenceFilter.Q.value = 1.2;

    // Treble Shimmer & Air Filter (High Shelf @ 7500Hz)
    this.trebleShelfFilter = this.ctx.createBiquadFilter();
    this.trebleShelfFilter.type = 'highshelf';
    this.trebleShelfFilter.frequency.value = 7500;

    // Soft Harmonic Waveshaper for Bass Warmth
    this.waveShaper = this.ctx.createWaveShaper();
    this.waveShaper.curve = this.makeDistortionCurve(5);
    this.waveShaper.oversample = '2x';

    // Studio Dynamics Compressor / Limiter
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.18, this.ctx.currentTime);

    // Master Gain
    this.masterGainNode = this.ctx.createGain();
    this.masterGainNode.gain.setValueAtTime(this.settings.volume, this.ctx.currentTime);

    // Analyser Node for Visualizer
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 128;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // Wire DSP Chain:
    // Source -> HighPass -> LowPass -> BassShelf -> BassPeak -> Mid -> VocalPresence -> TrebleShelf -> Compressor -> MasterGain -> Analyser -> Destination
    this.highPassFilter.connect(this.lowPassFilter);
    this.lowPassFilter.connect(this.bassShelfFilter);
    this.bassShelfFilter.connect(this.bassPeakFilter);
    this.bassPeakFilter.connect(this.midFilter);
    this.midFilter.connect(this.vocalPresenceFilter);
    this.vocalPresenceFilter.connect(this.trebleShelfFilter);
    this.trebleShelfFilter.connect(this.compressor);
    this.compressor.connect(this.masterGainNode);
    this.masterGainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.ctx.destination);

    // Apply current parameters
    this.applyDspParameters();
  }

  // Update DSP filters based on current user settings & environment mode
  public applyDspParameters() {
    if (!this.ctx || !this.masterGainNode) return;
    const now = this.ctx.currentTime;

    // Master volume
    this.masterGainNode.gain.setTargetAtTime(this.settings.volume, now, 0.05);

    // Noise Reduction parameters
    if (this.highPassFilter && this.lowPassFilter) {
      if (this.settings.noiseReduction) {
        this.highPassFilter.frequency.setTargetAtTime(65, now, 0.05); // cut unwanted rumble
        this.lowPassFilter.frequency.setTargetAtTime(14500, now, 0.05); // cut hiss
      } else {
        this.highPassFilter.frequency.setTargetAtTime(20, now, 0.05);
        this.lowPassFilter.frequency.setTargetAtTime(20000, now, 0.05);
      }
    }

    // Compute Bass Boost Gain
    let bassBoostGain = 0;
    switch (this.settings.bassBoostLevel) {
      case 'off':
        bassBoostGain = 0;
        break;
      case 'subtle':
        bassBoostGain = 3.5;
        break;
      case 'medium':
        bassBoostGain = 7.0;
        break;
      case 'deep':
        bassBoostGain = 10.5;
        break;
      case 'ultra':
        bassBoostGain = 14.0;
        break;
    }

    // Combine manual equalizer with bass boost
    const totalBass = this.settings.bassGain + bassBoostGain;
    if (this.bassShelfFilter) {
      this.bassShelfFilter.gain.setTargetAtTime(totalBass, now, 0.05);
    }
    if (this.bassPeakFilter) {
      this.bassPeakFilter.gain.setTargetAtTime(bassBoostGain * 0.75, now, 0.05);
    }

    // Mid Gain
    if (this.midFilter) {
      this.midFilter.gain.setTargetAtTime(this.settings.midGain, now, 0.05);
    }

    // Vocal Clarity & Presence Boost
    if (this.vocalPresenceFilter) {
      const clarityGain = (this.settings.vocalClarity / 10) * 8; // up to +8dB
      this.vocalPresenceFilter.gain.setTargetAtTime(clarityGain, now, 0.05);
    }

    // Treble & Frequency Enhancer
    if (this.trebleShelfFilter) {
      const enhancerBonus = this.settings.frequencyEnhancer ? 3.0 : 0;
      this.trebleShelfFilter.gain.setTargetAtTime(this.settings.trebleGain + enhancerBonus, now, 0.05);
    }

    // Compressor Adjustments based on Environment
    if (this.compressor) {
      switch (this.settings.environmentMode) {
        case 'noisy':
          this.compressor.threshold.setTargetAtTime(-24, now, 0.05);
          this.compressor.ratio.setTargetAtTime(6, now, 0.05);
          break;
        case 'headphones':
          this.compressor.threshold.setTargetAtTime(-14, now, 0.05);
          this.compressor.ratio.setTargetAtTime(2.5, now, 0.05);
          break;
        case 'speaker':
          this.compressor.threshold.setTargetAtTime(-20, now, 0.05);
          this.compressor.ratio.setTargetAtTime(5, now, 0.05);
          break;
        case 'quiet':
          this.compressor.threshold.setTargetAtTime(-10, now, 0.05);
          this.compressor.ratio.setTargetAtTime(2, now, 0.05);
          break;
        case 'studio':
          this.compressor.threshold.setTargetAtTime(-16, now, 0.05);
          this.compressor.ratio.setTargetAtTime(3, now, 0.05);
          break;
        case 'auto':
        default:
          this.compressor.threshold.setTargetAtTime(-18, now, 0.05);
          this.compressor.ratio.setTargetAtTime(4, now, 0.05);
          break;
      }
    }
  }

  // Set environment preset
  public setEnvironment(mode: EnvironmentMode) {
    this.settings.environmentMode = mode;
    switch (mode) {
      case 'headphones':
        this.settings.bassBoostLevel = 'deep';
        this.settings.bassGain = 6;
        this.settings.midGain = 1;
        this.settings.trebleGain = 5;
        this.settings.vocalClarity = 8;
        this.settings.noiseReduction = true;
        this.settings.frequencyEnhancer = true;
        break;
      case 'speaker':
        this.settings.bassBoostLevel = 'ultra';
        this.settings.bassGain = 8;
        this.settings.midGain = 3;
        this.settings.trebleGain = 4;
        this.settings.vocalClarity = 9;
        this.settings.noiseReduction = true;
        this.settings.frequencyEnhancer = true;
        break;
      case 'quiet':
        this.settings.bassBoostLevel = 'subtle';
        this.settings.bassGain = 3;
        this.settings.midGain = 0;
        this.settings.trebleGain = 2;
        this.settings.vocalClarity = 7;
        this.settings.noiseReduction = false;
        this.settings.frequencyEnhancer = true;
        break;
      case 'noisy':
        this.settings.bassBoostLevel = 'medium';
        this.settings.bassGain = 5;
        this.settings.midGain = 2;
        this.settings.trebleGain = 6;
        this.settings.vocalClarity = 10;
        this.settings.noiseReduction = true;
        this.settings.frequencyEnhancer = true;
        break;
      case 'studio':
        this.settings.bassBoostLevel = 'medium';
        this.settings.bassGain = 4;
        this.settings.midGain = 1;
        this.settings.trebleGain = 6;
        this.settings.vocalClarity = 9;
        this.settings.noiseReduction = true;
        this.settings.frequencyEnhancer = true;
        break;
      case 'auto':
      default:
        this.settings.bassBoostLevel = 'medium';
        this.settings.bassGain = 5;
        this.settings.midGain = 2;
        this.settings.trebleGain = 4;
        this.settings.vocalClarity = 8;
        this.settings.noiseReduction = true;
        this.settings.frequencyEnhancer = true;
        break;
    }
    this.applyDspParameters();
    this.saveSettings();
  }

  public setBassBoostLevel(level: BassBoostLevel) {
    this.settings.bassBoostLevel = level;
    this.applyDspParameters();
    this.saveSettings();
  }

  public updateSetting<K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) {
    this.settings[key] = value;
    this.applyDspParameters();
    this.saveSettings();
  }

  public getAnalyserData(): Uint8Array | null {
    if (!this.analyserNode) return null;
    const buffer = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(buffer);
    return buffer;
  }

  // --- PROCEDURAL AUDIO SYNTHESIZERS ---

  // Connect any synth node to the master DSP chain input
  private connectToDspChain(node: AudioNode) {
    if (this.highPassFilter) {
      node.connect(this.highPassFilter);
    } else if (this.ctx) {
      node.connect(this.ctx.destination);
    }
  }

  // 1. Correct Answer: Rich crystalline Major 9th chime + punchy bass resonance
  public playSuccess() {
    try {
      const ctx = this.initAudioContext();
      const now = ctx.currentTime;

      // Chord frequencies: C5, E5, G5, B5, D6
      const freqs = [523.25, 659.25, 783.99, 987.77, 1174.66];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.22 / (idx + 1), now + idx * 0.06 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.65);

        osc.connect(gain);
        this.connectToDspChain(gain);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.7);
      });

      // Warm Sub-Bass foundation drop (65Hz - 50Hz)
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(70, now);
      bassOsc.frequency.exponentialRampToValueAtTime(45, now + 0.45);

      bassGain.gain.setValueAtTime(0.35, now);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      bassOsc.connect(bassGain);
      this.connectToDspChain(bassGain);
      bassOsc.start(now);
      bassOsc.stop(now + 0.55);
    } catch {
      // Ignore audio errors
    }
  }

  // 2. Wrong Answer: Warm organic double thud (smooth, non-abrasive)
  public playError() {
    try {
      const ctx = this.initAudioContext();
      const now = ctx.currentTime;

      [0, 0.12].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const startFreq = idx === 0 ? 220 : 165;
        osc.frequency.setValueAtTime(startFreq, now + offset);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.6, now + offset + 0.25);

        gain.gain.setValueAtTime(0.28, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.28);

        osc.connect(gain);
        this.connectToDspChain(gain);

        osc.start(now + offset);
        osc.stop(now + offset + 0.3);
      });
    } catch {
      // Ignore
    }
  }

  // 3. Clue Reveal: Mystical crystal shimmer with bass sweep
  public playClue() {
    try {
      const ctx = this.initAudioContext();
      const now = ctx.currentTime;

      // Sparkling high arpeggio
      const notes = [880, 1174.66, 1318.51, 1760];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);

        gain.gain.setValueAtTime(0.001, now + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.15, now + i * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + 0.45);

        osc.connect(gain);
        this.connectToDspChain(gain);

        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.5);
      });

      // Sub-bass whoosh
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(80, now);
      sub.frequency.exponentialRampToValueAtTime(140, now + 0.2);
      sub.frequency.exponentialRampToValueAtTime(60, now + 0.4);

      subGain.gain.setValueAtTime(0.2, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      sub.connect(subGain);
      this.connectToDspChain(subGain);
      sub.start(now);
      sub.stop(now + 0.5);
    } catch {
      // Ignore
    }
  }

  // 4. Click / Tap: Crisp tactile pop
  public playClick() {
    try {
      const ctx = this.initAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      this.connectToDspChain(gain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore
    }
  }

  // 5. Grand Fanfare: End game triumph
  public playFanfare() {
    try {
      const ctx = this.initAudioContext();
      const now = ctx.currentTime;

      const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx < 2 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.25 / Math.sqrt(idx + 1), now + idx * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

        osc.connect(gain);
        this.connectToDspChain(gain);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 1.3);
      });

      // Deep cinematic boom
      const boom = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(90, now);
      boom.frequency.exponentialRampToValueAtTime(35, now + 0.8);

      boomGain.gain.setValueAtTime(0.4, now);
      boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      boom.connect(boomGain);
      this.connectToDspChain(boomGain);
      boom.start(now);
      boom.stop(now + 0.95);
    } catch {
      // Ignore
    }
  }

  // 6. Test Bass Boost
  public playBassTest() {
    try {
      const ctx = this.initAudioContext();
      const now = ctx.currentTime;

      // 808-style punchy bass kick + sub pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
      osc.frequency.setValueAtTime(45, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.8);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.linearRampToValueAtTime(0.45, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      osc.connect(gain);
      this.connectToDspChain(gain);

      osc.start(now);
      osc.stop(now + 0.9);
    } catch {
      // Ignore
    }
  }

  // 7. Test Clarity & High Frequency Enhancer
  public playClarityTest() {
    try {
      const ctx = this.initAudioContext();
      const now = ctx.currentTime;

      const freqs = [1046.5, 1318.5, 1567.98, 2093.0, 2637.0, 3135.9];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.5);

        osc.connect(gain);
        this.connectToDspChain(gain);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.55);
      });
    } catch {
      // Ignore
    }
  }

  // --- SPEECH SYNTHESIS (TTS) ---

  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private keepAliveInterval: number | null = null;

  private initTTS() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const load = () => {
      try {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          this.voices = v;
          this.ttsReady = true;
        }
      } catch {
        // Ignore
      }
    };

    try {
      window.speechSynthesis.onvoiceschanged = load;
      load();
      setTimeout(load, 250);
      setTimeout(load, 1000);
    } catch {
      // Ignore
    }
  }

  public getBestArabicVoice(): SpeechSynthesisVoice | null {
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const currentVoices = window.speechSynthesis.getVoices();
        if (currentVoices && currentVoices.length > 0) {
          this.voices = currentVoices;
        }
      }
    } catch {
      // Ignore
    }

    if (!this.voices || this.voices.length === 0) return null;

    // Prefer high quality Arabic voices
    const arVoices = this.voices.filter(v => 
      v.lang.toLowerCase().startsWith('ar') || 
      v.name.toLowerCase().includes('arabic') ||
      v.name.includes('العربية') ||
      v.name.toLowerCase().includes('maged') ||
      v.name.toLowerCase().includes('tarik') ||
      v.name.toLowerCase().includes('laila') ||
      v.name.toLowerCase().includes('maryam') ||
      v.name.toLowerCase().includes('salma') ||
      v.name.toLowerCase().includes('zayd')
    );

    if (arVoices.length > 0) {
      // Prioritize natural / neural / Saudi / Egyptian / Standard Arabic voices
      return (
        arVoices.find(v => v.lang === 'ar-SA') ||
        arVoices.find(v => v.lang === 'ar-EG') ||
        arVoices.find(v => v.lang === 'ar-AE') ||
        arVoices.find(v => v.lang.startsWith('ar')) ||
        arVoices[0]
      );
    }

    return null;
  }

  public isSpeaking = false;
  private speechListeners: Set<(isSpeaking: boolean) => void> = new Set();

  public subscribeSpeech(listener: (isSpeaking: boolean) => void) {
    this.speechListeners.add(listener);
    return () => {
      this.speechListeners.delete(listener);
    };
  }

  private setSpeaking(speaking: boolean) {
    this.isSpeaking = speaking;
    this.speechListeners.forEach(listener => {
      try {
        listener(speaking);
      } catch {
        // Ignore
      }
    });
  }

  // Arabic Phonetic Normalizer to guarantee 100% accurate pronunciation across all SpeechSynthesis engines
  private normalizeArabicPhonetics(text: string): string {
    if (!text) return '';

    let res = text;

    // Remove any "هل تعلمت اليوم" variations from spoken audio to speak the fact directly
    res = res.replace(/هَلْ\s+تَعَلَّمْتَ\s+الْيَوْمَ[؟?:]?/g, '');
    res = res.replace(/هل\s+تعلمت\s+اليوم[؟?:]?/g, '');
    res = res.replace(/تعلّمت\s+اليوم[؟?:]?/g, '');

    // Specifically handle "ملك الغابة" and variations to strictly enforce "مَلِك" (with fatha on meem)
    res = res.replace(/أنا\s+م[ُِْ]?ل[ُِْ]?ك\s+الغابة/g, 'أَنَا مَلِكُ الْغَابَةِ');
    res = res.replace(/أَنَا\s+م[ُِْ]?ل[ُِْ]?ك\s+الْغَابَةِ?/g, 'أَنَا مَلِكُ الْغَابَةِ');
    res = res.replace(/\bم[ُِْ]?ل[ُِْ]?ك\s+الغابة/g, 'مَلِكُ الْغَابَةِ');
    res = res.replace(/\bم[ُِْ]?ل[ُِْ]?ك\s+الْغَابَةِ?/g, 'مَلِكُ الْغَابَةِ');

    // General common pronunciation enhancements
    res = res.replace(/\bأحسنت\b/g, 'أَحْسَنْتَ');
    res = res.replace(/\bإجابة صحيحة\b/g, 'إِجَابَةٌ صَحِيحَةٌ');
    res = res.replace(/\bالإجابة الصحيحة هي\b/g, 'الْإِجَابَةُ الصَّحِيحَةُ هِيَ');
    res = res.replace(/\bمن أنا\b/g, 'مَنْ أَنَا؟');
    res = res.replace(/\bمعلومة مفيدة\b/g, 'مَعْلُومَةٌ مُفِيدَةٌ:');

    // Common category items pronunciation safeguard
    res = res.replace(/\bالأسد\b/g, 'الْأَسَدُ');
    res = res.replace(/\bالفيل\b/g, 'الْفِيلُ');
    res = res.replace(/\bالببغاء\b/g, 'الْبَبَّغَاءُ');
    res = res.replace(/\bالسمكة\b/g, 'السَّمَكَةُ');
    res = res.replace(/\bالأرنب\b/g, 'الْأَرْنَبُ');
    res = res.replace(/\bالقرد\b/g, 'الْقِرْدُ');
    res = res.replace(/\bالطبيب\b/g, 'الطَّبِيبُ');
    res = res.replace(/\bالمعلم\b/g, 'الْمُعَلِّمُ');
    res = res.replace(/\bرجل الإطفاء\b/g, 'رَجُلُ الْإِطْفَاءِ');
    res = res.replace(/\bالطباخ\b/g, 'الطَّبَّاخُ');
    res = res.replace(/\bالمزارع\b/g, 'الْمُزَارِعُ');
    res = res.replace(/\bالتفاحة\b/g, 'التُّفَّاحَةُ');
    res = res.replace(/\bالموزة\b/g, 'الْمَوْزَةُ');
    res = res.replace(/\bالجزرة\b/g, 'الْجَزَرَةُ');
    res = res.replace(/\bالبطيخ\b/g, 'الْبِطِّيخُ');
    res = res.replace(/\bالفراولة\b/g, 'الْفَرَاوِلَةُ');
    res = res.replace(/\bالمسطرة\b/g, 'الْمِسْطَرَةُ');
    res = res.replace(/\bالقلم الرصاص\b/g, 'الْقَلَمُ الرَّصَاصُ');
    res = res.replace(/\bالمحفظة\b/g, 'الْمِحْفَظَةُ');
    res = res.replace(/\bالسبورة\b/g, 'السَّبُّورَةُ');
    res = res.replace(/\bالكتاب\b/g, 'الْكِتَابُ');
    res = res.replace(/\bالقلب\b/g, 'الْقَلْبُ');
    res = res.replace(/\bالعين\b/g, 'الْعَيْنُ');
    res = res.replace(/\bالأسنان\b/g, 'الْأَسْنَانُ');
    res = res.replace(/\bالدماغ\b/g, 'الدِّمَاغُ');
    res = res.replace(/\bاليد\b/g, 'الْيَدُ');
    res = res.replace(/\bالأذن\b/g, 'الْأُذُنُ');
    res = res.replace(/\bالطائرة\b/g, 'الطَّائِرَةُ');
    res = res.replace(/\bالقطار\b/g, 'الْقِطَارُ');
    res = res.replace(/\bالسفينة\b/g, 'السَّفِينَةُ');
    res = res.replace(/\bالدراجة\b/g, 'الدَّرَّاجَةُ');
    res = res.replace(/\bسيارة الإسعاف\b/g, 'سَيَّارَةُ الْإِسْعَافِ');
    res = res.replace(/\bالحافلة المدرسية\b/g, 'الْحَافِلَةُ الْمَدْرَسِيَّةُ');

    return res.trim();
  }

  // Split text into natural, digestible speech chunks to prevent Web Speech API truncation
  private splitIntoSpeechChunks(text: string): string[] {
    if (!text) return [];

    // Split on punctuation (. ! ؟ \n)
    const rawParts = text.split(/([.!؟\n]+)/);
    const chunks: string[] = [];
    let buffer = '';

    for (let i = 0; i < rawParts.length; i++) {
      const part = rawParts[i];
      if (!part) continue;

      if (/^[.!؟\n]+$/.test(part)) {
        if (buffer.trim()) {
          chunks.push(buffer.trim());
          buffer = '';
        }
      } else {
        buffer += (buffer ? ' ' : '') + part.trim();
        if (buffer.length > 90) {
          chunks.push(buffer.trim());
          buffer = '';
        }
      }
    }

    if (buffer.trim()) {
      chunks.push(buffer.trim());
    }

    return chunks.filter(c => c.length > 0);
  }

  private currentSpeechSessionId = 0;
  private activeUtterancesSet: Set<SpeechSynthesisUtterance> = new Set();

  public speak(text: string, onEndCallback?: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const normalizedText = this.normalizeArabicPhonetics(text);
    if (!normalizedText.trim()) return;

    try {
      this.currentSpeechSessionId++;
      const currentSession = this.currentSpeechSessionId;

      window.speechSynthesis.cancel();
      this.activeUtterancesSet.clear();
      this.setSpeaking(false);

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const chunks = this.splitIntoSpeechChunks(normalizedText);
      if (chunks.length === 0) return;

      const voice = this.getBestArabicVoice();
      let index = 0;

      const playNext = () => {
        if (currentSession !== this.currentSpeechSessionId) return;

        if (index >= chunks.length) {
          this.setSpeaking(false);
          this.activeUtterancesSet.clear();
          if (onEndCallback) onEndCallback();
          return;
        }

        const rawChunk = chunks[index];
        index++;

        // Clean punctuation marks that choke the engine
        const cleanChunk = rawChunk.replace(/[!؟]/g, '،').trim();
        if (!cleanChunk) {
          playNext();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(cleanChunk);
        this.activeUtterancesSet.add(utterance);
        (window as any).__speechUtterance = utterance;

        if (voice) {
          utterance.voice = voice;
        }
        utterance.lang = 'ar-SA';
        utterance.rate = Math.max(0.75, Math.min(1.15, this.settings.ttsRate));
        utterance.pitch = 1.0;
        utterance.volume = Math.max(0.1, Math.min(1.0, this.settings.ttsVolume * this.settings.volume));

        utterance.onstart = () => {
          if (currentSession === this.currentSpeechSessionId) {
            this.setSpeaking(true);
          }
        };

        utterance.onend = () => {
          this.activeUtterancesSet.delete(utterance);
          if (currentSession === this.currentSpeechSessionId) {
            playNext();
          }
        };

        utterance.onerror = (e) => {
          this.activeUtterancesSet.delete(utterance);
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn('Speech chunk error:', e);
          }
          if (currentSession === this.currentSpeechSessionId) {
            playNext();
          }
        };

        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          this.setSpeaking(false);
        }
      };

      setTimeout(() => {
        if (currentSession === this.currentSpeechSessionId) {
          playNext();
        }
      }, 40);

    } catch (err) {
      console.warn('Failed to speak text:', err);
      this.setSpeaking(false);
    }
  }

  public stopSpeaking() {
    try {
      this.currentSpeechSessionId++;
      this.activeUtterancesSet.clear();
      this.setSpeaking(false);
      (window as any).__speechUtterance = null;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // Ignore
    }
  }
}

export const soundEngine = new SoundEngine();
