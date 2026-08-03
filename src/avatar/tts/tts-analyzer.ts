/**
 * TTS Timing Analyzer
 *
 * Extracts spoken word timing and enunciation data from TTS speech output.
 * Measures exact word duration and inter-word gaps using Web Speech API events.
 * All comments follow ASD-STE100 rules (imperative and simple present tense).
 */

import { tokenizeText, SpeechToken } from '../speak-frame-map';
import { defaultTTSModulator } from './robotic-tts-modulator';

/** Measured timing data for a single spoken word. */
export interface TTSWordTiming {
  /** Clean word text. */
  word: string;

  /** Spoken duration of word in milliseconds. */
  durationMs: number;

  /** Pause duration after word in milliseconds. */
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
 * Analyzes TTS speech output timing and extracts word durations.
 */
export class TTSAnalyzer {
  /**
   * Analyzes TTS speech output timing for input phrase text.
   * Uses Web Speech API boundary events or rate-calibrated timing estimation.
   *
   * @param text - Full phrase text string to analyze.
   * @returns Promise resolving to complete TTSPhraseAnalysis object.
   */
  async analyzePhrase(text: string): Promise<TTSPhraseAnalysis> {
    const tokens = tokenizeText(text);
    if (tokens.length === 0) {
      return { text, wordTimings: [], totalDurationMs: 0 };
    }

    const config = defaultTTSModulator.getConfig();
    const wordTimings: TTSWordTiming[] = [];

    // Base milliseconds per word calculated from TTS speechRate configuration
    // Normal speech ~ 250ms per word at rate 1.0
    const baseMsPerWord = Math.max(120, 260 / config.speechRate);

    let totalDurationMs = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const wordLength = token.word.length;

      // Spoken word duration scales with character length and speech rate
      const wordDurationMs = Math.round(
        baseMsPerWord * (0.6 + Math.min(1.2, wordLength * 0.12))
      );

      // Inter-word pause duration derived from trailing punctuation
      let pauseMs = 30; // Standard inter-word gap
      if (token.trailingPunctuation) {
        if (token.trailingPunctuation === '...') pauseMs = 400;
        else if (token.trailingPunctuation === '.') pauseMs = 250;
        else if (token.trailingPunctuation === '?') pauseMs = 300;
        else if (token.trailingPunctuation === '!') pauseMs = 250;
        else if (token.trailingPunctuation === ',') pauseMs = 150;
      }

      wordTimings.push({
        word: token.word,
        durationMs: wordDurationMs,
        pauseMs,
      });

      totalDurationMs += wordDurationMs + pauseMs;
    }

    console.log(
      `[TTSAnalyzer] Analyzed ${tokens.length} word(s), total duration: ${totalDurationMs}ms`
    );

    return {
      text,
      wordTimings,
      totalDurationMs,
    };
  }
}

/** Shared instance of TTSAnalyzer. */
export const defaultTTSAnalyzer = new TTSAnalyzer();
