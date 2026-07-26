import type {
  AvatarConfig,
  PartName,
  Vec2,
  AnimationDef,
  KeyframeOffsetMap,
  LoopMode,
} from './sprite-types';
import { PART_RENDER_ORDER } from './sprite-types';
import { preloadAvatarSprites } from './sprite-loader';

/**
 * Runtime state for a single part's current animation.
 */
interface PartAnimationState {
  /** Key into PartConfig.animations for the currently playing animation. */
  currentAnim: string;

  /**
   * Local frame counter within the current animation.
   * Advances by 1 each master tick. Resets to 0 when animation changes.
   */
  localFrame: number;

  /**
   * How many complete cycles of this animation have been played.
   * A "cycle" = localFrame has advanced through all frameCount frames once.
   */
  completedCycles: number;

  /**
   * Resolved loop mode for the current animation.
   * Cached here so no need to look it up every tick.
   */
  loopMode: LoopMode;
}

/**
 * 
 * Orchestrates a global N-frame master clock. Each avatar part (body, eyes,
 * mouth, eyebrows) runs its own animation independently. Parts are composed
 * onto a single <canvas> each tick.
 *
 * ## Key behaviors:
 * - Calling `playAnimation(part, anim)` always starts the new animation from
 *   frame 0, regardless of the current master frame.
 * - The global master frame counter is NEVER reset when a part changes animation.
 * - Global keyframe offsets (e.g., breathing dip) are applied based on the master
 *   frame, so face parts always track the body.
 * - Animations with `loop: 'once'` or `loop: N` auto-revert to the part's
 *   default animation when finished.
 */
export class AvatarCompositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: AvatarConfig;

  /** Master frame counter. Wraps every masterFrameCount ticks. */
  private globalFrame = 0;

  /** Per-part animation state. */
  private partStates: Record<PartName, PartAnimationState>;

  private images: Map<string, HTMLImageElement> = new Map();

  /** Handle for the tick interval (null when stopped). */
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  /** Whether the compositor has been initialized (sprites loaded). */
  private initialized = false;

  constructor(canvas: HTMLCanvasElement, config: AvatarConfig) {
    this.canvas = canvas;
    this.config = config;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context from canvas.');
    }
    this.ctx = ctx;

    // Set canvas dimensions (scaled)
    this.canvas.width = config.canvasWidth * config.scale;
    this.canvas.height = config.canvasHeight * config.scale;

    // Disable image smoothing for crisp pixel art
    this.ctx.imageSmoothingEnabled = false;

    // Initialize all parts to their default animations
    this.partStates = {} as Record<PartName, PartAnimationState>;
    for (const partName of PART_RENDER_ORDER) {
      const partConfig = config.parts[partName];
      const defaultAnim = partConfig.defaultAnimation;
      const animDef = partConfig.animations[defaultAnim];
      this.partStates[partName] = {
        currentAnim: defaultAnim,
        localFrame: 0,
        completedCycles: 0,
        loopMode: animDef?.loop ?? 'infinite',
      };
    }
  }

  /**
   * Load all sprite sheets and start the animation loop.
   * Safe to call multiple times — subsequent calls are no-ops.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    this.images = await preloadAvatarSprites(this.config);
    this.initialized = true;

    for (const [src, img] of this.images.entries()) {
      console.log(
        `[AvatarCompositor] Loaded: ${src} (${img.naturalWidth}×${img.naturalHeight})`
      );
    }
    console.log(`[AvatarCompositor] Initialized with ${this.images.size} sprites.`);
  }

  /**
   * Start the animation tick loop.
   * Must call `init()` first to load sprites.
   */
  start(): void {
    if (this.tickInterval !== null) return; // Already running

    const tickMs = this.config.cycleDurationMs / this.config.masterFrameCount;
    this.tickInterval = setInterval(() => this.tick(), tickMs);

    // Draw the first frame immediately
    this.render();
  }

  /**
   * Stop the animation tick loop. The canvas retains its last frame.
   */
  stop(): void {
    if (this.tickInterval !== null) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  /**
   * Play a named animation on a specific part.
   *
   * The animation ALWAYS starts from frame 0, regardless of the current
   * master frame position. The global frame counter is NOT reset.
   *
   * @param part      Which part to animate.
   * @param animName  Key into the part's animations map.
   * @param loopOverride  Optional override for the animation's loop mode.
   *                      If not provided, uses the AnimationDef's `loop` field
   *                      (defaulting to 'infinite').
   */
  playAnimation(part: PartName, animName: string, loopOverride?: LoopMode): void {
    const partConfig = this.config.parts[part];
    const animDef = partConfig.animations[animName];
    if (!animDef) {
      console.warn(
        `[AvatarCompositor] Animation "${animName}" not found for part "${part}".`
      );
      return;
    }

    const state = this.partStates[part];
    state.currentAnim = animName;
    state.localFrame = 0;
    state.completedCycles = 0;
    state.loopMode = loopOverride ?? animDef.loop ?? 'infinite';
  }

  /**
   * Revert a part to its default (idle) animation.
   * Equivalent to `playAnimation(part, partConfig.defaultAnimation)` with infinite loop.
   */
  resetPart(part: PartName): void {
    const defaultAnim = this.config.parts[part].defaultAnimation;
    this.playAnimation(part, defaultAnim, 'infinite');
  }

  /**
   * Revert ALL parts to their default animations.
   */
  resetAll(): void {
    for (const part of PART_RENDER_ORDER) {
      this.resetPart(part);
    }
  }

  /**
   * Update a part's base position at runtime.
   * Useful for repositioning parts after loading different sprite sizes.
   */
  setPartBasePosition(part: PartName, position: Vec2): void {
    this.config.parts[part].basePosition = { ...position };
  }

  /**
   * Replace the global keyframe offset map at runtime.
   */
  setGlobalKeyframeOffsets(offsets: KeyframeOffsetMap): void {
    this.config.globalKeyframeOffsets = offsets;
  }

  /**
   * Get the current animation name for a part.
   */
  getPartAnimation(part: PartName): string {
    return this.partStates[part].currentAnim;
  }

  /**
   * Get the current global master frame (0–11).
   */
  getGlobalFrame(): number {
    return this.globalFrame;
  }
  /**
   * Advance one tick: render the current frame, then advance all counters.
   */
  private tick(): void {
    this.render();
    this.advanceFrames();
  }

  /**
   * Render the current state of all parts onto the canvas.
   */
  private render(): void {
    const { canvasWidth, canvasHeight, scale } = this.config;
    this.ctx.clearRect(0, 0, canvasWidth * scale, canvasHeight * scale);

    for (const part of PART_RENDER_ORDER) {
      this.drawPart(part);
    }
  }

  /**
   * Draw a single part at its computed position for the current frame.
   */
  private drawPart(part: PartName): void {
    const partConfig = this.config.parts[part];
    const state = this.partStates[part];
    const animDef: AnimationDef | undefined =
      partConfig.animations[state.currentAnim];

    if (!animDef || !animDef.src) return;

    // Get the loaded image
    const image = this.images.get(animDef.src);
    if (!image) return; // Sprite not loaded — skip silently

    // Determine which frame of the animation to show
    const animFrame = state.localFrame % animDef.frameCount;

    // Compute final position: base + global offset + animation offset
    const base = partConfig.basePosition;
    const globalOffset = this.getGlobalOffset(part);
    const animOffset = animDef.frameOffsets?.[animFrame] ?? { x: 0, y: 0 };

    const finalX = base.x + globalOffset.x + animOffset.x;
    const finalY = base.y + globalOffset.y + animOffset.y;

    const { scale } = this.config;

    // Draw the correct frame from the horizontal sprite strip
    this.ctx.drawImage(
      image,
      // Source rectangle (from the sprite sheet)
      animFrame * animDef.frameWidth,
      0,
      animDef.frameWidth,
      animDef.frameHeight,
      // Destination rectangle (on the canvas, scaled)
      finalX * scale,
      finalY * scale,
      animDef.frameWidth * scale,
      animDef.frameHeight * scale
    );
  }

  /**
   * Get the global keyframe offset for a part at the current master frame.
   */
  private getGlobalOffset(part: PartName): Vec2 {
    const masterFrame = this.globalFrame % this.config.masterFrameCount;
    const frameOffsets = this.config.globalKeyframeOffsets[masterFrame];
    if (!frameOffsets) return { x: 0, y: 0 };
    return frameOffsets[part] ?? { x: 0, y: 0 };
  }

  /**
   * Advance all frame counters after rendering.
   * Handles loop completion and auto-revert to default animations.
   */
  private advanceFrames(): void {
    // Advance global master frame
    this.globalFrame = (this.globalFrame + 1) % this.config.masterFrameCount;

    // Advance each part's local frame
    for (const part of PART_RENDER_ORDER) {
      const state = this.partStates[part];
      const animDef = this.config.parts[part].animations[state.currentAnim];
      if (!animDef) continue;

      state.localFrame++;

      // Single-frame animations just hold frame 0 — nothing to advance.
      if (animDef.frameCount <= 1) {
        state.localFrame = 0;
        continue;
      }

      // Check if we just completed a full cycle of this animation
      if (state.localFrame >= animDef.frameCount) {
        state.completedCycles++;

        // Determine if we should stop and revert to default
        const shouldRevert = this.shouldRevertToDefault(state);
        if (shouldRevert) {
          this.resetPart(part);
        } else {
          // Wrap localFrame so it doesn't grow unbounded
          state.localFrame = state.localFrame % animDef.frameCount;
        }
      }
    }
  }

  /**
   * Check if a part's animation has finished its loop quota
   * and should revert to the default animation.
   */
  private shouldRevertToDefault(state: PartAnimationState): boolean {
    const { loopMode, completedCycles } = state;

    if (loopMode === 'infinite') {
      return false;
    }
    if (loopMode === 'once') {
      return completedCycles >= 1;
    }
    // Numeric loop count
    if (typeof loopMode === 'number') {
      return completedCycles >= loopMode;
    }

    return false;
  }
}
