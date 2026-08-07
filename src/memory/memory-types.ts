import type { PrimaryEmotion, EmotionalState, PlutchikEmotion } from '../avatar/emotions/emotion-types';

export interface ShortTermMemoryEvent {
  id: string;
  timestamp: number;
  type: 'visit' | 'blocked_attempt' | 'warning' | 'limit_exceeded' | 'productive_milestone' | 'puzzle_unblock' | 'command';
  domain?: string;
  details: string;
  emotionDelta?: Partial<Record<PrimaryEmotion, number>>;
}

export interface ActiveWarningState {
  domain: string;
  warnedAt: number;
  percentSpent: number;
}

export interface LongTermMemoryData {
  daysKnown: number;
  firstSeenTimestamp: number;
  lastSeenTimestamp: number;
  totalViolationsCount: number;
  totalRewardsEarned: number;
  totalPuzzlesCompleted: number;
  lastEmotionState: EmotionalState;
  pastMistakes: string[];
  pastAchievements: string[];
  userPreferences: {
    userName?: string;
    bedtime?: string;
    waketime?: string;
  };
}
