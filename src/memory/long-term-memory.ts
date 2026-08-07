import type { LongTermMemoryData } from './memory-types';
import type { EmotionalState } from '../avatar/emotions/emotion-types';

/**
 * LongTermMemory manages persistence across app restarts, storing companion statistics,
 * past rule violations, rewards earned, and user relationship history.
 */
export class LongTermMemory {
  private data: LongTermMemoryData;
  private storageKey: string = 'chleo_long_term_memory';

  constructor() {
    this.data = this.loadInitialData();
    this.updateDaysKnown();
  }

  private loadInitialData(): LongTermMemoryData {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.storageKey);
        if (raw) {
          return JSON.parse(raw);
        }
      }
    } catch (e) {
      console.warn('[LongTermMemory] Failed to read from localStorage:', e);
    }

    const now = Date.now();
    return {
      daysKnown: 1,
      firstSeenTimestamp: now,
      lastSeenTimestamp: now,
      totalViolationsCount: 0,
      totalRewardsEarned: 0,
      totalPuzzlesCompleted: 0,
      lastEmotionState: {
        joy: 0.2,
        trust: 0.2,
        fear: 0,
        surprise: 0,
        sadness: 0,
        disgust: 0,
        anger: 0,
        anticipation: 0.1,
      },
      pastMistakes: [],
      pastAchievements: [],
      userPreferences: {},
    };
  }

  save(): void {
    try {
      this.data.lastSeenTimestamp = Date.now();
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      }
    } catch (e) {
      console.warn('[LongTermMemory] Failed to save to localStorage:', e);
    }
  }

  private updateDaysKnown(): void {
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffMs = Date.now() - this.data.firstSeenTimestamp;
    this.data.daysKnown = Math.max(1, Math.floor(diffMs / msPerDay) + 1);
    this.save();
  }

  getData(): LongTermMemoryData {
    return { ...this.data };
  }

  recordViolation(description: string): void {
    this.data.totalViolationsCount += 1;
    this.data.pastMistakes.unshift(`[${new Date().toLocaleDateString()}] ${description}`);
    if (this.data.pastMistakes.length > 20) {
      this.data.pastMistakes.pop();
    }
    this.save();
  }

  recordReward(description: string): void {
    this.data.totalRewardsEarned += 1;
    this.data.pastAchievements.unshift(`[${new Date().toLocaleDateString()}] ${description}`);
    if (this.data.pastAchievements.length > 20) {
      this.data.pastAchievements.pop();
    }
    this.save();
  }

  recordPuzzleCompleted(domain: string): void {
    this.data.totalPuzzlesCompleted += 1;
    this.save();
  }

  updateLastEmotion(state: EmotionalState): void {
    this.data.lastEmotionState = { ...state };
    this.save();
  }
}

export const defaultLongTermMemory = new LongTermMemory();
