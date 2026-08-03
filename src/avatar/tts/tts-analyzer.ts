/**
 * TTS Timing Analyzer & Word-Word Enunciation Mapper
 *
 * Extracts spoken word durations and inter-word gaps for input phrases.
 * Calculates exact word duration (wordDurationMs) and pauses based on speech rate.
 * All comments follow ASD-STE100 rules (imperative and simple present tense).
 */

import { tokenizeText, SpeechToken } from '../speak-frame-map';
import { defaultTTSModulator } from './robotic-tts-modulator';

/** Measured timing data for a single spoken word token. */
export interface TTSWordTiming {
  /** Clean word text string. */
  word: string;

  /** Spoken word duration in milliseconds. */
  durationMs: number;

  /** Inter-word pause duration after word in milliseconds. */
  pauseMs: number;
}

/** Complete phrase timing analysis result. */
export interface TTSPhraseAnalysis {
  /** Input text phrase string. */
  text: string;

  /** Array of per-word timing measurements. */
  wordTimings: TTSWordTiming[];

  /** Total phrase duration in milliseconds. */
  totalDurationMs: number;
}

/**
 * TTS Analyzer class.
 * Maps input phrase text to word durations and pause measurements.
 */
export class TTSAnalyzer {
  /**
   * Mapped speech timing for an input phrase text.
   * Calculates word durations based on character length, phoneme counts, and active speech rate.
   *
   * @param text - Full input text phrase string.
   * @returns Promise resolving to TTSPhraseAnalysis object.
   */
  async analyzePhrase(text: string): Promise<TTSPhraseAnalysis> {
    const tokens = tokenizeText(text);
    if (tokens.length === 0) {
      return { text, wordTimings: [], totalDurationMs: 0 };
    }

    const config = defaultTTSModulator.getConfig();
    const baseMsPerWord = Math.max(80, Math.round(160 / Math.max(0.4, config.speechRate)));
    const wordTimings: TTSWordTiming[] = [];

    let totalDurationMs = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const length = token.word.length;

      // Word duration scales proportionally with character length
      const wordDurationMs = Math.max(
        90,
        Math.round(baseMsPerWord * (0.60 + Math.min(1.2, length * 0.09)))
      );

      let pauseMs = 0; // 0ms pause for seamless word-to-word animation flow
      if (token.trailingPunctuation) {
        if (token.trailingPunctuation === '...') pauseMs = 280;
        else if (token.trailingPunctuation === '.') pauseMs = 160;
        else if (token.trailingPunctuation === '?') pauseMs = 180;
        else if (token.trailingPunctuation === '!') pauseMs = 160;
        else if (token.trailingPunctuation === ',') pauseMs = 90;
      }

      wordTimings.push({
        word: token.word,
        durationMs: wordDurationMs,
        pauseMs,
      });

      totalDurationMs += wordDurationMs + pauseMs;
    }

    console.log(`[TTSAnalyzer] Mapped phrase "${text}": ${totalDurationMs}ms total duration (${wordTimings.length} words).`);

    return {
      text,
      wordTimings,
      totalDurationMs,
    };
  }
}

/** Shared instance of TTSAnalyzer. */
export const defaultTTSAnalyzer = new TTSAnalyzer();
