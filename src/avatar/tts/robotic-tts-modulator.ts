/**
 * Robotic Female Voice Modulator Engine
 *
 * Modulates vocal TTS speech output to sound like a retro robotic female avatar (Wall-E style).
 * Preserves audible word pronunciations using pitch factors, formant filters, and Web Audio synthesis.
 * All comments follow ASD-STE100 rules (imperative and simple present tense).
 */

/** Modulation parameters for robotic female voice. */
export interface RoboticModulationConfig {
  /** Web Speech API pitch factor (range 0.5 - 3.0). */
  speechPitch: number;

  /** Web Speech API rate factor (range 0.2 - 3.5). */
  speechRate: number;

  /** Fundamental vocal pitch frequency in Hz (F0 range 100 - 800Hz). */
  f0: number;

  /** Primary vocal formant frequency in Hz (F1 range 200 - 2500Hz). */
  f1: number;

  /** Secondary vocal formant frequency in Hz (F2 range 800 - 5000Hz). */
  f2: number;

  /** Vibrato / Tremolo LFO rate in Hz (range 0 - 20Hz). */
  vibratoRate: number;

  /** Vibrato / Tremolo LFO depth intensity (range 0.0 - 1.0). */
  vibratoDepth: number;

  /** Overdrive / 8-bit distortion crunch intensity (range 0.0 - 1.0). */
  distortion: number;

  /** Metallic ring modulation carrier frequency in Hz (range 0 - 500Hz). */
  ringModFreq: number;

  /** Bitcrusher quantization bit depth (range 4 - 16). */
  bitDepth: number;

  /** Bitcrusher wet mix level from 0.0 (clean) to 1.0 (full 8-bit). */
  bitcrusherMix: number;

  /** Master volume gain output level from 0.0 (silent) to 1.5 (max). */
  masterVolume: number;

  /** Robot harmonic tone blend level from 0.0 (vocal only) to 1.0 (Wall-E synth overlay). */
  robotToneBlend: number;
}

/** Alias for RoboticModulationConfig. */
export type TTSModulatorConfig = RoboticModulationConfig;

/** Measured Web Speech API word boundary event data. */
export interface TTSBoundaryEvent {
  /** Text character index where word starts. */
  charIndex: number;

  /** Word character length. */
  charLength: number;

  /** Milliseconds elapsed since utterance playback started. */
  elapsedMs: number;
}

/** Complete TTS phrase boundary measurement result. */
export interface TTSMeasurementResult {
  /** Array of recorded word boundary events. */
  events: TTSBoundaryEvent[];

  /** Total elapsed phrase duration in milliseconds. */
  totalDurationMs: number;
}

/** Default modulation parameters for audible robotic female vocal voice. */
export const DEFAULT_MODULATION_CONFIG: RoboticModulationConfig = {
  speechPitch: 1.75,
  speechRate: 2.7,
  f0: 280,
  f1: 630,
  f2: 2225,
  vibratoRate: 5.5,
  vibratoDepth: 0.25,
  distortion: 0.4,
  ringModFreq: 0,
  bitDepth: 8,
  bitcrusherMix: 0.35,
  masterVolume: 0.65,
  robotToneBlend: 0.25,
};

const STORAGE_KEY = 'cleo_robotic_voice_config';

export type ConfigChangeListener = (config: RoboticModulationConfig) => void;

/**
 * Robotic TTS Modulator class.
 * Manages voice configuration, female voice selection, and Web Speech API + Web Audio playback.
 */
export class RoboticTTSModulator {
  private config: RoboticModulationConfig;
  private speechSynth: SpeechSynthesis | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private audioCtx: AudioContext | null = null;
  private listeners: Set<ConfigChangeListener> = new Set();

  constructor() {
    this.config = this.loadSavedConfig();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.speechSynth = window.speechSynthesis;
      this.loadFemaleVoice();
      if (this.speechSynth) {
        this.speechSynth.onvoiceschanged = () => this.loadFemaleVoice();
      }
    }
  }

  /**
   * Pre-warms Web AudioContext, hardware audio drivers, and SpeechSynthesis engine to prevent latency.
   */
  preWarm(): void {
    if (typeof window === 'undefined') return;

    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }

    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      // Prime OS audio drivers / WASAPI / Bluetooth receivers with a 10ms silent buffer
      try {
        const buffer = this.audioCtx.createBuffer(1, 441, 44100);
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);
        source.start(0);
      } catch {
        // Ignore background audio policy errors before user interaction
      }
    }

    if (this.speechSynth && this.speechSynth.paused) {
      this.speechSynth.resume();
    }
  }

  /**
   * Selects Microsoft Zira exclusively as default voice (with fallback to English female voice).
   */
  private loadFemaleVoice(): void {
    if (!this.speechSynth) return;

    const voices = this.speechSynth.getVoices();
    if (voices.length === 0) return;

    // Exclusively lock default to Microsoft Zira
    const ziraVoice = voices.find(v => v.name.toLowerCase().includes('zira'));
    if (ziraVoice) {
      this.selectedVoice = ziraVoice;
    } else {
      const femaleIdentifiers = [
        'zira', 'jenny', 'samantha', 'victoria', 'karen', 'fiona', 'moira',
        'ava', 'aria', 'sara', 'michelle', 'catherine', 'hazel', 'susan',
        'google us english', 'female', 'girl'
      ];
      this.selectedVoice = voices.find(v => {
        const nameLower = v.name.toLowerCase();
        const langLower = v.lang.toLowerCase();
        return langLower.startsWith('en') && femaleIdentifiers.some(id => nameLower.includes(id));
      }) ?? voices.find(v => v.lang.toLowerCase().startsWith('en')) ?? voices[0];
    }

    console.log('[RoboticTTSModulator] Locked default voice:', this.selectedVoice?.name);
  }

  /**
   * Retrieves active selected voice.
   */
  getSelectedVoice(): SpeechSynthesisVoice | null {
    return this.selectedVoice;
  }

  /**
   * Retrieves list of available browser synthesis voices.
   */
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.speechSynth) return [];
    return this.speechSynth.getVoices();
  }

  /**
   * Voice selection is locked to Microsoft Zira.
   */
  setVoice(_voiceName: string): void {
    // Retain locked Microsoft Zira voice selection
    this.loadFemaleVoice();
  }

  /**
   * Retrieves active modulation config parameters.
   *
   * @returns Current RoboticModulationConfig object copy.
   */
  getConfig(): RoboticModulationConfig {
    return { ...this.config };
  }

  /**
   * Updates modulation parameters dynamically and notifies listeners.
   *
   * @param partialConfig - Partial configuration object to update.
   */
  updateConfig(partialConfig: Partial<RoboticModulationConfig>): void {
    this.config = { ...this.config, ...partialConfig };
    this.notifyListeners();
  }

  /**
   * Subscribes a listener callback to config update events.
   */
  subscribeConfigChange(listener: ConfigChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.getConfig());
      } catch (err) {
        console.error('[RoboticTTSModulator] Error in config listener:', err);
      }
    }
  }

  /**
   * Saves current modulation parameters to localStorage as default config.
   */
  saveConfig(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
        console.log('[RoboticTTSModulator] Saved config to localStorage.');
      }
    } catch (err) {
      console.warn('[RoboticTTSModulator] Failed to save config to localStorage:', err);
    }
  }

  /**
   * Resets modulation configuration to default factory values.
   */
  resetToDefault(): void {
    this.config = { ...DEFAULT_MODULATION_CONFIG };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.warn('[RoboticTTSModulator] Failed to clear stored config:', err);
    }
    this.notifyListeners();
  }

  /**
   * Loads saved modulation configuration from localStorage.
   *
   * @returns Saved RoboticModulationConfig or factory defaults.
   */
  private loadSavedConfig(): RoboticModulationConfig {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...DEFAULT_MODULATION_CONFIG, ...parsed };
        }
      }
    } catch (err) {
      console.warn('[RoboticTTSModulator] Failed to load saved config:', err);
    }
    return { ...DEFAULT_MODULATION_CONFIG };
  }

  /**
   * Measures actual TTS word boundary timestamps using a silent synthesis pass.
   *
   * @param text - Full phrase string to measure.
   * @returns Promise resolving to TTSMeasurementResult object or null if unavailable.
   */
  async measurePhraseTimings(text: string): Promise<TTSMeasurementResult | null> {
    const synth = this.speechSynth;
    if (typeof window === 'undefined' || !synth || !text || text.trim().length === 0) {
      return null;
    }

    return new Promise((resolve) => {
      try {
        this.preWarm();
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
        }

        utterance.pitch = this.config.speechPitch;
        utterance.rate = this.config.speechRate;
        utterance.volume = 0; // Silent measurement pass

        const events: TTSBoundaryEvent[] = [];
        let startTime = 0;
        let resolved = false;

        const cleanupAndResolve = (result: TTSMeasurementResult | null) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            resolve(result);
          }
        };

        const timeoutMs = Math.max(1500, Math.min(8000, text.length * 100));
        const timeoutId = setTimeout(() => {
          if (events.length > 0) {
            const lastEvent = events[events.length - 1];
            const totalDurationMs = lastEvent.elapsedMs + 200;
            cleanupAndResolve({ events, totalDurationMs });
          } else {
            cleanupAndResolve(null);
          }
        }, timeoutMs);

        utterance.onstart = () => {
          startTime = performance.now();
        };

        utterance.onboundary = (e) => {
          if (e.name === 'word') {
            const elapsedMs = Math.max(0, Math.round(startTime > 0 ? performance.now() - startTime : 0));
            events.push({
              charIndex: e.charIndex,
              charLength: e.charLength || 0,
              elapsedMs,
            });
          }
        };

        utterance.onend = () => {
          const totalDurationMs = Math.max(0, Math.round(startTime > 0 ? performance.now() - startTime : 0));
          // Wait 60ms to let browser speech engine fully transition to idle
          setTimeout(() => {
            cleanupAndResolve({ events, totalDurationMs });
          }, 60);
        };

        utterance.onerror = () => {
          setTimeout(() => {
            cleanupAndResolve(events.length > 0 ? { events, totalDurationMs: events[events.length - 1].elapsedMs + 200 } : null);
          }, 60);
        };

        synth.speak(utterance);
      } catch (err) {
        console.warn('[RoboticTTSModulator] Timing measurement error:', err);
        resolve(null);
      }
    });
  }

  /**
   * Speaks a single word with Wall-E robotic pitch modulation and harmonic chime overlay.
   * Preserves audible word pronunciation ("water", "get").
   *
   * @param word       - Single word text string to speak.
   * @param durationMs - Estimated duration for robotic harmonic tone sweep.
   * @param onEnd      - Optional completion callback.
   */
  speakWord(word: string, durationMs = 300, onEnd?: () => void): void {
    if (!word) return;

    this.preWarm();

    // 1. Play robotic Wall-E synthesized harmonic chime via Web Audio
    if (this.audioCtx && this.config.robotToneBlend > 0.05) {
      this.playRoboticToneOverlay(word, durationMs);
    }

    // 2. Play vocal TTS word enunciation via SpeechSynthesis (scaled inversely by robotToneBlend)
    const vocalVolume = this.config.masterVolume * Math.max(0, 1 - this.config.robotToneBlend);
    if (this.speechSynth && vocalVolume > 0.01) {
      if (this.speechSynth.speaking || this.speechSynth.pending) {
        this.speechSynth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(word);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      utterance.pitch = this.config.speechPitch;
      utterance.rate = this.config.speechRate;
      utterance.volume = vocalVolume;

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      this.speechSynth.speak(utterance);
    } else if (onEnd) {
      setTimeout(onEnd, durationMs);
    }
  }

  /**
   * Plays a Wall-E style robotic pitch-chirp harmonic tone sweep overlay.
   */
  private playRoboticToneOverlay(word: string, durationMs: number): void {
    if (!this.audioCtx) return;

    try {
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const durSec = Math.max(0.1, durationMs / 1000);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter1 = ctx.createBiquadFilter();
      const filter2 = ctx.createBiquadFilter();

      // Wall-E style pitch contour: starts at F0, sweeps upward slightly
      const startFreq = this.config.f0;
      const endFreq = startFreq * 1.15;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + durSec);

      // Vibrato / Tremolo LFO Pitch Wobble
      if (this.config.vibratoRate > 0 && this.config.vibratoDepth > 0.01) {
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(this.config.vibratoRate, now);
        lfoGain.gain.setValueAtTime(startFreq * this.config.vibratoDepth * 0.15, now);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(now);
        lfo.stop(now + durSec);
      }

      // Primary Formant Filter (F1)
      filter1.type = 'bandpass';
      filter1.frequency.setValueAtTime(this.config.f1, now);
      filter1.Q.setValueAtTime(4.0, now);

      // Secondary Formant Filter (F2)
      filter2.type = 'bandpass';
      filter2.frequency.setValueAtTime(this.config.f2, now);
      filter2.Q.setValueAtTime(3.0, now);

      osc.connect(filter1);
      osc.connect(filter2);

      let lastNode: AudioNode = filter1;

      // Optional Distortion / Overdrive Shaper
      if (this.config.distortion > 0.05) {
        const waveshaper = ctx.createWaveShaper();
        const k = this.config.distortion * 25;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
          const x = (i * 2) / n_samples - 1;
          curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }
        waveshaper.curve = curve;
        filter1.connect(waveshaper);
        filter2.connect(waveshaper);
        lastNode = waveshaper;
      }

      // Volume envelope aligned with robotToneBlend
      const maxVol = 0.45 * this.config.masterVolume * Math.max(0.2, this.config.robotToneBlend);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(maxVol, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durSec);

      if (this.config.distortion <= 0.05) {
        filter1.connect(gain);
        filter2.connect(gain);
      } else {
        lastNode.connect(gain);
      }

      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + durSec);
    } catch (err) {
      console.warn('[RoboticTTSModulator] Web Audio synth error:', err);
    }
  }

  /**
   * Speaks a full phrase continuously with robotic female vocal pitch settings.
   */
  speakVocalPhrase(
    text: string,
    onBoundary?: (charIndex: number, charLength: number) => void,
    onEnd?: () => void
  ): void {
    if (!this.speechSynth || !text) return;

    this.preWarm();
    this.speechSynth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.pitch = this.config.speechPitch;
    utterance.rate = this.config.speechRate;
    utterance.volume = this.config.masterVolume;

    if (onBoundary) {
      utterance.onboundary = (e) => {
        if (e.name === 'word') {
          onBoundary(e.charIndex, e.charLength || 0);
        }
      };
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    this.speechSynth.speak(utterance);
  }

  /**
   * Stops active vocal TTS speech output immediately.
   */
  stopSpeech(): void {
    if (this.speechSynth && (this.speechSynth.speaking || this.speechSynth.pending)) {
      this.speechSynth.cancel();
    }
  }
}

/** Shared instance of RoboticTTSModulator. */
export const defaultTTSModulator = new RoboticTTSModulator();
