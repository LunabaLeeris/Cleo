import type { PrimaryEmotion } from '../avatar/emotions/emotion-types';

export type SiteType = 'blocked' | 'avoid' | 'productive' | 'neutral';

export interface SiteRule {
  domain: string;
  type: SiteType;
  dailyLimitSeconds: number;
  spentTodaySeconds: number;
  warningThresholdPercent: number; // e.g. 80 for 80% limit warning
  requiresPuzzleToUnblock?: boolean;
}

export interface BehavioralRule {
  id: string;
  name: string;
  conditions: {
    event: string;
    [key: string]: any;
  };
  emotionDeltas: Partial<Record<PrimaryEmotion, number>>;
  rewards?: {
    coins?: number;
    itemDrop?: string;
  };
  heuristicTemplates: string[];
  llmDirective: string;
}

export interface MonitoringConfig {
  rules: SiteRule[];
  productiveRewardIntervalSeconds: number;
  unblockPuzzlePenalty: Partial<Record<PrimaryEmotion, number>>;
}

export interface BehavioralConfig {
  rules: BehavioralRule[];
}

export interface MonitoringEventPayload {
  eventId: string;
  domain: string;
  timeSpentSeconds: number;
  limitSeconds: number;
  percentSpent: number;
  remainingSeconds: number;
  siteType: SiteType;
  message?: string;
}
