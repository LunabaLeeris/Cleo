export { AvatarCompositor } from './avatar-compositor';
export type { ComposedSpeakResult } from './avatar-compositor';
export { defaultAvatarConfig } from './avatar-config';
export { preloadAvatarSprites, loadImage, clearImageCache, ensureImagesLoaded } from './sprite-loader';
export {
  WORD_FRAME_MAP,
  DEFAULT_WORD_FRAMES,
  PUNCTUATION_PAUSE_FRAMES,
  MOUTH_FRAMES,
  BROW_FRAMES,
  EYE_FRAMES,
  tokenizeText,
  getWordFrames,
} from './speak-frame-map';
export type { WordFrames, SpeechToken } from './speak-frame-map';
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
export type { RoboticModulationConfig, TTSModulatorConfig } from './tts/robotic-tts-modulator';
export { TTSAnalyzer, defaultTTSAnalyzer } from './tts/tts-analyzer';
export type { TTSWordTiming, TTSPhraseAnalysis } from './tts/tts-analyzer';
export { SpeechOrchestrator, defaultSpeechOrchestrator } from './tts/speech-orchestrator';
export type { PreRenderedSpeechPacket } from './tts/speech-orchestrator';

// --- Emotion Engine Exports ---
export { EmotionsOrchestrator } from './emotions/emotions-orchestrator';
export {
  getAvatarEmotionFrames,
  EMOTION_TO_FAMILY,
  COMBINED_FAMILY_RESPONSE_MAP,
  EXPLICIT_PAIR_OVERRIDES,
} from './emotions/response-frame-map';
export type { EmotionFamily } from './emotions/response-frame-map';
export { LLMEmotionServiceScaffold } from './emotions/llm-emotion-service';
export type {
  PrimaryEmotion,
  EmotionalState,
  ResponseType,
  PlutchikEmotion,
  BehavioralData,
  LLMEmotionOutput,
  EmotionFrameConfig,
} from './emotions/emotion-types';
export { PRIMARY_EMOTIONS } from './emotions/emotion-types';



