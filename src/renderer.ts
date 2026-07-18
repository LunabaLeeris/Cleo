
import './index.css';

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

// allow mouse to pass right through and still click behind avatar
// [TODO] Change eventually because we want avatar to be clickable
const interactiveElements = [avatar, bubble];
interactiveElements.forEach((el) => {
  el.addEventListener('mouseenter', () => {
    (window as any).electronAPI.setIgnoreMouseEvents(false);
  });
  el.addEventListener('mouseleave', () => {
    (window as any).electronAPI.setIgnoreMouseEvents(true, { forward: true });
  });
});

// Smooth window dragging using screen-relative offsets
let isDragging = false;
let startX = 0;
let startY = 0;

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
    (window as any).electronAPI.dragWindow(dx, dy);
  }
});

window.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    avatar.style.cursor = 'grab';
  }
});

// Handle data tracking. Web socket sends data when a data is received via extensions
// as browser activity.
(window as any).electronAPI.onBrowserActivity((data: { url: string; title: string }) => {
  // [TODO] Change eventually to handle complex monitoring 
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

let currentTimeout: NodeJS.Timeout;
function showSpeechBubble(text: string) {
  bubble.innerText = text;
  bubble.classList.add('visible');
  avatar.classList.add('speaking');

  clearTimeout(currentTimeout);
  // Hide speech bubble after 5 seconds
  currentTimeout = setTimeout(() => {
    bubble.classList.remove('visible');
    avatar.classList.remove('speaking');
  }, 5000);
}

// [TODO] Animations
// [TODO] TTS
// [TODO] Activities