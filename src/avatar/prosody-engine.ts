/**
 * Prosody Engine — Phrase-Level Speech Rhythm Analysis
 *
 * This module analyzes a phrase and produces a prosody profile.
 * The profile controls three dimensions of speech rhythm:
 *
 *   1. Speed factors    — multiplier per word (< 1.0 = slower, > 1.0 = faster)
 *   2. Inter-word pauses — gap ticks between words (0 = no gap)
 *   3. Emphasis levels   — per-word emphasis (affects stressed-syllable hold)
 *
 * The engine models these patterns of natural English speech:
 *   - Function words are faster than content words.
 *   - Phrases start slightly slower (onset deceleration).
 *   - Words before punctuation are slightly elongated (pre-boundary lengthening).
 *   - Mid-phrase content words accelerate slightly.
 *   - Question-final words are elongated (rising intonation).
 *   - Emphatic words ("never", "always", "very") get extra stress.
 */

import type { SpeechToken } from './speak-frame-map';
import { lookupWord } from './cmu-dict';

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

/** Prosody profile produced by analyzeProsody(). */
export interface ProsodyProfile {
  /** Speed multiplier per word. 1.0 = normal. < 1.0 = slower. > 1.0 = faster. */
  speedFactors: number[];

  /** Number of neutral-gap ticks to insert after each word (before the next). */
  interWordPauses: number[];

  /** Emphasis level per word. 0 = no emphasis, 1 = normal, 2 = strong. */
  emphasisLevels: number[];
}

// ---------------------------------------------------------------------------
//  Word classification sets
// ---------------------------------------------------------------------------

/**
 * Function words — spoken quickly, low emphasis.
 */
const FUNCTION_WORDS = new Set([
  'a', 'an', 'the',
  'i', 'me', 'my', 'we', 'he', 'she', 'it', 'you', 'they', 'them',
  'is', 'am', 'are', 'was', 'were', 'be', 'been',
  'do', 'did', 'does',
  'to', 'of', 'in', 'on', 'at', 'or', 'and', 'but', 'so', 'if',
  'for', 'with', 'from', 'up', 'by', 'as',
  'has', 'had', 'have',
  'can', 'will', 'would', 'could', 'should',
  'this', 'that',
  'your', 'our', 'their', 'its',
]);

/**
 * Emphatic words — naturally spoken with extra stress.
 */
const EMPHATIC_WORDS = new Set([
  'never', 'always', 'very', 'really', 'absolutely', 'definitely',
  'must', 'stop', 'love', 'hate', 'amazing', 'terrible', 'incredible',
  'wow', 'please', 'help', 'sorry', 'wrong', 'right', 'bad',
  'everything', 'nothing', 'everyone', 'nobody',
]);

// ---------------------------------------------------------------------------
//  Prosody constants
// ---------------------------------------------------------------------------

/** Speed multiplier for function words. Faster than content words. */
const FUNCTION_WORD_SPEED = 1.4;

/** Speed multiplier for the first word of a phrase. Slightly slower. */
const ONSET_SPEED = 0.85;

/** Speed multiplier for the second word of a phrase. */
const ONSET_SECOND_SPEED = 0.92;

/** Speed reduction for the word immediately before a pause (comma, period). */
const PRE_BOUNDARY_SPEED = 0.88;

/** Speed reduction for the final word of a question. */
const QUESTION_FINAL_SPEED = 0.80;

/** Speed increase for mid-phrase content words (natural acceleration). */
const MID_PHRASE_ACCELERATION = 1.08;

/** Speed reduction for emphatic words. */
const EMPHATIC_SPEED = 0.75;

/** Default inter-word gap in ticks. */
const DEFAULT_GAP = 1;

/** Gap after punctuation that already has pause frames. Set to 0 to avoid double-pausing. */
const POST_PUNCTUATION_GAP = 0;

/** Gap between two function words in sequence. Tighter than default. */
const FUNCTION_FUNCTION_GAP = 0;

// ---------------------------------------------------------------------------
//  Public API
// ---------------------------------------------------------------------------

/**
 * Analyze a token sequence and produce a prosody profile.
 *
 * @param tokens - Speech tokens from tokenizeText().
 * @returns Prosody profile with per-word speed, pause, and emphasis data.
 */
export function analyzeProsody(tokens: SpeechToken[]): ProsodyProfile {
  const length = tokens.length;
  if (length === 0) {
    return { speedFactors: [], interWordPauses: [], emphasisLevels: [] };
  }

  const speedFactors: number[] = new Array(length).fill(1.0);
  const interWordPauses: number[] = new Array(length).fill(DEFAULT_GAP);
  const emphasisLevels: number[] = new Array(length).fill(1);

  const isQuestion = length > 0 && tokens[length - 1].trailingPunctuation === '?';

  for (let i = 0; i < length; i++) {
    const token = tokens[i];
    const word = token.word;
    const isFunction = FUNCTION_WORDS.has(word);
    const isEmphatic = EMPHATIC_WORDS.has(word);
    const hasPunctuation = token.trailingPunctuation.length > 0;
    const nextIsFunction = (i < length - 1) && FUNCTION_WORDS.has(tokens[i + 1].word);

    // -- Speed factors --

    // Function words are faster.
    if (isFunction) {
      speedFactors[i] *= FUNCTION_WORD_SPEED;
    }

    // Onset deceleration (first 1–2 words).
    if (i === 0 && length > 1) {
      speedFactors[i] *= ONSET_SPEED;
    } else if (i === 1 && length > 2) {
      speedFactors[i] *= ONSET_SECOND_SPEED;
    }

    // Pre-boundary lengthening (word before punctuation).
    if (hasPunctuation) {
      speedFactors[i] *= PRE_BOUNDARY_SPEED;
    }

    // Question-final word elongation.
    if (isQuestion && i === length - 1) {
      speedFactors[i] *= QUESTION_FINAL_SPEED;
    }

    // Mid-phrase acceleration for content words.
    if (!isFunction && !isEmphatic && i > 1 && i < length - 1 && !hasPunctuation) {
      speedFactors[i] *= MID_PHRASE_ACCELERATION;
    }

    // Emphatic words get slower, stronger emphasis.
    if (isEmphatic) {
      speedFactors[i] *= EMPHATIC_SPEED;
      emphasisLevels[i] = 2;
    }

    // -- Inter-word pauses --

    // Last word has no following gap.
    if (i === length - 1) {
      interWordPauses[i] = 0;
      continue;
    }

    // After punctuation, the PUNCTUATION_PAUSE_FRAMES system already
    // inserts hold frames — do not add an extra gap.
    if (hasPunctuation) {
      interWordPauses[i] = POST_PUNCTUATION_GAP;
      continue;
    }

    // Function word → function word: tighten the gap.
    if (isFunction && nextIsFunction) {
      interWordPauses[i] = FUNCTION_FUNCTION_GAP;
      continue;
    }

    // Default gap.
    interWordPauses[i] = DEFAULT_GAP;
  }

  return { speedFactors, interWordPauses, emphasisLevels };
}

/**
 * Apply a prosody speed factor to a hold-tick array.
 * Speed > 1.0 reduces hold ticks (faster). Speed < 1.0 increases them (slower).
 * Each hold value stays at minimum 1.
 *
 * @param holdTicks   - Mutable array of per-frame hold counts.
 * @param speedFactor - Multiplier (1.0 = no change).
 * @returns The modified holdTicks array (same reference).
 */
export function applySpeedFactor(holdTicks: number[], speedFactor: number): number[] {
  if (speedFactor === 1.0) return holdTicks;

  for (let i = 0; i < holdTicks.length; i++) {
    // Speed > 1 = faster = fewer ticks. Invert the factor for hold duration.
    holdTicks[i] = Math.max(1, Math.round(holdTicks[i] / speedFactor));
  }
  return holdTicks;
}

/**
 * Apply emphasis level to a hold-tick array.
 * Emphasis level 2 adds extra hold on the longest-held frame
 * (approximates the stressed syllable).
 *
 * @param holdTicks     - Mutable array of per-frame hold counts.
 * @param emphasisLevel - 0 = none, 1 = normal, 2 = strong.
 * @returns The modified holdTicks array (same reference).
 */
export function applyEmphasis(holdTicks: number[], emphasisLevel: number): number[] {
  if (emphasisLevel < 2 || holdTicks.length === 0) return holdTicks;

  // Find the frame with the longest hold (stressed syllable).
  let maxIndex = 0;
  let maxHold = holdTicks[0];
  for (let i = 1; i < holdTicks.length; i++) {
    if (holdTicks[i] > maxHold) {
      maxHold = holdTicks[i];
      maxIndex = i;
    }
  }

  // Add extra hold for emphasis.
  holdTicks[maxIndex] = Math.min(holdTicks[maxIndex] + 1, 5);
  return holdTicks;
}
