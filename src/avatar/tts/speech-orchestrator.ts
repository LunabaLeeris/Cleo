/**
 * Speech Orchestrator Engine — Async Pre-Render Pipeline
 *
 * Pre-renders audio, computes TTS-driven animation hold ticks,
 * and waits for pre-render completion before displaying speech bubble and playing sync render.
 * All comments follow ASD-STE100 rules (imperative and simple present tense).
 */

import { ComposedSpeakResult, AvatarCompositor } from '../avatar-compositor';
import { getWordFrames, MOUTH_FRAMES } from '../speak-frame-map';
import { defaultTTSAnalyzer, TTSPhraseAnalysis } from './tts-analyzer';
import { defaultTTSModulator } from './robotic-tts-modulator';

/** Pre-rendered speech packet ready for synchronized render-time playback. */
export interface PreRenderedSpeechPacket {
  /** Input text phrase. */
  text: string;

  /** TTS-driven animation composition result. */
  animationResult: ComposedSpeakResult;

  /** Total animation duration in milliseconds. */
  totalDurationMs: number;

  /** Scheduled word audio items for playback. */
  audioItems: Array<{
    word: string;
    durationMs: number;
    delayMs: number;
  }>;
}

/**
 * Speech Orchestrator class.
 * Pre-renders speech assets asynchronously and synchronizes playback.
 */
export class SpeechOrchestrator {
  /**
   * Asynchronously pre-renders speech animation and robotic female voice.
   * Derives animation hold ticks directly from TTS word durations.
   *
   * @param text   - Input text phrase string.
   * @param tickMs - Master compositor render tick duration in milliseconds.
   * @returns Promise resolving to PreRenderedSpeechPacket.
   */
  async preRenderSpeech(text: string, tickMs: number): Promise<PreRenderedSpeechPacket> {
    console.log('[SpeechOrchestrator] Pre-rendering speech assets for phrase:', `"${text}"`);

    // 1. Analyze phrase via TTS timing engine
    const analysis: TTSPhraseAnalysis = await defaultTTSAnalyzer.analyzePhrase(text);

    const composedMouthFrames: string[] = [];
    const composedHoldTicks: number[] = [];
    const audioItems: PreRenderedSpeechPacket['audioItems'] = [];

    let elapsedDelayMs = 0;

    // 2. Process each word timing item
    for (let i = 0; i < analysis.wordTimings.length; i++) {
      const item = analysis.wordTimings[i];
      const wordFrames = getWordFrames(item.word);
      const mouthFrames = wordFrames.mouth ?? [MOUTH_FRAMES.neutral];

      const frameCount = mouthFrames.length;

      // Derive animation hold ticks directly from TTS word duration
      const totalWordTicks = Math.max(1, Math.round(item.durationMs / tickMs));
      const ticksPerFrame = Math.max(1, Math.round(totalWordTicks / frameCount));

      // Append mouth viseme frames and calculated hold ticks
      for (let f = 0; f < frameCount; f++) {
        composedMouthFrames.push(mouthFrames[f]);
        composedHoldTicks.push(ticksPerFrame);
      }

      // Add audio schedule item
      audioItems.push({
        word: item.word,
        durationMs: item.durationMs,
        delayMs: elapsedDelayMs,
      });

      elapsedDelayMs += item.durationMs;

      // Handle inter-word pause gap
      if (item.pauseMs > 0 && i < analysis.wordTimings.length - 1) {
        const gapTicks = Math.max(1, Math.round(item.pauseMs / tickMs));
        composedMouthFrames.push(MOUTH_FRAMES.neutral);
        composedHoldTicks.push(gapTicks);
        elapsedDelayMs += item.pauseMs;
      }
    }

    // End with neutral closed mouth
    composedMouthFrames.push(MOUTH_FRAMES.closed);
    composedHoldTicks.push(1);

    const totalTicks = composedHoldTicks.reduce((sum, h) => sum + h, 0);
    const totalDurationMs = totalTicks * tickMs;

    const animationResult: ComposedSpeakResult = {
      frames: { mouth: composedMouthFrames },
      holdTicks: { mouth: composedHoldTicks },
    };

    console.log(
      `[SpeechOrchestrator] Pre-render complete: ${composedMouthFrames.length} frames, ${totalDurationMs}ms duration.`
    );

    return {
      text,
      animationResult,
      totalDurationMs,
      audioItems,
    };
  }

  /**
   * Plays pre-rendered speech packet with synchronized audio and animation.
   *
   * @param packet     - Pre-rendered speech packet from preRenderSpeech().
   * @param compositor - Active AvatarCompositor instance.
   */
  playPreRenderedSpeech(packet: PreRenderedSpeechPacket, compositor: AvatarCompositor): void {
    // 1. Play mouth animation sequence
    compositor.playSpeakSequence(packet.animationResult, packet.text);

    // 2. Play modulated robotic female audio per word
    const modulator = defaultTTSModulator;
    modulator.initAudio();
    const now = modulator.getCurrentTime();

    for (const item of packet.audioItems) {
      const startTime = now + (item.delayMs / 1000) + 0.02;
      modulator.playModulatedWordSound(item.word, item.durationMs, startTime);
    }
  }
}

/** Shared instance of SpeechOrchestrator. */
export const defaultSpeechOrchestrator = new SpeechOrchestrator();
