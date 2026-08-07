import type {
  PrimaryEmotion,
  EmotionalState,
  BehavioralData,
  PlutchikEmotion,
} from './emotion-types';
import { PRIMARY_EMOTIONS } from './emotion-types';

/**
 * Canonical dyad mapping dictionary for Plutchik's Wheel of Emotions.
 * Keyed by alphabetically sorted emotion pair (e.g. "joy+trust").
 */
const PLUTCHIK_DYAD_MAP: Record<string, PlutchikEmotion> = {
  // --- Primary Dyads (Adjacent on wheel) ---
  'joy+trust': 'Love',
  'fear+trust': 'Submission',
  'fear+surprise': 'Awe',
  'sadness+surprise': 'Disapproval',
  'disgust+sadness': 'Remorse',
  'anger+disgust': 'Contempt',
  'anger+anticipation': 'Aggression',
  'anticipation+joy': 'Optimism',

  // --- Secondary Dyads (One apart on wheel) ---
  'fear+joy': 'Guilt',
  ['surprise+trust' as string]: 'Curiosity',
  'fear+sadness': 'Despair',
  'disgust+surprise': 'Unbelief',
  'anger+sadness': 'Disappointment',
  'anticipation+disgust': 'Cynicism',
  'anger+joy': 'Pride',
  'anticipation+trust': 'Hope',

  // --- Tertiary Dyads (Two apart on wheel) ---
  'joy+surprise': 'Delight',
  'sadness+trust': 'Sentimentality',
  'disgust+fear': 'Shame',
  'anger+surprise': 'Outrage',
  'anticipation+sadness': 'Pessimism',
  'disgust+joy': 'Morbidness',
  'anger+trust': 'Dominance',
  'anticipation+fear': 'Anxiety',

  // --- Opposite Dyads (Across from each other on wheel) ---
  'joy+sadness': 'Bittersweet',
  'disgust+trust': 'Ambivalence',
  'anger+fear': 'Conflict',
  'anticipation+surprise': 'Confusion',
};

/**
 * Single dominant primary emotion fallbacks when second dyad emotion is negligible.
 */
const PRIMARY_SINGLE_FALLBACK: Record<PrimaryEmotion, PlutchikEmotion> = {
  joy: 'Joyful',
  trust: 'Trusting',
  fear: 'Fearful',
  surprise: 'Surprised',
  sadness: 'Sad',
  disgust: 'Disgusted',
  anger: 'Angry',
  anticipation: 'Expectant',
};

/**
 * Manages the 8 primary emotional states, applies behavioral updates,
 * handles idle state decay, and resolves overall emotion via Plutchik's Wheel.
 */
export class EmotionsOrchestrator {
  private state: EmotionalState;
  private lastActivityTimestamp: number;
  private idleDecayDelayMs: number;
  private decayRatePerSec: number;

  constructor(
    initialState?: Partial<EmotionalState>,
    idleDecayDelayMs: number = 10000, // 10 seconds of idle before decay starts
    decayRatePerSec: number = 0.05    // 5% decay per second when idle
  ) {
    this.state = {
      joy: 0,
      trust: 0,
      fear: 0,
      surprise: 0,
      sadness: 0,
      disgust: 0,
      anger: 0,
      anticipation: 0,
      ...initialState,
    };
    this.lastActivityTimestamp = Date.now();
    this.idleDecayDelayMs = idleDecayDelayMs;
    this.decayRatePerSec = decayRatePerSec;
  }

  /**
   * Returns a copy of the current emotional state.
   */
  getState(): EmotionalState {
    return { ...this.state };
  }

  /**
   * Manually override or set state for frontend testing / debug tools.
   */
  setState(newState: Partial<EmotionalState>): void {
    for (const [emotion, val] of Object.entries(newState)) {
      if (emotion in this.state && typeof val === 'number') {
        this.state[emotion as PrimaryEmotion] = Math.max(0, Math.min(1, val));
      }
    }
    this.touchActivity();
  }

  /**
   * Apply behavioral data deltas returned by the LLM response.
   */
  applyBehavioralData(deltas: BehavioralData): void {
    for (const [emotion, delta] of Object.entries(deltas)) {
      if (emotion in this.state && typeof delta === 'number') {
        const current = this.state[emotion as PrimaryEmotion];
        this.state[emotion as PrimaryEmotion] = Math.max(0, Math.min(1, current + delta));
      }
    }
    this.touchActivity();
  }

  /**
   * Reset activity timestamp to present time.
   */
  touchActivity(): void {
    this.lastActivityTimestamp = Date.now();
  }

  /**
   * Periodically update idle decay over time.
   *
   * @param nowTimestamp - Current timestamp in ms (defaults to Date.now()).
   */
  updateIdleDecay(nowTimestamp: number = Date.now()): void {
    const idleMs = nowTimestamp - this.lastActivityTimestamp;
    if (idleMs < this.idleDecayDelayMs) {
      return;
    }

    const decayTicks = (idleMs - this.idleDecayDelayMs) / 1000;
    const decayAmount = this.decayRatePerSec * decayTicks;

    for (const emotion of PRIMARY_EMOTIONS) {
      if (this.state[emotion] > 0) {
        this.state[emotion] = Math.max(0, this.state[emotion] - decayAmount);
      }
    }

    // Advance timestamp so decay doesn't stack exponentially
    this.lastActivityTimestamp = nowTimestamp;
  }

  /**
   * Returns the top N primary emotions sorted by intensity descending.
   */
  getTopEmotions(count: number = 2): Array<{ emotion: PrimaryEmotion; intensity: number }> {
    return PRIMARY_EMOTIONS.map((e) => ({
      emotion: e,
      intensity: this.state[e],
    }))
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, count);
  }

  /**
   * Resolve a pair of primary emotions into a Plutchik Dyad.
   */
  static resolveDyad(e1: PrimaryEmotion, e2: PrimaryEmotion): PlutchikEmotion {
    if (e1 === e2) {
      return PRIMARY_SINGLE_FALLBACK[e1];
    }
    const key = [e1, e2].sort().join('+');
    return PLUTCHIK_DYAD_MAP[key] ?? PRIMARY_SINGLE_FALLBACK[e1];
  }

  /**
   * Calculate overall emotion of the avatar using Plutchik's Wheel dyad matrix.
   */
  getOverallEmotion(): PlutchikEmotion {
    const top2 = this.getTopEmotions(2);
    const primary = top2[0];
    const secondary = top2[1];

    // Thresholds for emotion detection
    if (!primary || primary.intensity < 0.05) {
      return 'Neutral';
    }

    // If secondary emotion is non-existent or < 20% of primary intensity, fallback to single primary
    if (!secondary || secondary.intensity < 0.05 || secondary.intensity / primary.intensity < 0.2) {
      return PRIMARY_SINGLE_FALLBACK[primary.emotion];
    }

    return EmotionsOrchestrator.resolveDyad(primary.emotion, secondary.emotion);
  }
}
