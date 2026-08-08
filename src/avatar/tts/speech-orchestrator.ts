/**
 * Speech Orchestrator Engine
 *
 * Pre-computes TTS-driven animation hold ticks and pre-renders speech packets.
 * Synchronizes Wall-E robotic word enunciations with mouth viseme animation playback.
 * Animation frame advancement triggers vocal word playback in exact lockstep.
 * All comments follow ASD-STE100 rules (imperative and simple present tense).
 */

import { ComposedSpeakResult, AvatarCompositor, WordStartAnchor } from '../avatar-compositor';
import { getWordFrames, MOUTH_FRAMES } from '../speak-frame-map';
import { defaultTTSAnalyzer, TTSPhraseAnalysis } from './tts-analyzer';
import { defaultTTSModulator } from './robotic-tts-modulator';
import type { EmotionFrameConfig } from '../emotions/emotion-types';

/** Pre-rendered speech packet containing TTS-driven animation and timing data. */
export interface PreRenderedSpeechPacket {
  /** Full input text phrase string. */
  text: string;

  /** TTS-driven animation composition result with word anchors. */
  animationResult: ComposedSpeakResult;

  /** Total animation duration in milliseconds. */
  totalDurationMs: number;
}

/**
 * Speech Orchestrator class.
 * Pre-renders speech assets asynchronously and synchronizes voice with animation ticks.
 */
export class SpeechOrchestrator {
  /**
   * Pre-computes animation viseme hold ticks directly from measured TTS word durations.
   *
   * @param text          - Input text phrase string.
   * @param tickMs        - Master compositor render tick duration in milliseconds.
   * @param emotionFrames - Optional emotion frame overrides for eyebrows, eyes, and body.
   * @returns Promise resolving to PreRenderedSpeechPacket object.
   */
  async preRenderSpeech(
    text: string,
    tickMs: number,
    emotionFrames?: EmotionFrameConfig
  ): Promise<PreRenderedSpeechPacket> {
    console.log('[SpeechOrchestrator] Pre-rendering speech packet for:', `"${text}"`);

    // Pre-warm Web Audio and TTS subsystem
    defaultTTSModulator.preWarm();

    const analysis: TTSPhraseAnalysis = await defaultTTSAnalyzer.analyzePhrase(text);

    const composedMouthFrames: string[] = [];
    const composedHoldTicks: number[] = [];
    const wordAnchors: WordStartAnchor[] = [];

    for (let i = 0; i < analysis.wordTimings.length; i++) {
      const item = analysis.wordTimings[i];
      const wordFrames = getWordFrames(item.word);
      const mouthFrames = wordFrames.mouth ?? [MOUTH_FRAMES.neutral];
      const frameCount = mouthFrames.length;

      // Mark the starting frame index for word i
      const startFrameIndex = composedMouthFrames.length;
      wordAnchors.push({
        wordIndex: i,
        word: item.word,
        frameIndex: startFrameIndex,
        durationMs: item.durationMs,
      });

      // Derive viseme hold ticks directly from measured TTS word duration
      const totalWordTicks = Math.max(1, Math.round(item.durationMs / tickMs));
      const ticksPerFrame = Math.max(1, Math.round(totalWordTicks / frameCount));

      // Append mouth frames and calculated hold ticks
      for (let f = 0; f < frameCount; f++) {
        composedMouthFrames.push(mouthFrames[f]);
        composedHoldTicks.push(ticksPerFrame);
      }

      // Append inter-word pause gap frames ONLY when punctuation pause exists (> 80ms)
      if (item.pauseMs > 80 && i < analysis.wordTimings.length - 1) {
        const gapTicks = Math.max(1, Math.round(item.pauseMs / tickMs));
        composedMouthFrames.push(MOUTH_FRAMES.neutral);
        composedHoldTicks.push(gapTicks);
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
      wordAnchors,
    };

    if (emotionFrames) {
      const count = composedMouthFrames.length;
      if (emotionFrames.eyebrows) {
        animationResult.frames.eyebrows = Array(count).fill(emotionFrames.eyebrows);
        animationResult.holdTicks.eyebrows = [...composedHoldTicks];
      }
      if (emotionFrames.eyes) {
        animationResult.frames.eyes = Array(count).fill(emotionFrames.eyes);
        animationResult.holdTicks.eyes = [...composedHoldTicks];
      }
      if (emotionFrames.body) {
        animationResult.frames.body = Array(count).fill(emotionFrames.body);
        animationResult.holdTicks.body = [...composedHoldTicks];
      }
    }

    console.log(
      `[SpeechOrchestrator] Speech packet ready: ${totalTicks} ticks, ${totalDurationMs}ms total duration (${wordAnchors.length} word anchors).`
    );

    return {
      text,
      animationResult,
      totalDurationMs,
    };
  }

  /**
   * Triggers mouth animation and plays modulated robotic word voice when word animation starts.
   *
   * @param packet     - Pre-rendered speech packet from preRenderSpeech().
   * @param compositor - Active AvatarCompositor instance.
   */
  playPreRenderedSpeech(packet: PreRenderedSpeechPacket, compositor: AvatarCompositor): void {
    //  Cancel any active speech output
    defaultTTSModulator.stopSpeech();

    // Pre-warm AudioContext and TTS synthesis
    defaultTTSModulator.preWarm();

    // Set word boundary callback: fires when animation advances to a word start frame
    compositor.setOnWordStartCallback((wordIndex, word) => {
      const anchors = packet.animationResult.wordAnchors;
      const anchor = anchors?.find(a => a.wordIndex === wordIndex);
      const durMs = anchor?.durationMs ?? 250;
      console.log(`[SpeechOrchestrator] Sync trigger: playing word "${word}" (index ${wordIndex}, ${durMs}ms)`);
      defaultTTSModulator.speakWord(word, durMs);
    });

    // Play mouth viseme animation sequence (animation playback drives word audio)
    compositor.playSpeakSequence(packet.animationResult);
  }
}

/** Shared instance of SpeechOrchestrator. */
export const defaultSpeechOrchestrator = new SpeechOrchestrator();
