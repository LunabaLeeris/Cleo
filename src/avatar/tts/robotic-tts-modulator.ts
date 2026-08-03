/**
 * Dynamic Robotic TTS Modulator Engine
 *
 * Provides dynamic voice modulation parameters for robotic female speech.
 * Includes Web Audio bitcrusher, formant filters, and localStorage config.
 * All comments follow ASD-STE100 rules (imperative and simple present tense).
 */

/** Modulation parameters for robotic female 8-bit game voice. */
export interface RoboticModulationConfig {
  /** Web Speech API pitch factor (range 1.0 - 2.0). */
  speechPitch: number;

  /** Web Speech API rate factor (range 0.5 - 2.0). */
  speechRate: number;

  /** Fundamental vocal pitch frequency in Hz (female F0 range 260 - 360Hz). */
  f0: number;

  /** Primary vocal formant frequency in Hz (F1). */
  f1: number;

  /** Secondary vocal formant frequency in Hz (F2). */
  f2: number;

  /** Bitcrusher quantization bit depth (range 4 - 16). */
  bitDepth: number;

  /** Bitcrusher wet mix level from 0.0 (clean) to 1.0 (full 8-bit). */
  bitcrusherMix: number;

  /** Master volume gain output level from 0.0 (silent) to 1.0 (max). */
  masterVolume: number;
}

/** Default modulation parameters for retro robotic female voice. */
export const DEFAULT_MODULATION_CONFIG: RoboticModulationConfig = {
  speechPitch: 1.6,
  speechRate: 1.1,
  f0: 310,
  f1: 680,
  f2: 2150,
  bitDepth: 8,
  bitcrusherMix: 0.45,
  masterVolume: 0.6,
};

const STORAGE_KEY = 'cleo_robotic_voice_config';

/**
 * Robotic TTS Modulator class.
 * Manages modulation parameters, localStorage persistence, and Web Audio effects.
 */
export class RoboticTTSModulator {
  private config: RoboticModulationConfig;
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    this.config = this.loadSavedConfig();
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
   * Updates modulation parameters dynamically.
   *
   * @param partialConfig - Partial configuration object with parameters to update.
   */
  updateConfig(partialConfig: Partial<RoboticModulationConfig>): void {
    this.config = { ...this.config, ...partialConfig };
    if (this.masterGain && this.audioCtx && partialConfig.masterVolume !== undefined) {
      this.masterGain.gain.setValueAtTime(this.config.masterVolume, this.audioCtx.currentTime);
    }
  }

  /**
   * Saves current modulation parameters to localStorage as default config.
   */
  saveConfig(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
        console.log('[RoboticTTSModulator] Saved modulation config to localStorage.');
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
   * Initializes Web Audio Context and master gain node.
   */
  initAudio(): void {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch((err) => {
          console.warn('[RoboticTTSModulator] AudioContext resume failed:', err);
        });
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.config.masterVolume, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
    } catch (err) {
      console.warn('[RoboticTTSModulator] Failed to initialize AudioContext:', err);
    }
  }

  /**
   * Gets Web Audio Context current timestamp in seconds.
   *
   * @returns Current AudioContext time in seconds.
   */
  getCurrentTime(): number {
    return this.audioCtx?.currentTime ?? 0;
  }

  /**
   * Synthesizes 8-bit pixelated female vocal audio for a word.
   * Applies formant filtering, pitch modulation, and bitcrushing.
   *
   * @param word       - Lowercase word string.
   * @param durationMs - Sound duration in milliseconds.
   * @param startTime  - AudioContext start timestamp in seconds.
   */
  playModulatedWordSound(word: string, durationMs: number, startTime: number): void {
    if (!word) return;

    this.initAudio();
    if (!this.audioCtx || !this.masterGain) return;

    const durationSec = Math.max(0.06, durationMs / 1000);
    const stopTime = startTime + durationSec;

    const { f0, f1, f2, bitDepth, bitcrusherMix } = this.config;

    // Gain envelope for word segment
    const wordGain = this.audioCtx.createGain();
    wordGain.gain.setValueAtTime(0.001, startTime);
    const attack = Math.min(0.01, durationSec * 0.15);
    wordGain.gain.exponentialRampToValueAtTime(0.4, startTime + attack);
    const release = Math.min(0.02, durationSec * 0.25);
    wordGain.gain.setValueAtTime(0.4, stopTime - release);
    wordGain.gain.exponentialRampToValueAtTime(0.001, stopTime);

    // 1. Primary Vocal Oscillator (Sawtooth tone for 8-bit game sound)
    const osc = this.audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f0, startTime);
    osc.frequency.exponentialRampToValueAtTime(f0 * 1.05, startTime + durationSec * 0.5);
    osc.frequency.exponentialRampToValueAtTime(f0 * 0.95, stopTime);

    // 2. Formant Filter 1 (F1)
    const filter1 = this.audioCtx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(f1, startTime);
    filter1.Q.setValueAtTime(5, startTime);

    // 3. Formant Filter 2 (F2)
    const filter2 = this.audioCtx.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(f2, startTime);
    filter2.Q.setValueAtTime(4, startTime);

    // 4. Bitcrusher Effect (Quantization distortion node)
    const crusher = this.createBitcrusherNode(this.audioCtx, bitDepth, bitcrusherMix);

    osc.connect(filter1);
    osc.connect(filter2);

    filter1.connect(crusher);
    filter2.connect(crusher);

    crusher.connect(wordGain);
    wordGain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(stopTime);
  }

  /**
   * Creates a bitcrusher quantization AudioNode.
   *
   * @param ctx   - Active AudioContext.
   * @param depth - Bit depth (e.g. 8 for 8-bit audio).
   * @param mix   - Wet mix level from 0.0 to 1.0.
   * @returns Bitcrusher ScriptProcessor / AudioNode.
   */
  private createBitcrusherNode(ctx: AudioContext, depth: number, mix: number): AudioNode {
    const step = Math.pow(0.5, depth);
    const bufferSize = 4096;

    // Use ScriptProcessorNode for wide browser compatibility
    const crusher = ctx.createScriptProcessor(bufferSize, 1, 1);

    crusher.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < input.length; i++) {
        const sample = input[i];
        // Quantize sample to discrete bit depth steps
        const crushed = Math.round(sample / step) * step;
        output[i] = sample * (1 - mix) + crushed * mix;
      }
    };

    return crusher;
  }
}

/** Shared instance of RoboticTTSModulator. */
export const defaultTTSModulator = new RoboticTTSModulator();
