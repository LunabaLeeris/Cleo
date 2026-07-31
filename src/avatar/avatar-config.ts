import type { AvatarConfig } from './sprite-types';

import SPRITE_BODY_IDLE from '../assets/sprites/body/body_idle.png';
import SPRITE_EYES_IDLE from '../assets/sprites/eyes/eyes_idle.png';
import SPRITE_EYES_BLINK from '../assets/sprites/eyes/eyes_blink.png';
import SPRITE_MOUTH_IDLE from '../assets/sprites/mouth/mouth_idle.png';
import SPRITE_MOUTH_SPEAK from '../assets/sprites/mouth/mouth_speak.png';
import SPRITE_BROWS_IDLE from '../assets/sprites/brows/brows_idle.png';

// [TO DO] 
const SPRITE_BROWS_QUESTION = '';

export const defaultAvatarConfig: AvatarConfig = {
  canvasWidth: 64,
  canvasHeight: 64,
  masterFrameCount: 6,
  cycleDurationMs: 1000,
  scale: 2,

  parts: {
    body: {
      basePosition: { x: 0, y: 0 },
      animations: {
        idle: {
          src: SPRITE_BODY_IDLE,
          frameCount: 6,
          frameWidth: 64,
          frameHeight: 64,
          loop: 'infinite',
        },
        sleep: {
          src: SPRITE_BODY_IDLE,
          frameCount: 6,
          frameWidth: 64,
          frameHeight: 64,
          loop: 'infinite',
        },
      },
      defaultAnimation: 'idle',
    },

    eyes: {
      basePosition: { x: 0, y: 0 },
      animations: {
        idle: {
          src: SPRITE_EYES_IDLE,
          frameCount: 1,
          frameWidth: 64,
          frameHeight: 64,
          loop: 'infinite',
        },
        blink: {
          src: SPRITE_EYES_BLINK,
          frameCount: 3,
          frameWidth: 64,
          frameHeight: 64,
          loop: 'once',
        },
        close_eyes: {
          src: SPRITE_EYES_BLINK,
          frameCount: 3,
          frameWidth: 64,
          frameHeight: 64,
          loop: 'infinite',
        },
        sleep: {
          src: SPRITE_EYES_BLINK,
          frameCount: 3,
          frameWidth: 64,
          frameHeight: 64,
          loop: 'infinite',
        },
      },
      defaultAnimation: 'idle',
    },

    mouth: {
      basePosition: { x: 0, y: 0 },
      animations: {
        idle: {
          src: SPRITE_MOUTH_IDLE,
          frameCount: 1,
          frameWidth: 64,
          frameHeight: 64,
          loop: 'infinite',
        },
        speak: {
          src: SPRITE_MOUTH_SPEAK,
          frameCount: 6,
          frameWidth: 64,
          frameHeight: 64,
          loop: 'infinite',
        },
        yawn: {
          src: SPRITE_MOUTH_SPEAK,
          frameCount: 6,
          frameWidth: 64,
          frameHeight: 64,
          loop: 'once',
        },
      },
      defaultAnimation: 'idle',
    },

    eyebrows: {
      basePosition: { x: 0, y: 0 },
      animations: {
        idle: {
          src: SPRITE_BROWS_IDLE,
          frameCount: 1,
          frameWidth: 64,
          frameHeight: 64,
          loop: 'infinite',
        },
        angry: {
          src: SPRITE_BROWS_IDLE,
          frameCount: 1,
          frameWidth: 64,
          frameHeight: 64,
          frameOffsets: [
            { x: 0, y: 1 },
          ],
          loop: 'infinite',
        },
        question: {
          src: SPRITE_BROWS_IDLE,
          frameCount: 1,
          frameWidth: 64,
          frameHeight: 64,
          frameOffsets: [
            { x: 0, y: -1 },
          ],
          loop: 'once',
        },
      },
      defaultAnimation: 'idle',
    },
  },

  // Keyframe offsets shift non-body parts to sync breathing motion.
  globalKeyframeOffsets: {
    3: {
      eyes: { x: 0, y: 1 },
      mouth: { x: 0, y: 1 },
      eyebrows: { x: 0, y: 1 },
    },
    4: {
      eyes: { x: 0, y: 1 },
      mouth: { x: 0, y: 1 },
      eyebrows: { x: 0, y: 1 },
    },
    5: {
      eyes: { x: 0, y: 1 },
      mouth: { x: 0, y: 1 },
      eyebrows: { x: 0, y: 1 },
    },
  },
};
