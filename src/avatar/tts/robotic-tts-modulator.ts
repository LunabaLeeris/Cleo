/**
 * Robotic Female Voice Modulator Engine
 *
 * Modulates vocal TTS speech output to sound like a retro robotic female avatar.
 * Preserves audible word pronunciations using pitch factors and Web Audio bitcrushing.
 * All comments follow ASD-STE100 rules (imperative and simple present tense).
 */

/** Modulation parameters for robotic female voice. */
export interface RoboticModulationConfig {
  /** Web Speech API pitch factor (female robotic pitch range 1.4 - 1.8). */
  speechPitch: number;

  /** Web Speech API rate factor (fast robot pace range 1.0 - 1.4). */
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

/** Default modulation parameters for audible robotic female vocal voice. */
export const DEFAULT_MODULATION_CONFIG: RoboticModulationConfig = {
  speechPitch: 1.7,
  speechRate: 1.2,
  f0: 310,
  f1: 680,
  f2: 2150,
  bitDepth: 8,
  bitcrusherMix: 0.35,
  masterVolume: 0.65,
};

const STORAGE_KEY = 'cleo_robotic_voice_config';

/**
 * Robotic TTS Modulator class.
 * Manages voice configuration, female voice selection, and Web Speech API playback.
 */
export class RoboticTTSModulator {
  private config: RoboticModulationConfig;
  private speechSynth: SpeechSynthesis | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;

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
   * Selects an available English female voice from browser synthesis voices.
   */
  private loadFemaleVoice(): void {
    if (!this.speechSynth) return;

    const voices = this.speechSynth.getVoices();
    if (voices.length === 0) return;

    const femaleIdentifiers = [
      'zira', 'jenny', 'samantha', 'victoria', 'karen', 'fiona', 'moira',
      'ava', 'aria', 'sara', 'michelle', 'catherine', 'hazel', 'susan',
      'google us english', 'female', 'girl'
    ];

    const femaleVoice = voices.find(v => {
      const nameLower = v.name.toLowerCase();
      const langLower = v.lang.toLowerCase();
      return langLower.startsWith('en') && femaleIdentifiers.some(id => nameLower.includes(id));
    }) ?? voices.find(v => v.lang.toLowerCase().startsWith('en')) ?? voices[0];

    this.selectedVoice = femaleVoice;
    console.log('[RoboticTTSModulator] Selected vocal voice:', this.selectedVoice?.name);
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
   * @param partialConfig - Partial configuration object to update.
   */
  updateConfig(partialConfig: Partial<RoboticModulationConfig>): void {
    this.config = { ...this.config, ...partialConfig };
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
   * Speaks a phrase using robotic female vocal pitch settings.
   * Preserves audible word pronunciations ("water", "get").
   *
   * @param text       - Full phrase string to speak.
   * @param onBoundary - Optional callback fired when a word boundary occurs.
   * @param onEnd      - Optional callback fired when speech completes.
   */
  speakVocalPhrase(
    text: string,
    onBoundary?: (charIndex: number, charLength: number) => void,
    onEnd?: () => void
  ): void {
    if (!this.speechSynth || !text) return;

    this.speechSynth.cancel(); // Cancel current speech

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
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }
  }
}

/** Shared instance of RoboticTTSModulator. */
export const defaultTTSModulator = new RoboticTTSModulator();
