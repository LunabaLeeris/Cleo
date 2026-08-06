import './index.css';
import { AvatarCompositor, defaultAvatarConfig, defaultSpeechOrchestrator } from './avatar';

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

// State to track window dragging
let isDragging = false;
let startX = 0; 
let startY = 0;

// Helper to set interactive mode
function setInteractive(interactive: boolean) {
  (window as any).electronAPI?.setIgnoreMouseEvents(!interactive, { forward: true });
}

// Mouse enter/leave handlers on interactive elements (avatar & speech bubble)
avatar.addEventListener('mouseenter', () => {
  setInteractive(true);
});

avatar.addEventListener('mouseleave', () => {
  if (!isDragging && !bubble.matches(':hover')) {
    setInteractive(false);
  }
});

bubble.addEventListener('mouseenter', () => {
  setInteractive(true);
});

bubble.addEventListener('mouseleave', () => {
  if (!isDragging && !avatar.matches(':hover')) {
    setInteractive(false);
  }
});

avatar.addEventListener('pointerdown', (e: PointerEvent) => {
  if (e.button === 0) { // Left click only
    isDragging = true;
    startX = e.screenX;
    startY = e.screenY;
    try {
      avatar.setPointerCapture(e.pointerId);
    } catch (_) {}
    avatar.style.cursor = 'grabbing';
    (window as any).electronAPI?.setDragging(true);
  }
});

window.addEventListener('pointermove', (e: PointerEvent) => {
  if (isDragging) {
    const dx = e.screenX - startX;
    const dy = e.screenY - startY;
    startX = e.screenX;
    startY = e.screenY;
    (window as any).electronAPI?.dragWindow(dx, dy);
  }
});

const stopDragging = (e?: PointerEvent) => {
  if (isDragging) {
    isDragging = false;
    avatar.style.cursor = 'grab';
    if (e) {
      try {
        if (avatar.hasPointerCapture(e.pointerId)) {
          avatar.releasePointerCapture(e.pointerId);
        }
      } catch (_) {}
    }
    (window as any).electronAPI?.setDragging(false);
    
    // Check if mouse is hovering over avatar or speech bubble
    const isHovered = avatar.matches(':hover') || (bubble.classList.contains('visible') && bubble.matches(':hover'));
    setInteractive(isHovered);
  }
};

window.addEventListener('pointerup', stopDragging);
window.addEventListener('pointercancel', stopDragging);
window.addEventListener('blur', () => stopDragging());

// State helpers
/**
 * Start speaking animation with text-aware composition.
 * Uses the speech animation pipeline.
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

/**
 * Displays speech bubble and plays synchronized avatar speech.
 * Pre-renders audio, calculates TTS hold ticks, then triggers playback.
 */
async function showSpeechBubble(text: string): Promise<void> {
  clearTimeout(speakingTimeout);
  clearTimeout(bubbleTimeout);

  // 1. Async Pre-render Phase (bubble remains hidden during computation)
  const tickMs = (defaultAvatarConfig.cycleDurationMs ?? 1000) / defaultAvatarConfig.masterFrameCount;
  const packet = await defaultSpeechOrchestrator.preRenderSpeech(text, tickMs);

  // 2. Display speech bubble when pre-render phase completes
  bubble.innerText = text;
  bubble.classList.add('visible');

  // 3. Play mouth animation and modulated robotic female voice in sync
  defaultSpeechOrchestrator.playPreRenderedSpeech(packet, compositor);

  // 4. Set duration timeouts based on exact pre-rendered packet timing
  const speakingDuration = Math.max(1000, packet.totalDurationMs);
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
