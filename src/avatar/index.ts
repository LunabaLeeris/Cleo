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
export { analyzeProsody, applySpeedFactor, applyEmphasis } from './prosody-engine';
export type { ProsodyProfile } from './prosody-engine';
export { lookupWord, getSyllableCount, estimateSyllableCount } from './cmu-dict';
export type { PhonemeData } from './cmu-dict';
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
