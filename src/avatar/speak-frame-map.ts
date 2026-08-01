import type { PartName } from './sprite-types';

// --- Mouth frame imports ---
import MOUTH_CLOSED from '../assets/frames/mouth/mouth_closed.png';
import MOUTH_HSLIGHT from '../assets/frames/mouth/mouth_hslight.png';
import MOUTH_OMEDIUM from '../assets/frames/mouth/mouth_omedium.png';
import MOUTH_OSUBTLE from '../assets/frames/mouth/mouth_osubtle.png';

// --- Re-export frame assets for external use ---
export const MOUTH_FRAMES = {
  closed: MOUTH_CLOSED,
  hslight: MOUTH_HSLIGHT,
  omedium: MOUTH_OMEDIUM,
  osubtle: MOUTH_OSUBTLE,
} as const;

/**
 * Per-part frame sequence for a single word.
 * Only parts that change during speech need entries.
 * Omitted parts keep their current animation.
 */
export type WordFrames = Partial<Record<PartName, string[]>>;

/**
 * Pause configuration driven by trailing punctuation.
 * The number of times the last frame of a word is duplicated
 * to simulate a hold/pause after that word.
 */
export const PUNCTUATION_PAUSE_FRAMES: Record<string, number> = {
  '.': 3,   // Full stop — moderate pause
  '!': 3,   // Exclamation — moderate pause
  '?': 4,   // Question — slightly longer (suggests thinking)
  ',': 2,   // Comma — short breath pause
  ';': 2,   // Semicolon — short pause
  ':': 2,   // Colon — short pause
  '...': 5, // Ellipsis — long dramatic pause
};

/**
 * Default frame sequence used for any word not in the map.
 * A generic open-close mouth cycle.
 */
export const DEFAULT_WORD_FRAMES: WordFrames = {
  mouth: [MOUTH_CLOSED, MOUTH_OSUBTLE, MOUTH_OMEDIUM, MOUTH_OSUBTLE, MOUTH_CLOSED],
};

/**
 * Frames inserted between words as a brief closed-mouth gap.
 */
export const WORD_GAP_FRAMES: WordFrames = {
  mouth: [MOUTH_CLOSED],
};

/**
 * Map of lowercase words to their per-part frame sequences.
 *
 * Mouth shape legend:
 *   closed  — lips together (M, B, P, pauses)
 *   hslight — horizontal slight opening (S, F, TH, short vowels)
 *   omedium — medium round opening (O, AW, long vowels)
 *   osubtle — subtle/small opening (T, D, N, L, short sounds)
 *
 * When brow/eye frames become available, add entries for
 * expressive words (e.g. "what" → raised brow, "no" → furrowed).
 */
export const WORD_FRAME_MAP: Record<string, WordFrames> = {
  // --- Greetings ---
  'hello': {
    mouth: [MOUTH_HSLIGHT, MOUTH_OSUBTLE, MOUTH_CLOSED],
  },
  'hi': {
    mouth: [MOUTH_HSLIGHT],
  },
  'hey': {
    mouth: [MOUTH_HSLIGHT],
  },
  'bye': {
    mouth: [MOUTH_CLOSED, MOUTH_OMEDIUM, MOUTH_OSUBTLE, MOUTH_CLOSED],
  },

  // --- Common short words ---
  'i': {
    mouth: [MOUTH_OSUBTLE, MOUTH_CLOSED],
  },
  'a': {
    mouth: [MOUTH_OSUBTLE, MOUTH_CLOSED],
  },
  'the': {
    mouth: [MOUTH_HSLIGHT, MOUTH_OSUBTLE, MOUTH_CLOSED],
  },
  'is': {
    mouth: [MOUTH_OSUBTLE, MOUTH_HSLIGHT, MOUTH_CLOSED],
  },
  'am': {
    mouth: [MOUTH_OSUBTLE, MOUTH_CLOSED],
  },
  'are': {
    mouth: [MOUTH_OSUBTLE, MOUTH_HSLIGHT, MOUTH_CLOSED],
  },
  'it': {
    mouth: [MOUTH_OSUBTLE, MOUTH_HSLIGHT, MOUTH_CLOSED],
  },
  'to': {
    mouth: [MOUTH_HSLIGHT, MOUTH_OMEDIUM, MOUTH_CLOSED],
  },
  'you': {
    mouth: [MOUTH_OMEDIUM, MOUTH_OSUBTLE, MOUTH_CLOSED],
  },
  'my': {
    mouth: [MOUTH_CLOSED, MOUTH_OSUBTLE, MOUTH_CLOSED],
  },
  'me': {
    mouth: [MOUTH_CLOSED, MOUTH_HSLIGHT, MOUTH_CLOSED],
  },
  'we': {
    mouth: [MOUTH_OMEDIUM, MOUTH_HSLIGHT, MOUTH_CLOSED],
  },
  'he': {
    mouth: [MOUTH_HSLIGHT, MOUTH_OSUBTLE, MOUTH_CLOSED],
  },
  'she': {
    mouth: [MOUTH_HSLIGHT, MOUTH_OSUBTLE, MOUTH_CLOSED],
  },
  'no': {
    mouth: [MOUTH_OSUBTLE, MOUTH_OMEDIUM, MOUTH_CLOSED],
  },
  'yes': {
    mouth: [MOUTH_OMEDIUM, MOUTH_HSLIGHT, MOUTH_CLOSED],
  },
  'not': {
    mouth: [MOUTH_OSUBTLE, MOUTH_OMEDIUM, MOUTH_HSLIGHT, MOUTH_CLOSED],
  },

  // --- Question / reaction words ---
  'what': {
    mouth: [MOUTH_OMEDIUM, MOUTH_OSUBTLE, MOUTH_HSLIGHT, MOUTH_CLOSED],
    // eyebrows: raised — add when brow frames exist
  },
  'why': {
    mouth: [MOUTH_OMEDIUM, MOUTH_OSUBTLE, MOUTH_CLOSED],
  },
  'how': {
    mouth: [MOUTH_HSLIGHT, MOUTH_OMEDIUM, MOUTH_OSUBTLE, MOUTH_CLOSED],
  },
  'huh': {
    mouth: [MOUTH_HSLIGHT, MOUTH_OSUBTLE, MOUTH_CLOSED],
    // eyebrows: raised — add when brow frames exist
  },
  'hmm': {
    mouth: [MOUTH_CLOSED, MOUTH_CLOSED, MOUTH_CLOSED],
  },
  'oh': {
    mouth: [MOUTH_OMEDIUM, MOUTH_OMEDIUM, MOUTH_CLOSED],
  },
  'wow': {
    mouth: [MOUTH_OMEDIUM, MOUTH_OMEDIUM, MOUTH_OSUBTLE, MOUTH_CLOSED],
  },

  // --- Action words ---
  'think': {
    mouth: [MOUTH_HSLIGHT, MOUTH_OSUBTLE, MOUTH_OSUBTLE, MOUTH_HSLIGHT, MOUTH_CLOSED],
  },
  'stop': {
    mouth: [MOUTH_HSLIGHT, MOUTH_HSLIGHT, MOUTH_OMEDIUM, MOUTH_CLOSED, MOUTH_CLOSED],
  },
  'go': {
    mouth: [MOUTH_OSUBTLE, MOUTH_OMEDIUM, MOUTH_CLOSED],
  },
  'that': {
    mouth: [MOUTH_HSLIGHT, MOUTH_OSUBTLE, MOUTH_HSLIGHT, MOUTH_CLOSED],
  },
  'don\'t': {
    mouth: [MOUTH_OSUBTLE, MOUTH_OMEDIUM, MOUTH_OSUBTLE, MOUTH_HSLIGHT, MOUTH_CLOSED],
  },
  'want': {
    mouth: [MOUTH_OMEDIUM, MOUTH_OSUBTLE, MOUTH_HSLIGHT, MOUTH_CLOSED],
  },
};

/**
 * Token produced by parsing input text.
 * Captures the word (lowercase, stripped of punctuation) and any
 * trailing punctuation mark for pause calculation.
 */
export interface SpeechToken {
  /** Lowercase word with punctuation stripped. */
  word: string;
  /** Trailing punctuation character(s), or empty string. */
  trailingPunctuation: string;
}

/**
 * Tokenize input text into SpeechTokens.
 *
 * Splits on whitespace, strips punctuation from each token,
 * and preserves trailing punctuation marks for pause logic.
 * Multi-character punctuation like "..." is detected first.
 */
export function tokenizeText(text: string): SpeechToken[] {
  const rawTokens = text.trim().split(/\s+/).filter(t => t.length > 0);
  const tokens: SpeechToken[] = [];

  for (const raw of rawTokens) {
    // Check for multi-char punctuation first (e.g. "...")
    let trailingPunctuation = '';
    let word = raw;

    if (word.endsWith('...')) {
      trailingPunctuation = '...';
      word = word.slice(0, -3);
    } else {
      const lastChar = word.charAt(word.length - 1);
      if (PUNCTUATION_PAUSE_FRAMES[lastChar] !== undefined) {
        trailingPunctuation = lastChar;
        word = word.slice(0, -1);
      }
    }

    // Strip any remaining non-alphanumeric characters and lowercase
    word = word.replace(/[^a-zA-Z0-9']/g, '').toLowerCase();

    if (word.length > 0) {
      tokens.push({ word, trailingPunctuation });
    }
  }

  return tokens;
}

/**
 * Look up the frame sequence for a word.
 * Returns the mapped frames if found, otherwise the default fallback.
 */
export function getWordFrames(word: string): WordFrames {
  return WORD_FRAME_MAP[word] ?? DEFAULT_WORD_FRAMES;
}

/**
 * Get the number of pause frames to append after a token
 * based on its trailing punctuation.
 * Returns 0 if no punctuation pause applies.
 */
export function getPauseFrameCount(trailingPunctuation: string): number {
  if (!trailingPunctuation) return 0;
  return PUNCTUATION_PAUSE_FRAMES[trailingPunctuation] ?? 0;
}
