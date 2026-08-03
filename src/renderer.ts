import './index.css';
import { AvatarCompositor, defaultAvatarConfig } from './avatar';

// Type checking definitions for exposed window API
interface Window {
  electronAPI: {
    onBrowserActivity: (callback: (data: { url: string; title: string }) => void) => void;
    setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => void;
    dragWindow: (dx: number, dy: number) => void;
  };
}

const bubble = document.getElementById('bubble') as HTMLDivElement;
const avatar = document.getElementById('avatar') as HTMLDivElement;
const canvas = document.getElementById('avatar-canvas') as HTMLCanvasElement;

const compositor = new AvatarCompositor(canvas, defaultAvatarConfig);

// Avatar compose
(async () => {
  await compositor.init();
  compositor.start();
  console.log('[Renderer] AvatarCompositor started.');
})();

// Smooth window
let isDragging = false;
let startX = 0;
let startY = 0;

// State to track if mouse is over interactive parts (avatar or speech bubble)
let isMouseOverInteractive = false;

window.addEventListener('mousemove', (event) => {
  // If we are actively dragging, keep it interactive
  if (isDragging) return;

  const rectAvatar = avatar.getBoundingClientRect();
  const rectBubble = bubble.getBoundingClientRect();

  const x = event.clientX;
  const y = event.clientY;

  // Check if mouse coordinates are within avatar or visible bubble boundaries
  const overAvatar = x >= rectAvatar.left && x <= rectAvatar.right &&
    y >= rectAvatar.top && y <= rectAvatar.bottom;
  const overBubble = bubble.classList.contains('visible') &&
    x >= rectBubble.left && x <= rectBubble.right &&
    y >= rectBubble.top && y <= rectBubble.bottom;

  const shouldBeInteractive = overAvatar || overBubble;

  if (shouldBeInteractive !== isMouseOverInteractive) {
    isMouseOverInteractive = shouldBeInteractive;
    (window as any).electronAPI?.setIgnoreMouseEvents(!shouldBeInteractive, { forward: true });
  }
});

avatar.addEventListener('mousedown', (e) => {
  if (e.button === 0) { // Left click only
    isDragging = true;
    startX = e.screenX;
    startY = e.screenY;
    avatar.style.cursor = 'grabbing';
  }
});

window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const dx = e.screenX - startX;
    const dy = e.screenY - startY;
    startX = e.screenX;
    startY = e.screenY;
    (window as any).electronAPI?.dragWindow(dx, dy);
  }
});

window.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    avatar.style.cursor = 'grab';
  }
});

// State helpers
/**
 * Start speaking animation with text-aware composition.
 * Uses the full prosody + timing pipeline.
 */
function startSpeaking(text: string): void {
  compositor.setExpression('speak', text);
}

/**
 * Return to idle: reset all parts to their defaults.
 */
function stopSpeaking(): void {
  compositor.resetAll();
}

// Click to blink
canvas.addEventListener('click', () => {
  compositor.playAnimation('eyes', 'blink');
});

// Google activity handler
(window as any).electronAPI?.onBrowserActivity((data: { url: string; title: string }) => {
  const hostname = new URL(data.url).hostname;
  let speech = `Visiting ${hostname}, huh?`;

  // Simple rule-based conditional reactions for testing
  if (hostname.includes('youtube.com')) {
    speech = "Watching videos again? Don't forget your tasks!";
  } else if (hostname.includes('github.com') || hostname.includes('stackoverflow.com')) {
    speech = "Ooh, writing code! You're locked in.";
  } else if (hostname.includes('facebook.com') || hostname.includes('reddit.com')) {
    speech = "I thought you want to stop using facebook?";
  }

  showSpeechBubble(speech);
});

let speakingTimeout: NodeJS.Timeout;
let bubbleTimeout: NodeJS.Timeout;
function showSpeechBubble(text: string) {
  bubble.innerText = text;
  bubble.classList.add('visible');

  clearTimeout(speakingTimeout);
  clearTimeout(bubbleTimeout);

  // Compose the animation first to calculate tick-based duration.
  const result = compositor.composeSpeakAnimation(text);
  compositor.playSpeakSequence(result);

  // Calculate the duration from the composed hold ticks.
  // Use the mouth track (longest track) as the source of truth.
  const mouthHolds = result.holdTicks.mouth;
  const totalTicks = mouthHolds
    ? mouthHolds.reduce((sum, h) => sum + h, 0)
    : text.trim().split(/\s+/).length * 3; // Fallback: ~3 ticks per word

  // Convert ticks to milliseconds using the compositor's tick rate.
  const tickMs = (defaultAvatarConfig.cycleDurationMs ?? 1000) / defaultAvatarConfig.masterFrameCount;
  const speakingDuration = Math.max(1000, totalTicks * tickMs);

  // The bubble stays visible for an extra 1.5 seconds after speech ends.
  const bubbleDuration = speakingDuration + 1500;

  speakingTimeout = setTimeout(() => {
    stopSpeaking();
  }, speakingDuration);

  bubbleTimeout = setTimeout(() => {
    bubble.classList.remove('visible');
  }, bubbleDuration);
}

// [TO DO] TTS
// [TO DO] Activities