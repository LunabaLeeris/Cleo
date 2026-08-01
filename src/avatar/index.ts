export { AvatarCompositor } from './avatar-compositor';
export { defaultAvatarConfig } from './avatar-config';
export { preloadAvatarSprites, loadImage, clearImageCache, ensureImagesLoaded } from './sprite-loader';
export {
  WORD_FRAME_MAP,
  DEFAULT_WORD_FRAMES,
  WORD_GAP_FRAMES,
  PUNCTUATION_PAUSE_FRAMES,
  MOUTH_FRAMES,
  tokenizeText,
  getWordFrames,
  getPauseFrameCount,
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
