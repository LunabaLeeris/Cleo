/**
 * TTS Timing Analyzer & Word-Word Enunciation Mapper
 *
 * Extracts spoken word durations and inter-word gaps for input phrases.
 * Calculates exact word duration (wordDurationMs) and pauses based on speech rate.
 * All comments follow ASD-STE100 rules (imperative and simple present tense).
 */

import { tokenizeText } from '../speak-frame-map';
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
    const speechRate = Math.max(0.4, config.speechRate);
    const wordTimings: TTSWordTiming[] = [];

    // Measure actual TTS word boundary timestamps using Web Speech API synthesis
    const measurement = await defaultTTSModulator.measurePhraseTimings(text);

    if (measurement && measurement.events.length > 0) {
      const { events } = measurement;

      // Map character start offsets for each token in input text
      let searchOffset = 0;
      const tokenOffsets: number[] = [];
      for (const token of tokens) {
        const idx = text.toLowerCase().indexOf(token.word.toLowerCase(), searchOffset);
        if (idx !== -1) {
          tokenOffsets.push(idx);
          searchOffset = idx + token.word.length;
        } else {
          tokenOffsets.push(searchOffset);
        }
      }

      // Associate boundary timestamps with each token
      const tokenTimestamps: number[] = [];
      for (let i = 0; i < tokens.length; i++) {
        const targetOffset = tokenOffsets[i];
        let bestEvent = events[i];
        if (events.length !== tokens.length) {
          let minDiff = Infinity;
          for (const ev of events) {
            const diff = Math.abs(ev.charIndex - targetOffset);
            if (diff < minDiff) {
              minDiff = diff;
              bestEvent = ev;
            }
          }
        }
        tokenTimestamps.push(bestEvent ? bestEvent.elapsedMs : i * 200);
      }

      // Approximate vocal time per character at active speech rate (ms per character)
      const msPerChar = Math.round(75 / speechRate);

      let totalDurationMs = 0;
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const tStart = tokenTimestamps[i];
        const tNext = (i < tokens.length - 1) ? tokenTimestamps[i + 1] : measurement.totalDurationMs;
        const totalInterval = Math.max(50, tNext - tStart);

        // Expected active vocalization duration based on word character count
        const expectedVocalMs = Math.max(80, Math.round(40 + token.word.length * msPerChar));

        let wordDurationMs: number;
        let pauseMs: number;

        if (totalInterval <= expectedVocalMs + 40) {
          wordDurationMs = totalInterval;
          pauseMs = 0;
        } else {
          wordDurationMs = Math.min(totalInterval, expectedVocalMs);
          pauseMs = totalInterval - wordDurationMs;
        }

        wordTimings.push({
          word: token.word,
          durationMs: wordDurationMs,
          pauseMs
        });

        totalDurationMs += wordDurationMs + pauseMs;
      }

      console.log(`[TTSAnalyzer] TTS-measured phrase "${text}": ${totalDurationMs}ms total duration (${wordTimings.length} words).`);

      return {
        text,
        wordTimings,
        totalDurationMs,
      };
    }

    // Fallback when Web Speech API measurement is unavailable (e.g. headless/SSR environment)
    const baseMsPerWord = Math.max(80, Math.round(160 / speechRate));
    let totalDurationMs = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const length = token.word.length;
      const wordDurationMs = Math.max(90, Math.round(baseMsPerWord * (0.60 + Math.min(1.2, length * 0.09))));
      const pauseMs = token.trailingPunctuation ? 100 : 0;

      wordTimings.push({
        word: token.word,
        durationMs: wordDurationMs,
        pauseMs
      });

      totalDurationMs += wordDurationMs + pauseMs;
    }

    console.log(`[TTSAnalyzer] Fallback phrase estimation "${text}": ${totalDurationMs}ms total duration (${wordTimings.length} words).`);

    return {
      text,
      wordTimings,
      totalDurationMs,
    };
  }
}

/** Shared instance of TTSAnalyzer. */
export const defaultTTSAnalyzer = new TTSAnalyzer();
