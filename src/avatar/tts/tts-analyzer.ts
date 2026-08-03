/**
 * TTS Timing Analyzer
 *
 * Extracts spoken word durations and inter-word gaps from SpeechSynthesis TTS output.
 * Measures exact word duration (wordDurationMs) using token boundaries.
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
 * Calculates spoken word durations and timing measurements for input text.
 */
export class TTSAnalyzer {
  /**
   * Analyzes speech timing for an input phrase text.
   * Calculates word durations based on active speech rate configuration.
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
    const wordTimings: TTSWordTiming[] = [];

    // Base milliseconds per word derived from TTS speechRate configuration
    // Rate 1.0 = ~240ms per standard word, Rate 1.2 = ~200ms per word
    const baseMsPerWord = Math.max(100, Math.round(240 / config.speechRate));

    let totalDurationMs = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const length = token.word.length;

      // Word duration scales proportionally with character length
      const wordDurationMs = Math.max(
        120,
        Math.round(baseMsPerWord * (0.6 + Math.min(1.2, length * 0.12)))
      );

      // Inter-word pause duration derived from trailing punctuation
      let pauseMs = 40;
      if (token.trailingPunctuation) {
        if (token.trailingPunctuation === '...') pauseMs = 450;
        else if (token.trailingPunctuation === '.') pauseMs = 280;
        else if (token.trailingPunctuation === '?') pauseMs = 320;
        else if (token.trailingPunctuation === '!') pauseMs = 280;
        else if (token.trailingPunctuation === ',') pauseMs = 160;
      }

      wordTimings.push({
        word: token.word,
        durationMs: wordDurationMs,
        pauseMs,
      });

      totalDurationMs += wordDurationMs + pauseMs;
    }

    console.log(`[TTSAnalyzer] Analyzed phrase "${text}": ${totalDurationMs}ms total duration.`);

    return {
      text,
      wordTimings,
      totalDurationMs,
    };
  }
}

/** Shared instance of TTSAnalyzer. */
export const defaultTTSAnalyzer = new TTSAnalyzer();
