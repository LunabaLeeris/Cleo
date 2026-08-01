/** Avatar part names rendered from bottom to top order. */
export type PartName = 'body' | 'eyes' | 'mouth' | 'eyebrows';

/** Render order array. Body draws first. Eyebrows draw last. */
export const PART_RENDER_ORDER: PartName[] = ['body', 'eyes', 'mouth', 'eyebrows'];

/** Standard 2D pixel coordinate offset. */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Loop mode for animation playback.
 * - 'infinite': loops continuously until stopped.
 * - 'once': plays one time and returns to default animation.
 * - number: plays N complete cycles then returns to default animation.
 */
export type LoopMode = 'infinite' | 'once' | number;

/**
 * Supported high-level expression presets for CHLEO reactions.
 */
export type ChleoExpression =
  | 'idle'
  | 'blink'
  | 'speak'
  | 'sleep'
  | 'close_eyes'
  | 'angry'
  | 'yawn'
  | 'question';

/** Alias for backward compatibility during CHLEO rebranding. */
export type CleoExpression = ChleoExpression;

/**
 * Animation definition for an individual avatar part.
 * Sprite sheet uses horizontal strip image format.
 */
export interface AnimationDef {
  /** Path to sprite sheet image asset. */
  src: string;

  /** Total frame count in the horizontal strip. */
  frameCount: number;

  /** Frame width in pixels. */
  frameWidth: number;

  /** Frame height in pixels. */
  frameHeight: number;

  /**
   * Per-frame position offsets for this animation.
   * Offsets apply relative to the base position.
   */
  frameOffsets?: Vec2[];

  /** Loop behavior for this animation definition. */
  loop?: LoopMode;
}

/**
 * Configuration structure for one avatar part.
 */
export interface PartConfig {
  /** Base position on the canvas in sprite pixels. */
  basePosition: Vec2;

  /** Map of animation names to animation definitions. */
  animations: Record<string, AnimationDef>;

  /** Default animation name for fallback playback. */
  defaultAnimation: string;
}

export type KeyframeOffsetMap = Record<number, Partial<Record<PartName, Vec2>>>;

/**
 * Complete configuration structure for CHLEO avatar composition.
 */
export interface AvatarConfig {
  /** Canvas width in sprite pixels before scale factor. */
  canvasWidth: number;

  /** Canvas height in sprite pixels before scale factor. */
  canvasHeight: number;

  /** Render scale multiplier factor. */
  scale: number;

  /** Keyframe offsets keyed by master frame index. */
  globalKeyframeOffsets?: KeyframeOffsetMap;

  /** Cycle duration in milliseconds. Default duration is 1000ms. */
  cycleDurationMs?: number;

  /** Avatar part configuration map. */
  parts: Record<PartName, PartConfig>;

  /** Overall frame per cycle */
  masterFrameCount: number;
}
