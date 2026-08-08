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
import type { EmotionFrameConfig, PlutchikEmotion, ResponseType } from './emotions/emotion-types';
import { getAvatarEmotionFrames } from './emotions/response-frame-map';
import { defaultSpeechOrchestrator } from './tts/speech-orchestrator';

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

  /** Hold-tick counter for frame-array animations. Tracks how many
   *  ticks the current frame has been displayed. */
  holdCounter: number;
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

  /** Tick counter for auto-blink injection during speech. */
  private blinkTickCounter: number = 0;

  /** Next randomized blink interval target in master ticks. */
  private nextBlinkAt: number = 30;

  /** Active word start frame anchors for synchronized word playback. */
  private activeWordAnchors: WordStartAnchor[] = [];

  /** Callback triggered when mouth animation reaches a word start frame. */
  private onWordStartCallback: ((wordIndex: number, word: string) => void) | null = null;

  /**
   * Blink interval range in ticks. A random value between min and
   * max is chosen after each blink to vary the rhythm.
   */
  private readonly BLINK_MIN_TICKS = 18;
  private readonly BLINK_MAX_TICKS = 35;

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
        holdCounter: 0,
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
  /**
   * Inject composed frame arrays and hold ticks as transient 'speak'
   * animation definitions into the runtime config. Play them once per
   * affected part.
   *
   * Parts not in the composed map keep their current animation.
   * New images not in the preload cache are loaded on demand.
   */
  async playSpeakSequence(result: ComposedSpeakResult): Promise<void> {
    const { frames: composed, holdTicks: composedHolds } = result;

    // Collect all unique image URLs that need loading.
    const allSrcs: string[] = [];
    for (const frames of Object.values(composed)) {
      if (frames) allSrcs.push(...frames);
    }

    // Load any images not in the cache.
    await ensureImagesLoaded(allSrcs, this.images);

    // Reset blink counter at start of speech.
    this.blinkTickCounter = 0;
    this.nextBlinkAt = this.randomBlinkInterval();

    // Store active word start anchors if provided.
    this.activeWordAnchors = result.wordAnchors ? [...result.wordAnchors] : [];

    // Inject transient FrameArrayDef for each affected part and play.
    for (const [part, srcArray] of Object.entries(composed) as [PartName, string[]][]) {
      if (!srcArray || srcArray.length === 0) continue;

      const speakDef: FrameArrayDef = {
        type: 'framearray',
        srcArray,
        holdTicks: composedHolds[part] ?? undefined,
        loop: 'once',
      };

      // Inject into the runtime config animations map.
      this.config.parts[part].animations['speak'] = speakDef;

      // Play the composed speak animation once.
      this.playAnimation(part, 'speak', 'once');
    }
  }

  /**
   * Play speech sequence with Plutchik emotion and sentence response type using TTS.
   */
  async speakWithEmotion(
    text: string,
    overallEmotion: PlutchikEmotion,
    responseType: ResponseType
  ): Promise<void> {
    const emotionConfigs = getAvatarEmotionFrames(overallEmotion, responseType);
    await this.speakWithEmotionConfig(text, emotionConfigs);
  }

  /**
   * Play speech sequence with explicit EmotionFrameConfig override using TTS.
   */
  async speakWithEmotionConfig(
    text: string,
    emotionConfigs: EmotionFrameConfig
  ): Promise<void> {
    const tickMs = (this.config.cycleDurationMs ?? 1000) / this.config.masterFrameCount;
    const packet = await defaultSpeechOrchestrator.preRenderSpeech(text, tickMs, emotionConfigs);
    defaultSpeechOrchestrator.playPreRenderedSpeech(packet, this);
  }


  /**
   * Registers a callback fired when the mouth animation reaches a word start frame.
   *
   * @param cb - Callback receiving wordIndex and word string.
   */
  setOnWordStartCallback(cb: ((wordIndex: number, word: string) => void) | null): void {
    this.onWordStartCallback = cb;
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
    state.holdCounter = 0;
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
          const tickMs = (this.config.cycleDurationMs ?? 1000) / this.config.masterFrameCount;
          defaultSpeechOrchestrator.preRenderSpeech(text, tickMs).then(packet => {
            defaultSpeechOrchestrator.playPreRenderedSpeech(packet, this);
          });
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

    // Increment blink counter during active speak animations.
    const mouthState = this.partStates.mouth;
    if (mouthState.currentAnim === 'speak') {
      this.blinkTickCounter++;
      if (this.blinkTickCounter >= this.nextBlinkAt) {
        // Only blink if eyes are not already in a speak animation.
        const eyeState = this.partStates.eyes;
        if (eyeState.currentAnim !== 'speak') {
          this.playAnimation('eyes', 'blink', 'once');
        }
        this.blinkTickCounter = 0;
        this.nextBlinkAt = this.randomBlinkInterval();
      }
    }

    for (const part of PART_RENDER_ORDER) {
      const state = this.partStates[part];
      const animDef = this.config.parts[part].animations[state.currentAnim];
      if (!animDef) continue;

      const frameCount = animDef.type === 'spritesheet'
        ? animDef.frameCount
        : (animDef.srcArray?.length ?? 0);

      if (frameCount <= 1) {
        state.localFrame = 0;
        continue;
      }

      // --- Trigger word start callback when mouth animation reaches word frame ---
      if (part === 'mouth' && state.currentAnim === 'speak' && state.holdCounter === 0) {
        const anchor = this.activeWordAnchors.find(a => a.frameIndex === state.localFrame);
        if (anchor && this.onWordStartCallback) {
          this.onWordStartCallback(anchor.wordIndex, anchor.word);
        }
      }

      // --- Hold-tick logic for frame-array animations ---
      if (animDef.type === 'framearray' && animDef.holdTicks && animDef.holdTicks.length > 0) {
        state.holdCounter++;
        const holdNeeded = animDef.holdTicks[state.localFrame] ?? 1;

        if (state.holdCounter < holdNeeded) {
          // Still holding this frame — do not advance.
          continue;
        }

        // Hold complete — reset counter and advance.
        state.holdCounter = 0;
        state.localFrame++;
      } else {
        // Default: advance 1 frame per tick (spritesheet or no holdTicks).
        state.localFrame++;
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

  /**
   * Generate a random blink interval between min and max tick values.
   */
  private randomBlinkInterval(): number {
    return this.BLINK_MIN_TICKS +
      Math.floor(Math.random() * (this.BLINK_MAX_TICKS - this.BLINK_MIN_TICKS));
  }
}

/** Word boundary frame anchor for synchronized word playback. */
export interface WordStartAnchor {
  /** Index of word in phrase token sequence. */
  wordIndex: number;

  /** Clean word text string. */
  word: string;

  /** Local frame index where word animation starts. */
  frameIndex: number;

  /** Spoken word duration in milliseconds. */
  durationMs?: number;
}

/**
 * Result of speech composition. Contains frame arrays,
 * hold-tick arrays per part, and word boundary anchors.
 */
export interface ComposedSpeakResult {
  /** Per-part frame source arrays. */
  frames: Partial<Record<PartName, string[]>>;

  /** Per-part hold-tick arrays (index-aligned with frames). */
  holdTicks: Partial<Record<PartName, number[]>>;

  /** Word boundary frame anchors for sync. */
  wordAnchors?: WordStartAnchor[];
}


