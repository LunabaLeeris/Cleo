export { AvatarCompositor } from './avatar-compositor';
export type { ComposedSpeakResult } from './avatar-compositor';
export { defaultAvatarConfig } from './avatar-config';
export { preloadAvatarSprites, loadImage, clearImageCache, ensureImagesLoaded } from './sprite-loader';
export {
  WORD_FRAME_MAP,
  DEFAULT_WORD_FRAMES,
  WORD_GAP_FRAMES,
  PUNCTUATION_PAUSE_FRAMES,
  MOUTH_FRAMES,
  BROW_FRAMES,
  EYE_FRAMES,
  tokenizeText,
  getWordFrames,
  getPauseFrameCount,
} from './speak-frame-map';
export type { WordFrames, SpeechToken } from './speak-frame-map';
export { computeHoldTicks, totalTicks } from './speech-timing';
export type {
  PartName,
  Vec2,
  LoopMode,
  AnimationDef,
  FrameArrayDef,
  SpriteSheetDef,
  PartConfig,
  KeyframeOffsetMap,
  AvatarConfig,
  ChleoExpression,
  CleoExpression,
} from './sprite-types';
export { PART_RENDER_ORDER } from './sprite-types';
export { RoboticTTSModulator, defaultTTSModulator, DEFAULT_MODULATION_CONFIG } from './tts/robotic-tts-modulator';
export type { RoboticModulationConfig } from './tts/robotic-tts-modulator';
export { TTSAnalyzer, defaultTTSAnalyzer } from './tts/tts-analyzer';
export type { TTSWordTiming, TTSPhraseAnalysis } from './tts/tts-analyzer';
export { SpeechOrchestrator, defaultSpeechOrchestrator } from './tts/speech-orchestrator';
export type { PreRenderedSpeechPacket } from './tts/speech-orchestrator';

