import { inject as injectVercelAnalytics } from '@vercel/analytics';
import { AvatarCompositor, defaultAvatarConfig, ChleoExpression, WORD_FRAME_MAP } from '../src/avatar';

// Initialize Vercel Analytics to track visits & traffic on Vercel deployment
injectVercelAnalytics();

// Main initialization procedure for CHLEO Web Interactive Playground.
(async () => {
  const canvas = document.getElementById('web-avatar-canvas') as HTMLCanvasElement;
  const bubble = document.getElementById('web-speech-bubble') as HTMLDivElement;
  const wrapper = document.getElementById('web-avatar-wrapper') as HTMLDivElement;
  const stage = document.getElementById('avatar-stage') as HTMLDivElement;
  const activeLabel = document.getElementById('active-expression-label') as HTMLSpanElement;
  const tickLabel = document.getElementById('master-tick-label') as HTMLSpanElement;

  if (!canvas || !bubble || !wrapper || !stage) {
    console.error('[WebMain] DOM elements missing.');
    return;
  }

  // Create compositor instance with default configuration.
  const compositor = new AvatarCompositor(canvas, defaultAvatarConfig);
  await compositor.init();
  compositor.start();

  console.log('[WebMain] AvatarCompositor initialized on web testbed.');

  // Global state variables.
  let currentExpression: ChleoExpression = 'idle';
  let speechTimer: number | null = null;
  let bubbleTimer: number | null = null;

  // Update tick counter in UI status bar.
  setInterval(() => {
    tickLabel.innerText = `Frame ${compositor.getGlobalFrame()}`;
  }, 100);

  // Set active expression and update UI label.
  function setExpression(expr: ChleoExpression, displayTitle?: string, text?: string): void {
    currentExpression = expr;
    compositor.setExpression(currentExpression, text);
    activeLabel.innerText = displayTitle || (expr.charAt(0).toUpperCase() + expr.slice(1).replace('_', ' '));
  }

  // Helper to select a female / girl voice from browser synthesis voices.
  let cachedFemaleVoice: SpeechSynthesisVoice | null = null;

  function getFemaleVoice(): SpeechSynthesisVoice | null {
    if (cachedFemaleVoice) return cachedFemaleVoice;
    if (!('speechSynthesis' in window)) return null;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    // Common female voice identifiers across Windows, macOS, Android, iOS, Chrome, Edge
    const femaleIdentifiers = [
      'zira', 'jenny', 'samantha', 'victoria', 'karen', 'fiona', 'moira',
      'ava', 'aria', 'sara', 'michelle', 'catherine', 'hazel', 'susan',
      'google us english', 'female', 'girl'
    ];

    // 1. Try finding an English female voice
    const englishFemale = voices.find(v => {
      const nameLower = v.name.toLowerCase();
      const langLower = v.lang.toLowerCase();
      return langLower.startsWith('en') && femaleIdentifiers.some(id => nameLower.includes(id));
    });

    if (englishFemale) {
      cachedFemaleVoice = englishFemale;
      return cachedFemaleVoice;
    }

    // 2. Fallback to any voice with female keyword
    const anyFemale = voices.find(v => femaleIdentifiers.some(id => v.name.toLowerCase().includes(id)));
    if (anyFemale) {
      cachedFemaleVoice = anyFemale;
      return cachedFemaleVoice;
    }

    // 3. Fallback to any English voice
    const anyEnglish = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    if (anyEnglish) {
      cachedFemaleVoice = anyEnglish;
      return cachedFemaleVoice;
    }

    return voices[0] || null;
  }

  // Pre-warm voices cache on load
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedFemaleVoice = null;
      getFemaleVoice();
    };
  }

  // Display speech bubble text and trigger mouth speaking animation.
  function speakText(text: string, enableTTS = true): void {
    bubble.innerText = text;
    bubble.classList.add('visible');
    setExpression('speak', 'Speaking', text);

    if (speechTimer) clearTimeout(speechTimer);
    if (bubbleTimer) clearTimeout(bubbleTimer);

    // Calculate duration based on word count.
    const words = text.trim().split(/\s+/);
    const wordCount = words[0] === '' ? 0 : words.length;
    const speakDuration = Math.max(1200, wordCount * 450);
    const bubbleDuration = speakDuration + 1500;

    // Trigger browser text-to-speech audio if supported and enabled.
    if (enableTTS && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const girlVoice = getFemaleVoice();
      if (girlVoice) {
        utterance.voice = girlVoice;
      }
      
      utterance.rate = 1.0;
      utterance.pitch = 1.35; // Bright, higher pitch for cute avatar girl voice
      window.speechSynthesis.speak(utterance);
    }

    speechTimer = window.setTimeout(() => {
      setExpression('idle', 'Idle');
    }, speakDuration);

    bubbleTimer = window.setTimeout(() => {
      bubble.classList.remove('visible');
    }, bubbleDuration);
  }

  // Event Listeners: Expression Buttons
  document.getElementById('btn-blink')?.addEventListener('click', () => {
    setExpression('blink', 'Blinking');
  });

  document.getElementById('btn-sleep')?.addEventListener('click', () => {
    setExpression('sleep', 'Sleeping');
    speakText('Zzz... system in sleep mode...', false);
  });

  document.getElementById('btn-close-eyes')?.addEventListener('click', () => {
    setExpression('close_eyes', 'Eyes Closed');
  });

  document.getElementById('btn-angry')?.addEventListener('click', () => {
    setExpression('angry', 'Angry');
    speakText('Hey! Stop bothering me!', false);
  });

  document.getElementById('btn-yawn')?.addEventListener('click', () => {
    setExpression('yawn', 'Yawning');
    speakText('Yaaaaawn... so tired...', false);
  });

  document.getElementById('btn-question')?.addEventListener('click', () => {
    setExpression('question', 'Confused');
    speakText('Huh? What do you mean?', false);
  });

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    setExpression('idle', 'Idle');
    bubble.classList.remove('visible');
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  });

  // Click on avatar canvas directly triggers blink.
  canvas.addEventListener('click', () => {
    setExpression('blink', 'Blinking');
  });

  // Event Listeners: Speech & TTS Controls
  const speechInput = document.getElementById('speech-input') as HTMLInputElement;
  const ttsCheckbox = document.getElementById('toggle-tts') as HTMLInputElement;
  const speakBtn = document.getElementById('btn-speak-text');

  speakBtn?.addEventListener('click', () => {
    const text = speechInput.value.trim();
    if (text) {
      speakText(text, ttsCheckbox?.checked ?? false);
    }
  });

  speechInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const text = speechInput.value.trim();
      if (text) {
        speakText(text, ttsCheckbox?.checked ?? false);
      }
    }
  });

  // Event Listeners & Logic: Mapped Words View
  const btnMappedWords = document.getElementById('btn-mapped-words');
  const btnBackMapped = document.getElementById('btn-back-mapped');
  const sectionExpressions = document.getElementById('section-expressions');
  const sectionActivity = document.getElementById('section-activity');
  const sectionMappedWords = document.getElementById('section-mapped-words');
  const mappedSearchInput = document.getElementById('mapped-search-input') as HTMLInputElement;
  const mappedWordsGrid = document.getElementById('mapped-words-grid');
  const mappedWordsCount = document.getElementById('mapped-words-count');

  const allMappedWords = Object.keys(WORD_FRAME_MAP).sort();

  function renderMappedWords(filter = ''): void {
    if (!mappedWordsGrid || !mappedWordsCount) return;

    const query = filter.trim().toLowerCase();
    const filtered = query
      ? allMappedWords.filter(w => w.toLowerCase().includes(query))
      : allMappedWords;

    mappedWordsCount.innerText = `(${filtered.length})`;
    mappedWordsGrid.innerHTML = '';

    if (filtered.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'no-words-msg';
      noResults.innerText = `No mapped words found matching "${filter}"`;
      mappedWordsGrid.appendChild(noResults);
      return;
    }

    filtered.forEach(word => {
      const chip = document.createElement('button');
      chip.className = 'mapped-word-chip';
      chip.innerText = word;
      chip.title = `Test mouth animation for "${word}"`;
      chip.addEventListener('click', () => {
        if (speechInput) speechInput.value = word;
        speakText(word, ttsCheckbox?.checked ?? false);
      });
      mappedWordsGrid.appendChild(chip);
    });
  }

  btnMappedWords?.addEventListener('click', () => {
    if (sectionExpressions) sectionExpressions.style.display = 'none';
    if (sectionActivity) sectionActivity.style.display = 'none';
    if (sectionMappedWords) sectionMappedWords.style.display = 'flex';
    renderMappedWords(mappedSearchInput?.value ?? '');
  });

  btnBackMapped?.addEventListener('click', () => {
    if (sectionMappedWords) sectionMappedWords.style.display = 'none';
    if (sectionExpressions) sectionExpressions.style.display = 'flex';
    if (sectionActivity) sectionActivity.style.display = 'flex';
  });

  mappedSearchInput?.addEventListener('input', () => {
    renderMappedWords(mappedSearchInput.value);
  });

  // Event Listeners: Activity Reactions
  const activityButtons = document.querySelectorAll('.activity-btn');
  activityButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url') || '';
      let speech = `Visiting ${url}?`;

      if (url.includes('youtube')) {
        speech = "Watching YouTube again? Don't forget your tasks!";
      } else if (url.includes('github') || url.includes('stackoverflow')) {
        speech = "Ooh, writing code! You are locked in.";
      } else if (url.includes('facebook')) {
        speech = "I thought you wanted to reduce social media usage?";
      }

      speakText(speech, ttsCheckbox?.checked ?? false);
    });
  });

  // Event Listeners: Engine Tuning Sliders
  const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
  const speedVal = document.getElementById('speed-value') as HTMLSpanElement;

  speedSlider?.addEventListener('input', () => {
    const ms = parseInt(speedSlider.value, 10);
    speedVal.innerText = `${ms}ms`;
    compositor.setCycleDurationMs(ms);
  });

  const scaleSlider = document.getElementById('scale-slider') as HTMLInputElement;
  const scaleVal = document.getElementById('scale-value') as HTMLSpanElement;

  scaleSlider?.addEventListener('input', () => {
    const scale = parseInt(scaleSlider.value, 10);
    scaleVal.innerText = `${scale}×`;
    compositor.setScale(scale);
  });

  // Event Listeners: Theme Switchers (Cream vs Pixel Grid)
  const themeCreamBtn = document.getElementById('theme-cream-btn');
  const themeGridBtn = document.getElementById('theme-grid-btn');

  function setActiveTheme(themeClass: string, activeBtn: HTMLElement | null): void {
    document.body.className = themeClass;
    [themeCreamBtn, themeGridBtn].forEach((btn) => btn?.classList.remove('active'));
    activeBtn?.classList.add('active');
  }

  themeCreamBtn?.addEventListener('click', () => setActiveTheme('theme-light-pixel', themeCreamBtn));
  themeGridBtn?.addEventListener('click', () => setActiveTheme('theme-pixel-grid', themeGridBtn));

  // Collapsible Control Side-Drawer Controller
  const controlsPanel = document.getElementById('controls-panel');
  const toggleDrawerBtn = document.getElementById('btn-toggle-drawer');
  const closeDrawerBtn = document.getElementById('btn-close-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');

  function toggleDrawer(): void {
    const isOpen = controlsPanel?.classList.contains('open');
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  function openDrawer(): void {
    controlsPanel?.classList.add('drawer-active');
    controlsPanel?.classList.add('open');
    drawerBackdrop?.classList.add('active');
  }

  function closeDrawer(): void {
    controlsPanel?.classList.remove('open');
    drawerBackdrop?.classList.remove('active');
  }

  toggleDrawerBtn?.addEventListener('click', toggleDrawer);
  closeDrawerBtn?.addEventListener('click', closeDrawer);
  drawerBackdrop?.addEventListener('click', closeDrawer);

  // Mouse & Touch Drag Simulator (Works on desktop mouse & mobile touchscreens)
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  function startDrag(clientX: number, clientY: number): void {
    isDragging = true;
    wrapper.classList.remove('grab-cursor');
    wrapper.classList.add('grabbing-cursor');

    const rect = wrapper.getBoundingClientRect();
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;

    setExpression('question', 'Dragging');
  }

  function moveDrag(clientX: number, clientY: number): void {
    if (!isDragging) return;

    const stageRect = stage.getBoundingClientRect();
    let newX = clientX - stageRect.left - offsetX;
    let newY = clientY - stageRect.top - offsetY;

    // Constrain inside stage bounds.
    newX = Math.max(10, Math.min(stageRect.width - wrapper.offsetWidth - 10, newX));
    newY = Math.max(10, Math.min(stageRect.height - wrapper.offsetHeight - 10, newY));

    wrapper.style.position = 'absolute';
    wrapper.style.left = `${newX}px`;
    wrapper.style.top = `${newY}px`;
  }

  function endDrag(): void {
    if (isDragging) {
      isDragging = false;
      wrapper.classList.remove('grabbing-cursor');
      wrapper.classList.add('grab-cursor');
      setExpression('idle', 'Idle');
    }
  }

  // Mouse Drag Events
  wrapper.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    startDrag(e.clientX, e.clientY);
  });

  window.addEventListener('mousemove', (e) => {
    moveDrag(e.clientX, e.clientY);
  });

  window.addEventListener('mouseup', endDrag);

  // Mobile Touch Drag Events
  wrapper.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    startDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault(); // Prevents page scrolling during avatar touch drag
    moveDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  window.addEventListener('touchend', endDrag);
  window.addEventListener('touchcancel', endDrag);
})();
