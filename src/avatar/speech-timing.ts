/**
 * Speech Timing Engine — Duration-Weighted Hold-Tick Calculation
 *
 * This module converts word-level viseme frame sequences into
 * hold-tick arrays. Each hold-tick value tells the compositor how
 * many render ticks to display a frame before it advances.
 *
 * The calculation uses syllable count and stress data from the
 * CMU Pronouncing Dictionary to make short words fast and long
 * words proportional.
 *
 * Function words ("the", "a", "is") get compressed timing.
 * Content words get syllable-proportional timing with extra
 * hold on the primary-stressed vowel frame.
 */

import { lookupWord, type PhonemeData } from './cmu-dict';

// ---------------------------------------------------------------------------
//  Constants
// ---------------------------------------------------------------------------

/**
 * Function words that receive compressed (faster) timing.
 * These words are spoken quickly in natural English speech.
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
  'not', 'no',
  'this', 'that',
  'your', 'our', 'their', 'its',
]);

/**
 * Base hold ticks for a single frame when the word is a function word.
 * Function words play faster to mimic natural speech.
 */
const FUNCTION_WORD_BASE_HOLD = 1;

/**
 * Base hold ticks for a single frame when the word is a content word.
 * Content words play at a normal pace.
 */
const CONTENT_WORD_BASE_HOLD = 2;

/**
 * Extra hold ticks added to the frame that aligns with the
 * primary-stressed syllable. This makes stressed vowels longer.
 */
const STRESS_BONUS_TICKS = 1;

/**
 * Maximum hold ticks per frame. This prevents very long words from
 * holding a single viseme for too many ticks.
 */
const MAX_HOLD_PER_FRAME = 4;

/**
 * Minimum total ticks for any word. This prevents single-frame words
 * from disappearing too quickly.
 */
const MIN_WORD_TICKS = 1;

// ---------------------------------------------------------------------------
//  Public API
// ---------------------------------------------------------------------------

/**
 * Compute a hold-tick array for a word's mouth frame sequence.
 *
 * Each element in the returned array aligns with the same index
 * in the viseme frame array. The value tells the compositor how
 * many ticks to hold that frame.
 *
 * @param word   - Lowercase word (no punctuation).
 * @param frames - The viseme frame array for this word (from the frame map).
 * @returns Array of hold-tick counts (one per frame).
 */
export function computeHoldTicks(word: string, frames: string[]): number[] {
  if (frames.length === 0) return [];
  if (frames.length === 1) return [Math.max(MIN_WORD_TICKS, CONTENT_WORD_BASE_HOLD)];

  const phonemeData = lookupWord(word);
  const isFunctionWord = FUNCTION_WORDS.has(word);

  const baseHold = isFunctionWord
    ? FUNCTION_WORD_BASE_HOLD
    : CONTENT_WORD_BASE_HOLD;

  // Start all frames at the base hold value.
  const holds = new Array(frames.length).fill(baseHold);

  // Apply stress bonus to the frame that aligns with the
  // primary-stressed syllable.
  if (!isFunctionWord && phonemeData.primaryStressIndex >= 0) {
    const stressFrameIndex = mapStressToFrameIndex(
      phonemeData.primaryStressIndex,
      phonemeData.syllableCount,
      frames.length,
    );
    holds[stressFrameIndex] = Math.min(
      holds[stressFrameIndex] + STRESS_BONUS_TICKS,
      MAX_HOLD_PER_FRAME,
    );
  }

  // Scale holds by syllable-to-frame ratio.
  // Words with more frames than syllables get slightly compressed.
  if (!isFunctionWord) {
    applyFrameRatioScaling(holds, phonemeData, frames.length);
  }

  return holds;
}

/**
 * Compute the total tick duration for a hold-tick array.
 *
 * @param holdTicks - Array of per-frame hold counts.
 * @returns Sum of all hold values.
 */
export function totalTicks(holdTicks: number[]): number {
  return holdTicks.reduce((sum, h) => sum + h, 0);
}

// ---------------------------------------------------------------------------
//  Internal helpers
// ---------------------------------------------------------------------------

/**
 * Map a syllable stress index to the nearest viseme frame index.
 *
 * The frame array and syllable array may have different lengths.
 * This uses proportional mapping to find the best frame.
 *
 * @param stressIndex   - 0-based syllable index with primary stress.
 * @param syllableCount - Total syllables in the word.
 * @param frameCount    - Total viseme frames for the word.
 * @returns 0-based frame index.
 */
function mapStressToFrameIndex(
  stressIndex: number,
  syllableCount: number,
  frameCount: number,
): number {
  if (syllableCount <= 1) return 0;
  // Proportional mapping: stress position in syllables → position in frames.
  const ratio = stressIndex / (syllableCount - 1);
  return Math.round(ratio * (frameCount - 1));
}

/**
 * Adjust hold ticks when the frame count differs significantly
 * from the syllable count.
 *
 * If frames > syllables * 2, compress by reducing non-stressed frames.
 * This prevents words with many viseme transitions from taking too long.
 *
 * @param holds       - Mutable hold-tick array.
 * @param phonemeData - CMU phoneme data for the word.
 * @param frameCount  - Total viseme frames.
 */
function applyFrameRatioScaling(
  holds: number[],
  phonemeData: PhonemeData,
  frameCount: number,
): void {
  const { syllableCount } = phonemeData;
  if (syllableCount <= 0) return;

  // When frame count is much larger than syllable count,
  // compress non-stressed frames to 1 tick.
  if (frameCount > syllableCount * 2) {
    for (let i = 0; i < holds.length; i++) {
      if (holds[i] <= CONTENT_WORD_BASE_HOLD) {
        holds[i] = 1;
      }
    }
  }
}
