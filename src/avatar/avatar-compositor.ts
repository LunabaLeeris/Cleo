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
  EYE_FRAMES,
  type WordFrames,
} from './speak-frame-map';
import { computeHoldTicks } from './speech-timing';
import type { EmotionFrameConfig, PlutchikEmotion, ResponseType } from './emotions/emotion-types';
import { getAvatarEmotionFrames } from './emotions/response-frame-map';

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
   * Compose per-part frame arrays and hold-tick timings from input text and emotional state.
   *
   * Pipeline:
   *  1. Tokenize text into words and trailing punctuation.
   *  2. Look up each word in the viseme frame map for mouth movements.
   *  3. Compute hold-tick timing per word.
   *  4. Apply eyebrow, eye, and body frame selections from emotionFrames.
   *  5. Inject blink frames during long utterances.
   *  6. After punctuation, duplicate the last frame to simulate a pause.
   *
   * @param text          - Spoken phrase text.
   * @param emotionFrames - Optional emotion frame overrides for eyebrows, eyes, and body.
   * @returns A composition result with frame arrays and hold ticks per part.
   */
  composeSpeakAnimation(
    text: string,
    emotionFrames?: EmotionFrameConfig
  ): ComposedSpeakResult {
    const tokens = tokenizeText(text);
    if (tokens.length === 0) {
      console.warn('[AvatarCompositor] composeSpeakAnimation called with empty text.');
      return { frames: {}, holdTicks: {} };
    }

    console.log(`[AvatarCompositor] Composing speak animation for ${tokens.length} token(s):`,
      tokens.map(t => `"${t.word}"${t.trailingPunctuation}`).join(' '));

    // Accumulate frames and hold ticks per part across all tokens.
    const composed: Partial<Record<PartName, string[]>> = {};
    const composedHolds: Partial<Record<PartName, number[]>> = {};

    let prevLastMouthFrame: string | null = null;
    let totalMouthFrames = 0;
    let lastBlinkInjection = 0;
    const BLINK_INJECT_INTERVAL = 25; // Inject blink every ~25 mouth frames

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const wordFrames: WordFrames = getWordFrames(token.word);
      const mouthFrames = wordFrames.mouth ?? [];

      // --- Compute hold ticks for this word ---
      const wordHolds = computeHoldTicks(token.word, mouthFrames);

      // Inter-word gap: 0 if previous word had punctuation, 1 otherwise
      const prevHasPunctuation = i > 0 && tokens[i - 1].trailingPunctuation.length > 0;
      const gapTicks = prevHasPunctuation ? 0 : 1;

      // --- Coarticulation-aware gap insertion ---
      if (i > 0 && mouthFrames.length > 0) {
        const nextFirstFrame = mouthFrames[0];

        // Skip the neutral gap when adjacent mouth shapes are compatible.
        const shouldElideGap = prevLastMouthFrame !== null && (
          // Same viseme on both sides — hold it.
          prevLastMouthFrame === nextFirstFrame ||
          // Both are vowel-class visemes — blend directly.
          (isVowelViseme(prevLastMouthFrame) && isVowelViseme(nextFirstFrame))
        );

        if (!shouldElideGap && gapTicks > 0) {
          // Insert neutral gap frame(s).
          if (!composed.mouth) composed.mouth = [];
          if (!composedHolds.mouth) composedHolds.mouth = [];
          for (let g = 0; g < gapTicks; g++) {
            composed.mouth.push(MOUTH_FRAMES.neutral);
            composedHolds.mouth.push(1);
            totalMouthFrames++;
          }
        }
      }

      // --- Append mouth frames and hold ticks ---
      if (mouthFrames.length > 0) {
        if (!composed.mouth) composed.mouth = [];
        if (!composedHolds.mouth) composedHolds.mouth = [];
        composed.mouth.push(...mouthFrames);
        composedHolds.mouth.push(...wordHolds);
        totalMouthFrames += mouthFrames.length;
        prevLastMouthFrame = mouthFrames[mouthFrames.length - 1];
      }

      // --- Punctuation pause: duplicate the last mouth frame N times ---
      const pauseCount = getPauseFrameCount(token.trailingPunctuation);
      if (pauseCount > 0 && composed.mouth && composedHolds.mouth) {
        const lastFrame = composed.mouth[composed.mouth.length - 1];
        for (let p = 0; p < pauseCount; p++) {
          composed.mouth.push(lastFrame);
          composedHolds.mouth.push(1);
        }
        totalMouthFrames += pauseCount;
      }
    }

    // End with neutral mouth to return to idle.
    if (composed.mouth && composed.mouth.length > 0) {
      composed.mouth.push(MOUTH_FRAMES.closed);
      composedHolds.mouth!.push(1);
    }

    const mouthFrameCount = composed.mouth ? composed.mouth.length : 0;
    const mouthHoldList = composedHolds.mouth ? [...composedHolds.mouth] : [];

    // --- Fill Eyebrows, Eyes, and Body from EmotionFrameConfig throughout response ---
    if (emotionFrames && mouthFrameCount > 0) {
      if (emotionFrames.eyebrows) {
        composed.eyebrows = Array(mouthFrameCount).fill(emotionFrames.eyebrows);
        composedHolds.eyebrows = [...mouthHoldList];
      }
      if (emotionFrames.eyes) {
        composed.eyes = Array(mouthFrameCount).fill(emotionFrames.eyes);
        composedHolds.eyes = [...mouthHoldList];
      }
      if (emotionFrames.body) {
        composed.body = Array(mouthFrameCount).fill(emotionFrames.body);
        composedHolds.body = [...mouthHoldList];
      }
    }

    // --- Inject blink frames into eye sequence during long utterances ---
    if (composed.eyes && composedHolds.eyes) {
      for (let f = 0; f < composed.eyes.length; f++) {
        if (f - lastBlinkInjection >= BLINK_INJECT_INTERVAL) {
          composed.eyes[f] = EYE_FRAMES.closed;
          composedHolds.eyes[f] = 2;
          lastBlinkInjection = f;
        }
      }
    }

    // Log composed frame counts per part.
    for (const [part, frames] of Object.entries(composed)) {
      const holds = composedHolds[part as PartName];
      const totalTicks = holds ? holds.reduce((s, h) => s + h, 0) : frames.length;
      console.log(`[AvatarCompositor]   ${part}: ${frames.length} frames, ${totalTicks} total ticks`);
    }

    return { frames: composed, holdTicks: composedHolds };
  }


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
   * Play speech sequence with Plutchik emotion and sentence response type.
   */
  async speakWithEmotion(
    text: string,
    overallEmotion: PlutchikEmotion,
    responseType: ResponseType
  ): Promise<void> {
    const emotionFrames = getAvatarEmotionFrames(overallEmotion, responseType);
    const result = this.composeSpeakAnimation(text, emotionFrames);
    await this.playSpeakSequence(result);
  }

  /**
   * Play speech sequence with explicit EmotionFrameConfig override.
   */
  async speakWithEmotionConfig(
    text: string,
    emotionFrames: EmotionFrameConfig
  ): Promise<void> {
    const result = this.composeSpeakAnimation(text, emotionFrames);
    await this.playSpeakSequence(result);
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
          const result = this.composeSpeakAnimation(text);
          this.playSpeakSequence(result);
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
 * Result of composeSpeakAnimation(). Contains frame arrays,
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

/**
 * Set of vowel-class mouth viseme image sources.
 * Built from the actual imported constants so it works with any
 * URL format (Vite hashed paths, data URIs, relative paths, etc.).
 */
const VOWEL_VISEME_SRCS = new Set([
  MOUTH_FRAMES.aa,
  MOUTH_FRAMES.aaa,
  MOUTH_FRAMES.a,
  MOUTH_FRAMES.eh,
  MOUTH_FRAMES.ee,
  MOUTH_FRAMES.ey,
  MOUTH_FRAMES.i,
  MOUTH_FRAMES.o,
  MOUTH_FRAMES.oo,
  MOUTH_FRAMES.u,
]);

/**
 * Test whether a frame source corresponds to a vowel viseme.
 *
 * @param frameSrc - Image source path for a mouth frame.
 * @returns True if the viseme is a vowel (open-mouth) shape.
 */
function isVowelViseme(frameSrc: string): boolean {
  return VOWEL_VISEME_SRCS.has(frameSrc);
}

/**
 * Stretch or trim a frame array to match a target length.
 * When the source is shorter, the last frame is repeated.
 * When the source is longer, it is truncated.
 *
 * @param frames       - Source frame array.
 * @param targetLength - Desired output length.
 * @returns New array of exactly targetLength elements.
 */
function alignFramesToLength(frames: string[], targetLength: number): string[] {
  if (frames.length === targetLength) return [...frames];
  if (frames.length > targetLength) return frames.slice(0, targetLength);

  // Stretch: repeat last frame to fill.
  const result = [...frames];
  const lastFrame = frames[frames.length - 1];
  while (result.length < targetLength) {
    result.push(lastFrame);
  }
  return result;
}
