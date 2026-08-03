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
 * Sprite sheet uses horizontal strip image format or an array of src
 */
interface BaseAnimationDef {
  frameOffsets?: Vec2[];
  loop?: LoopMode;
}

export interface SpriteSheetDef extends BaseAnimationDef {
  type: 'spritesheet';
  src: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
}

export interface FrameArrayDef extends BaseAnimationDef {
  type: 'framearray';
  srcArray: string[] | null;

  /**
   * Per-frame hold durations in ticks. Each value sets how many
   * render ticks the compositor shows that frame before it advances.
   * Index-aligned with srcArray. If not set, each frame holds for 1 tick.
   */
  holdTicks?: number[];
}

export type AnimationDef = SpriteSheetDef | FrameArrayDef;
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
