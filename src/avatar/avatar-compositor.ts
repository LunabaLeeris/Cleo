import type {
  AvatarConfig,
  PartName,
  Vec2,
  AnimationDef,
  FrameArrayDef,
  LoopMode,
  CleoExpression,
} from './sprite-types';
import { PART_RENDER_ORDER } from './sprite-types';
import { preloadAvatarSprites, ensureImagesLoaded } from './sprite-loader';
import {
  tokenizeText,
  getWordFrames,
  getPauseFrameCount,
  WORD_GAP_FRAMES,
  MOUTH_FRAMES,
  type WordFrames,
} from './speak-frame-map';

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
   * Compose per-part frame arrays from input text.
   *
   * Pipeline:
   *  1. Tokenize text into words + trailing punctuation.
   *  2. Look up each word in the frame map (fallback to default).
   *  3. Concatenate frames per part, inserting word-gap frames between words.
   *  4. After punctuation marks (. ! ? , etc.), duplicate the last frame
   *     N times to simulate a natural pause/hold.
   *
   * @returns A map of part names to their composed srcArray sequences.
   *          Only parts that have frames are included.
   */
  composeSpeakAnimation(text: string): Partial<Record<PartName, string[]>> {
    const tokens = tokenizeText(text);
    if (tokens.length === 0) {
      console.warn('[AvatarCompositor] composeSpeakAnimation called with empty text.');
      return {};
    }

    console.log(`[AvatarCompositor] Composing speak animation for ${tokens.length} token(s):`,
      tokens.map(t => `"${t.word}"${t.trailingPunctuation}`).join(' '));

    // Accumulate frames per part across all tokens.
    const composed: Partial<Record<PartName, string[]>> = {};

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const wordFrames: WordFrames = getWordFrames(token.word);

      // Append each part's word frames.
      for (const [part, frames] of Object.entries(wordFrames) as [PartName, string[]][]) {
        if (!frames || frames.length === 0) continue;
        if (!composed[part]) composed[part] = [];
        composed[part]!.push(...frames);

        // Apply punctuation pause: duplicate the last frame N times.
        const pauseCount = getPauseFrameCount(token.trailingPunctuation);
        if (pauseCount > 0) {
          const lastFrame = frames[frames.length - 1];
          for (let p = 0; p < pauseCount; p++) {
            composed[part]!.push(lastFrame);
          }
        }
      }

      // Insert word-gap frames between words (not after the last word).
      if (i < tokens.length - 1) {
        for (const [part, gapFrames] of Object.entries(WORD_GAP_FRAMES) as [PartName, string[]][]) {
          if (!gapFrames || gapFrames.length === 0) continue;
          if (!composed[part]) composed[part] = [];
          composed[part]!.push(...gapFrames);
        }
      }
    }

    // End with a closed mouth to return to neutral before idle revert.
    if (composed.mouth && composed.mouth.length > 0) {
      composed.mouth.push(MOUTH_FRAMES.closed);
    }

    // Log composed frame counts per part.
    for (const [part, frames] of Object.entries(composed)) {
      console.log(`[AvatarCompositor]   ${part}: ${frames.length} frames composed`);
    }

    return composed;
  }

  /**
   * Inject composed frame arrays as transient 'speak' animation defs
   * into the runtime config and play them once per affected part.
   *
   * Parts not present in the composed map are left untouched
   * (they keep their current animation).
   *
   * New images not in the preload cache are loaded on demand.
   */
  async playSpeakSequence(composed: Partial<Record<PartName, string[]>>): Promise<void> {
    // Collect all unique image URLs that need loading.
    const allSrcs: string[] = [];
    for (const frames of Object.values(composed)) {
      if (frames) allSrcs.push(...frames);
    }

    // Load any images not yet cached.
    await ensureImagesLoaded(allSrcs, this.images);

    // Inject transient FrameArrayDef for each affected part and play.
    for (const [part, srcArray] of Object.entries(composed) as [PartName, string[]][]) {
      if (!srcArray || srcArray.length === 0) continue;

      const speakDef: FrameArrayDef = {
        type: 'framearray',
        srcArray,
        loop: 'once',
      };

      // Inject into the runtime config animations map.
      this.config.parts[part].animations['speak'] = speakDef;

      // Play the composed speak animation once.
      this.playAnimation(part, 'speak', 'once');
    }
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
  setExpression(expression: CleoExpression, text?: string): void {
    switch (expression) {
      case 'idle':
        this.resetAll();
        break;
      case 'blink':
        this.playAnimation('eyes', 'blink', 'once');
        break;
      case 'speak': {
        if (text && text.trim().length > 0) {
          const composed = this.composeSpeakAnimation(text);
          this.playSpeakSequence(composed);
        } else {
          // Fallback: play static speak animation if no text provided.
          this.playAnimation('mouth', 'speak', 'once');
        }
        break;
      }
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
