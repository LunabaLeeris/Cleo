import { RuleStore } from './rule-store';
import { ShortTermMemory } from '../memory/short-term-memory';
import { LongTermMemory } from '../memory/long-term-memory';
import { EmotionsOrchestrator } from '../avatar/emotions/emotions-orchestrator';
import type { MonitoringEventPayload, BehavioralRule } from './monitoring-types';

export interface BehavioralReactionResult {
  rule: BehavioralRule;
  speechText: string;
  emotionDeltas: BehavioralRule['emotionDeltas'];
  rewards?: BehavioralRule['rewards'];
}

/**
 * BehavioralEngine processes monitoring events, calculates emotion deltas,
 * generates speech responses from templates, and records memory entries.
 */
export class BehavioralEngine {
  private ruleStore: RuleStore;
  private shortTermMemory: ShortTermMemory;
  private longTermMemory: LongTermMemory;

  constructor(
    ruleStore: RuleStore,
    shortTermMemory: ShortTermMemory,
    longTermMemory: LongTermMemory
  ) {
    this.ruleStore = ruleStore;
    this.shortTermMemory = shortTermMemory;
    this.longTermMemory = longTermMemory;
  }

  processEvent(
    event: MonitoringEventPayload,
    emotionOrchestrator: EmotionsOrchestrator
  ): BehavioralReactionResult | null {
    const rules = this.ruleStore.getBehavioralRules();
    const matchingRule = rules.find(
      (r) =>
        r.conditions.event === event.eventId ||
        r.id === event.eventId ||
        (event.eventId === 'SITE_BLOCKED_VISIT' && r.conditions.event === 'BLOCKED_SITE_ATTEMPT')
    );

    if (!matchingRule) {
      console.warn(`[BehavioralEngine] No behavioral rule defined for event: ${event.eventId}`);
      return null;
    }

    // Apply emotion deltas to EmotionsOrchestrator
    emotionOrchestrator.applyBehavioralData(matchingRule.emotionDeltas);

    // Format template parameters
    const speechText = this.interpolateTemplate(matchingRule.heuristicTemplates, event);

    // Record in Short-Term and Long-Term Memory
    this.shortTermMemory.recordEvent({
      type: event.eventId.toLowerCase() as any,
      domain: event.domain,
      details: speechText,
      emotionDelta: matchingRule.emotionDeltas,
    });
    this.shortTermMemory.recordSpeech(speechText);

    if (event.eventId === 'LIMIT_EXCEEDED' || event.eventId === 'BLOCKED_SITE_ATTEMPT') {
      this.longTermMemory.recordViolation(`Exceeded or visited restricted site: ${event.domain}`);
    } else if (event.eventId === 'PRODUCTIVE_MILESTONE') {
      this.longTermMemory.recordReward(`Productive focus session on ${event.domain}`);
    } else if (event.eventId === 'PUZZLE_UNBLOCK_PENALTY') {
      this.longTermMemory.recordPuzzleCompleted(event.domain);
    }

    // Update long term memory emotion snapshot
    this.longTermMemory.updateLastEmotion(emotionOrchestrator.getState());

    return {
      rule: matchingRule,
      speechText,
      emotionDeltas: matchingRule.emotionDeltas,
      rewards: matchingRule.rewards,
    };
  }

  private interpolateTemplate(templates: string[], event: MonitoringEventPayload): string {
    if (!templates || templates.length === 0) {
      return event.message || `Activity event on ${event.domain}`;
    }

    // Pick template randomly to prevent repetitive phrasing
    const idx = Math.floor(Math.random() * templates.length);
    let template = templates[idx];

    const timeSpentFormatted =
      event.timeSpentSeconds >= 60
        ? `${Math.floor(event.timeSpentSeconds / 60)}m`
        : `${event.timeSpentSeconds}s`;

    return template
      .replace(/\{domain\}/g, event.domain || 'this site')
      .replace(/\{percent\}/g, Math.round(event.percentSpent).toString())
      .replace(/\{remainingSeconds\}/g, Math.round(event.remainingSeconds).toString())
      .replace(/\{limit\}/g, Math.round(event.limitSeconds / 60).toString())
      .replace(/\{timeSpent\}/g, timeSpentFormatted)
      .replace(/\{coins\}/g, '50');
  }
}
