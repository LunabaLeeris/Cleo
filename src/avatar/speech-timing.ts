/**
 * Speech Timing Engine — Basic Hold-Tick Calculation
 *
 * Converts word viseme frame sequences into hold-tick arrays.
 * Calculates frame hold ticks from word length and frame count.
 * All comments follow ASD-STE100 rules (imperative and simple present tense).
 */

/**
 * Compute a hold-tick array for a word mouth frame sequence.
 *
 * @param word   - Lowercase word string (no punctuation).
 * @param frames - Array of viseme frame paths for this word.
 * @returns Array of hold-tick counts (one per frame).
 */
export function computeHoldTicks(word: string, frames: string[]): number[] {
  if (frames.length === 0) return [];
  if (frames.length === 1) return [2];

  // Base hold ticks: 2 ticks per frame
  return new Array(frames.length).fill(2);
}

/**
 * Compute total tick duration for a hold-tick array.
 *
 * @param holdTicks - Array of per-frame hold counts.
 * @returns Sum of all hold values.
 */
export function totalTicks(holdTicks: number[]): number {
  return holdTicks.reduce((sum, h) => sum + h, 0);
}
