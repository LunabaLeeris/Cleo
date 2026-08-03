/**
 * CMU Pronouncing Dictionary — Phoneme and Syllable Lookup
 *
 * This module gives access to the CMU Pronouncing Dictionary.
 * It uses ARPABET notation. Vowel phonemes carry a stress digit:
 *   0 = no stress, 1 = primary stress, 2 = secondary stress.
 *
 * The module gives three pieces of data for a word:
 *   - phoneme sequence  (e.g. ["HH", "AH0", "L", "OW1"])
 *   - syllable count    (number of vowel phonemes)
 *   - stress pattern    (array of 0 | 1 | 2 per syllable)
 *
 * If a word is not in the dictionary, a heuristic estimates the
 * syllable count from its spelling.
 */

import { dictionary } from 'cmu-pronouncing-dictionary';

/** Data returned from a CMU dictionary lookup. */
export interface PhonemeData {
  /** Raw ARPABET phoneme tokens (e.g. ["HH", "AH0", "L", "OW1"]). */
  phonemes: string[];

  /** Total number of syllables. */
  syllableCount: number;

  /** Stress level per syllable (0 = none, 1 = primary, 2 = secondary). */
  stressPattern: number[];

  /** Index of the primary-stressed syllable (0-based). -1 if unknown. */
  primaryStressIndex: number;

  /** True when data comes from the CMU dictionary. False for heuristic. */
  fromDictionary: boolean;
}


/** Vowel phonemes always end with a stress digit (0, 1, or 2). */
const VOWEL_REGEX = /^[A-Z]+[012]$/;

/**
 * Parse a raw CMU pronunciation string into structured phoneme data.
 *
 * @param pronunciation - Space-separated ARPABET string
 *                        (e.g. "HH AH0 L OW1")
 * @returns Structured phoneme data.
 */
function parsePronunciation(pronunciation: string): PhonemeData {
  const phonemes = pronunciation.split(' ').filter(p => p.length > 0);
  const stressPattern: number[] = [];
  let primaryStressIndex = -1;

  for (const phoneme of phonemes) {
    if (VOWEL_REGEX.test(phoneme)) {
      const stressDigit = parseInt(phoneme.charAt(phoneme.length - 1), 10);
      if (stressDigit === 1 && primaryStressIndex === -1) {
        primaryStressIndex = stressPattern.length;
      }
      stressPattern.push(stressDigit);
    }
  }

  return {
    phonemes,
    syllableCount: stressPattern.length,
    stressPattern,
    primaryStressIndex,
    fromDictionary: true,
  };
}


/**
 * Estimate syllable count from English spelling.
 *
 * Rules applied:
 *   1. Count vowel groups (a, e, i, o, u, y).
 *   2. Subtract 1 for a silent trailing "e" (unless the word is very short).
 *   3. Subtract 1 for trailing "le" that follows a consonant.
 *   4. Subtract 1 for trailing "es" or "ed" (unless preceded by "t" or "d").
 *   5. The minimum result is 1.
 *
 * @param word - Lowercase English word.
 * @returns Estimated syllable count (minimum 1).
 */
export function estimateSyllableCount(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 2) return 1;

  // Count vowel groups (y counts as vowel)
  const vowelGroups = w.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;

  // Silent trailing "e"
  if (w.endsWith('e') && !w.endsWith('le') && count > 1) {
    count--;
  }

  // Trailing "es" (not after t/d where -es is voiced)
  if (w.endsWith('es') && !w.endsWith('tes') && !w.endsWith('des') && count > 1) {
    count--;
  }

  // Trailing "ed" (not after t/d where -ed is voiced)
  if (w.endsWith('ed') && !w.endsWith('ted') && !w.endsWith('ded') && count > 1) {
    count--;
  }

  return Math.max(1, count);
}

/**
 * Look up phoneme data for a word. Uses the CMU dictionary when the
 * word exists. Falls back to a heuristic syllable estimate for
 * words that are not in the dictionary.
 *
 * @param word - Lowercase English word (no punctuation).
 * @returns Phoneme data with syllable count and stress pattern.
 */
export function lookupWord(word: string): PhonemeData {
  const key = word.toLowerCase().replace(/[^a-z']/g, '');

  const pronunciation = (dictionary as Record<string, string>)[key];
  if (pronunciation) {
    return parsePronunciation(pronunciation);
  }

  // Heuristic fallback
  const syllables = estimateSyllableCount(key);
  return {
    phonemes: [],
    syllableCount: syllables,
    stressPattern: syllables === 1
      ? [1]
      : Array.from({ length: syllables }, (_, i) => (i === 0 ? 1 : 0)),
    primaryStressIndex: 0,
    fromDictionary: false,
  };
}

/**
 * Get the syllable count for a word. Shorthand for lookupWord().syllableCount.
 *
 * @param word - Lowercase English word.
 * @returns Syllable count (minimum 1).
 */
export function getSyllableCount(word: string): number {
  return lookupWord(word).syllableCount;
}
