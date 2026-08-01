import type {
  AvatarConfig,
  PartName,
  Vec2,
  AnimationDef,
  LoopMode,
  CleoExpression,
} from './sprite-types';
import { PART_RENDER_ORDER } from './sprite-types';
import { preloadAvatarSprites } from './sprite-loader';

/**
 * Runtime animation state for a single avatar part.
 */
interface PartAnimationState {
  /** Name of the active animation key. */
  currentAnim: string;

  /** Local frame counter within active animation. */
  localFrame: number;

  /** Total completed animation loop cycles. */
  completedCycles: number;

  /** Active loop behavior mode. */
  loopMode: LoopMode;
}

/**
 * Orchestrates rendering clock and avatar composition on HTML5 Canvas.
 * Combines body, eyes, mouth, and eyebrows layers.
 */
export class AvatarCompositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: AvatarConfig;

  /** Global master frame counter. */
  private globalFrame: number = 0;

  /** Per-part runtime animation state. */
  private partStates: Record<PartName, PartAnimationState>;

  /** Preloaded HTML Image element cache. */
  private images: Map<string, HTMLImageElement> = new Map();

  /** Timer handle for render loop. */
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  /** Status flag for initialization completion. */
  private initialized: boolean = false;

  constructor(canvas: HTMLCanvasElement, config: AvatarConfig) {
    this.canvas = canvas;
    this.config = config;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to obtain 2D context from canvas.');
    }

    this.ctx = ctx;

    this.applyCanvasDimensions();

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
   * Apply configured width, height, and scale factor to the canvas.
   */
  private applyCanvasDimensions(): void {
    this.canvas.width = this.config.canvasWidth * this.config.scale;
    this.canvas.height = this.config.canvasHeight * this.config.scale;
    this.ctx.imageSmoothingEnabled = false;
  }

  /**
   * Load sprite sheet images and prepare compositor.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    this.images = await preloadAvatarSprites(this.config);
    this.initialized = true;
    console.log(`[AvatarCompositor] Loaded ${this.images.size} sprite assets.`);
  }

  /**
   * Start the animation tick interval loop.
   */
  start(): void {
    if (this.tickInterval !== null) return;

    const tickMs = this.config.cycleDurationMs / this.config.masterFrameCount;
    this.tickInterval = setInterval(() => this.tick(), tickMs);
    this.render();
  }

  /**
   * Stop the animation tick interval loop.
   */
  stop(): void {
    if (this.tickInterval !== null) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  /**
   * Change cycle duration in milliseconds at runtime.
   */
  setCycleDurationMs(durationMs: number): void {
    this.config.cycleDurationMs = Math.max(100, durationMs);
    if (this.tickInterval !== null) {
      this.stop();
      this.start();
    }
  }

  /**
   * Change render scale factor at runtime.
   */
  setScale(scale: number): void {
    this.config.scale = Math.max(1, scale);
    this.applyCanvasDimensions();
    this.render();
  }

  /**
   * Play a named animation sequence on a specific avatar part.
   */
  playAnimation(part: PartName, animName: string, loopOverride?: LoopMode): void {
    const partConfig = this.config.parts[part];
    const animDef = partConfig?.animations?.[animName];
    if (!animDef) {
      console.warn(`[AvatarCompositor] Animation "${animName}" missing for part "${part}".`);
      return;
    }

    const state = this.partStates[part];
    state.currentAnim = animName;
    state.localFrame = 0;
    state.completedCycles = 0;
    state.loopMode = loopOverride ?? animDef.loop ?? 'infinite';

    console.log(`[AvatarCompositor] Part "${part}" playing animation "${animName}" (loopMode: ${state.loopMode})`);

    // Reset master clock to 0 when body animation starts or restarts.
    if (part === 'body') {
      this.globalFrame = 0;
    }
  }

  /**
   * Trigger high-level CLEO expression preset across layers.
   */
  setExpression(expression: CleoExpression): void {
    switch (expression) {
      case 'idle':
        this.resetAll();
        break;
      case 'blink':
        this.playAnimation('eyes', 'blink', 'once');
        break;
      case 'speak':
        this.playAnimation('mouth', 'speak', 'infinite');
        break;
      case 'sleep':
        this.playAnimation('eyes', 'sleep', 'infinite');
        this.playAnimation('mouth', 'idle', 'infinite');
        this.playAnimation('eyebrows', 'idle', 'infinite');
        break;
      case 'close_eyes':
        this.playAnimation('eyes', 'close_eyes', 'infinite');
        break;
      case 'angry':
        this.playAnimation('eyebrows', 'angry', 'infinite');
        break;
      case 'yawn':
        this.playAnimation('mouth', 'yawn', 'once');
        this.playAnimation('eyes', 'blink', 'once');
        break;
      case 'question':
        this.playAnimation('eyebrows', 'question', 'once');
        break;
    }
  }

  /**
   * Reset one part to default animation state.
   */
  resetPart(part: PartName): void {
    const defaultAnim = this.config.parts[part].defaultAnimation;
    this.playAnimation(part, defaultAnim, 'infinite');
  }

  /**
   * Reset all avatar parts to default animation states.
   */
  resetAll(): void {
    // Reset global master frame clock to stay in sync with body frame 0.
    this.globalFrame = 0;
    for (const part of PART_RENDER_ORDER) {
      this.resetPart(part);
    }
  }

  /**
   * Query active animation name for a specified part.
   */
  getPartAnimation(part: PartName): string {
    return this.partStates[part].currentAnim;
  }

  /**
   * Query active master frame index.
   */
  getGlobalFrame(): number {
    return this.globalFrame;
  }

  /**
   * Execute single tick: render current frame then advance frame counters.
   */
  private tick(): void {
    this.render();
    this.advanceFrames();
  }

  /**
   * Render all avatar parts on canvas in bottom-to-top order.
   */
  private render(): void {
    const { canvasWidth, canvasHeight, scale } = this.config;
    this.ctx.clearRect(0, 0, canvasWidth * scale, canvasHeight * scale);

    for (const part of PART_RENDER_ORDER) {
      this.drawPart(part);
    }
  }

  /**
   * Draw single part sprite frame at calculated coordinates.
   */
  private drawPart(part: PartName): void {
    const partConfig = this.config.parts[part];
    const state = this.partStates[part];
    const animDef: AnimationDef | undefined = partConfig.animations[state.currentAnim];

    if (!animDef) {
      console.warn(`[AvatarCompositor] Missing animation definition "${state.currentAnim}" for part "${part}".`);
      return;
    }

    if ((animDef.type === 'spritesheet' && !animDef.src)
      || (animDef.type === 'framearray' && (!animDef.srcArray || animDef.srcArray.length === 0))) {
      console.warn(`[AvatarCompositor] Empty source in animation "${state.currentAnim}" for part "${part}".`);
      return;
    }

    let image: HTMLImageElement | undefined;
    let animFrame = 0;
    let drawWidth = 0;
    let drawHeight = 0;
    let sourceX = 0;

    if (animDef.type === 'spritesheet' && animDef.src) {
      image = this.images.get(animDef.src);
      const frameCount = Math.max(1, animDef.frameCount);
      animFrame = state.localFrame % frameCount;

      drawWidth = animDef.frameWidth;
      drawHeight = animDef.frameHeight;
      sourceX = animFrame * animDef.frameWidth;
    } else if (animDef.type === 'framearray' && animDef.srcArray && animDef.srcArray.length > 0) {
      const frameCount = animDef.srcArray.length;
      animFrame = state.localFrame % frameCount;
      const src = animDef.srcArray[animFrame];
      image = src ? this.images.get(src) : undefined;

      if (image) {
        drawWidth = image.width;
        drawHeight = image.height;
      }
      sourceX = 0;
    } else {
      return;
    }

    if (!image) {
      const targetSrc = animDef.type === 'spritesheet' ? animDef.src : animDef.srcArray?.[animFrame];
      console.warn(`[AvatarCompositor] Image not found in cache for part "${part}" (anim: "${state.currentAnim}", frame: ${animFrame}, src: "${targetSrc}")`);
      return;
    }

    const base = partConfig.basePosition;
    const globalOffset = this.getGlobalOffset(part);
    const animOffset = animDef.frameOffsets?.[animFrame] ?? { x: 0, y: 0 };

    /* Recalculate position based on offset in config */
    const finalX = base.x + globalOffset.x + animOffset.x;
    const finalY = base.y + globalOffset.y + animOffset.y;

    const { scale } = this.config;

    this.ctx.drawImage(
      image,
      sourceX,
      0,
      drawWidth,
      drawHeight,
      finalX * scale,
      finalY * scale,
      drawWidth * scale,
      drawHeight * scale
    );
  }

  /**
   * Retrieve global keyframe offset for a part at current master frame.
   */
  private getGlobalOffset(part: PartName): Vec2 {
    const masterFrame = this.globalFrame % this.config.masterFrameCount;
    const frameOffsets = this.config.globalKeyframeOffsets?.[masterFrame];
    if (!frameOffsets) return { x: 0, y: 0 };
    return frameOffsets[part] ?? { x: 0, y: 0 };
  }

  /**
   * Advance global frame counter and part local frame counters.
   */
  private advanceFrames(): void {
    this.globalFrame = (this.globalFrame + 1) % this.config.masterFrameCount;

    for (const part of PART_RENDER_ORDER) {
      const state = this.partStates[part];
      const animDef = this.config.parts[part].animations[state.currentAnim];
      if (!animDef) continue;

      state.localFrame++;
      const frameCount = animDef.type === 'spritesheet'
        ? animDef.frameCount
        : (animDef.srcArray?.length ?? 0);

      if (frameCount <= 1) {
        state.localFrame = 0;
        continue;
      }

      if (state.localFrame >= frameCount) {
        state.completedCycles++;

        if (this.shouldRevertToDefault(state)) {
          this.resetPart(part);
        } else {
          state.localFrame = state.localFrame % frameCount;
        }
      }
    }
  }

  /**
   * Determine whether active part animation completed configured loop quota.
   */
  private shouldRevertToDefault(state: PartAnimationState): boolean {
    const { loopMode, completedCycles } = state;

    if (loopMode === 'infinite') return false;
    if (loopMode === 'once') return completedCycles >= 1;
    if (typeof loopMode === 'number') return completedCycles >= loopMode;

    return false;
  }
}
