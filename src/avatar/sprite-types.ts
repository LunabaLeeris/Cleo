/** Names of the composable avatar parts, rendered bottom-to-top in this order. */
export type PartName = 'body' | 'eyes' | 'mouth' | 'eyebrows';

/** Ordered render list — body is drawn first (bottom), eyebrows last (top). */
export const PART_RENDER_ORDER: PartName[] = ['body', 'eyes', 'mouth', 'eyebrows'];

/** A 2D pixel offset. */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Controls how an animation loops.
 * - 'infinite': loops forever until explicitly changed.
 * - 'once':     plays once then auto-reverts to the part's default animation.
 * - number:     plays exactly N full cycles then auto-reverts to default.
 */
export type LoopMode = 'infinite' | 'once' | number;

/**
 * Defines a single animation for a single part.
 * The sprite sheet is a horizontal strip of equally-sized frames.
 *
 * Animations shorter than masterFrameCount hold on their last frame.
 * Animations longer than masterFrameCount span multiple master cycles.
 */
export interface AnimationDef {
  /** Path to the sprite sheet image (horizontal strip). */
  src: string;

  /** Number of frames in the strip. Must be a factor of 12 OR divisible by 12. */
  frameCount: number;

  /** Width of a single frame in pixels. */
  frameWidth: number;

  /** Height of a single frame in pixels. */
  frameHeight: number;

  /**
   * Per-frame positional offsets LOCAL to this animation.
   * Length must equal frameCount. Offsets are relative to the part's base position.
   * If omitted, defaults to {x:0, y:0} for every frame.
   */
  frameOffsets?: Vec2[];

  /**
   * Loop behavior for this animation. Defaults to 'infinite' if not specified.
   * - 'infinite': loops forever.
   * - 'once': plays all frames once, then reverts to the part's default animation.
   * - number N: plays all frames N complete times, then reverts to default.
   */
  loop?: LoopMode;
}

/**
 * Configuration for one avatar part.
 */
export interface PartConfig {
  /** Base (default) position of this part on the canvas, in sprite pixels. */
  basePosition: Vec2;

  /** Map of animation name → AnimationDef for this part. */
  animations: Record<string, AnimationDef>;

  /** Which animation to start with (and to fall back to when a finite animation ends). */
  defaultAnimation: string;
}

export type KeyframeOffsetMap = Record<number, Partial<Record<PartName, Vec2>>>;

/**
 * Full avatar configuration.
 */
export interface AvatarConfig {
  /** Width of the canvas in sprite pixels (before scaling). */
  canvasWidth: number;

  /** Height of the canvas in sprite pixels (before scaling). */
  canvasHeight: number;

  /**
   * Number of frames in one master cycle.
   * Determines how many ticks make up a full animation loop.
   */
  masterFrameCount: number;

  /**
   * Duration of one full master cycle in milliseconds.
   * Tick interval = cycleDurationMs / masterFrameCount.
   */
  cycleDurationMs: number;

  /** Integer render scale (e.g., 2 for 2× pixel art scaling). */
  scale: number;

  /** Per-part configuration keyed by PartName. */
  parts: Record<PartName, PartConfig>;

  /**
   * Global per-frame offsets that shift non-body parts to follow body motion.
   * Keyed by master frame index (0 to masterFrameCount-1). Missing frames default to {x:0, y:0}.
   */
  globalKeyframeOffsets: KeyframeOffsetMap;
}
