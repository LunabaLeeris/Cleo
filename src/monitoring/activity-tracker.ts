import { RuleStore } from './rule-store';
import { BehavioralEngine } from './behavioral-engine';
import { ShortTermMemory } from '../memory/short-term-memory';
import { LongTermMemory } from '../memory/long-term-memory';
import { EmotionsOrchestrator } from '../avatar/emotions/emotions-orchestrator';
import { parseMonitoringCommand, ParsedCommand } from './command-parser';
import type { MonitoringEventPayload, SiteRule } from './monitoring-types';

export interface ActivityTrackerListeners {
  onEventTriggered?: (payload: MonitoringEventPayload, speechText: string) => void;
  onRuleChanged?: () => void;
  onTick?: (activeDomain: string, spentTodaySeconds: number) => void;
}

/**
 * ActivityTracker manages real-time site visitation, 1-second timer ticker,
 * rule enforcement, warning threshold checks, productive milestones, and puzzle unblocking.
 */
export class ActivityTracker {
  private ruleStore: RuleStore;
  private behavioralEngine: BehavioralEngine;
  private shortTermMemory: ShortTermMemory;
  private longTermMemory: LongTermMemory;
  private emotionOrchestrator: EmotionsOrchestrator;
  private listeners: ActivityTrackerListeners;

  private tickerInterval: number | null = null;
  private activeDomain: string = 'localhost';
  private cumulativeProductiveSeconds: number = 0;

  constructor(
    ruleStore: RuleStore,
    shortTermMemory: ShortTermMemory,
    longTermMemory: LongTermMemory,
    emotionOrchestrator: EmotionsOrchestrator,
    listeners: ActivityTrackerListeners = {}
  ) {
    this.ruleStore = ruleStore;
    this.shortTermMemory = shortTermMemory;
    this.longTermMemory = longTermMemory;
    this.emotionOrchestrator = emotionOrchestrator;
    this.listeners = listeners;
    this.behavioralEngine = new BehavioralEngine(ruleStore, shortTermMemory, longTermMemory);

    this.startTicker();
  }

  /**
   * Start 1-second monitoring tick loop.
   */
  startTicker(): void {
    if (this.tickerInterval !== null) return;

    this.tickerInterval = window.setInterval(() => {
      this.onTick();
    }, 1000);
  }

  stopTicker(): void {
    if (this.tickerInterval !== null) {
      clearInterval(this.tickerInterval);
      this.tickerInterval = null;
    }
  }

  /**
   * Main 1-second tick loop evaluation.
   */
  private onTick(): void {
    if (!this.activeDomain) return;

    let rule = this.ruleStore.findRuleForDomain(this.activeDomain);
    const domain = this.activeDomain;

    // If website is BLOCKED, do not increment time spent
    if (rule && rule.type === 'blocked') {
      if (this.listeners.onTick) {
        this.listeners.onTick(domain, rule.spentTodaySeconds);
      }
      return;
    }

    // Increment spent time for active non-blocked domain
    this.ruleStore.updateSpentTime(domain, 1);
    rule = this.ruleStore.findRuleForDomain(domain);

    if (this.listeners.onTick) {
      this.listeners.onTick(domain, rule ? rule.spentTodaySeconds : 0);
    }

    if (!rule) return;

    // If website is AVOID
    if (rule.type === 'avoid' && rule.dailyLimitSeconds > 0) {
      const spent = rule.spentTodaySeconds;
      const limit = rule.dailyLimitSeconds;
      const percent = (spent / limit) * 100;
      const remaining = Math.max(0, limit - spent);

      // Check Exceeded
      if (spent >= limit) {
        // Automatically convert to blocked state!
        rule.type = 'blocked';
        rule.requiresPuzzleToUnblock = true;
        this.ruleStore.saveActivityConfig();

        const payload: MonitoringEventPayload = {
          eventId: 'LIMIT_EXCEEDED',
          domain,
          timeSpentSeconds: spent,
          limitSeconds: limit,
          percentSpent: 100,
          remainingSeconds: 0,
          siteType: 'blocked',
        };

        const result = this.behavioralEngine.processEvent(payload, this.emotionOrchestrator);
        if (result && this.listeners.onEventTriggered) {
          this.listeners.onEventTriggered(payload, result.speechText);
        }
        if (this.listeners.onRuleChanged) this.listeners.onRuleChanged();
        return;
      }

      // Check Warning Threshold
      if (percent >= rule.warningThresholdPercent && !this.shortTermMemory.isWarningActive(domain)) {
        this.shortTermMemory.setWarning(domain, percent);

        const payload: MonitoringEventPayload = {
          eventId: 'LIMIT_WARNING',
          domain,
          timeSpentSeconds: spent,
          limitSeconds: limit,
          percentSpent: remaining,
          remainingSeconds: remaining,
          siteType: 'avoid',
        };

        const result = this.behavioralEngine.processEvent(payload, this.emotionOrchestrator);
        if (result && this.listeners.onEventTriggered) {
          this.listeners.onEventTriggered(payload, result.speechText);
        }
      }
    }

    // If website is PRODUCTIVE
    if (rule.type === 'productive') {
      this.cumulativeProductiveSeconds += 1;

      const rewardInterval = this.ruleStore.getProductiveRewardIntervalSeconds();
      if (this.cumulativeProductiveSeconds > 0 && this.cumulativeProductiveSeconds % rewardInterval === 0) {
        const payload: MonitoringEventPayload = {
          eventId: 'PRODUCTIVE_MILESTONE',
          domain,
          timeSpentSeconds: this.cumulativeProductiveSeconds,
          limitSeconds: rewardInterval,
          percentSpent: 100,
          remainingSeconds: 0,
          siteType: 'productive',
        };

        const result = this.behavioralEngine.processEvent(payload, this.emotionOrchestrator);
        if (result && this.listeners.onEventTriggered) {
          this.listeners.onEventTriggered(payload, result.speechText);
        }
      }
    }
  }

  /**
   * Handle website visitation event from Chrome Extension or Simulator.
   */
  handleSiteVisit(url: string, title?: string): { isBlocked: boolean; speechText?: string } {
    let domain = url;
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        domain = new URL(url).hostname;
      }
    } catch (_) { }

    this.activeDomain = domain;
    this.shortTermMemory.setActiveDomain(domain);

    const rule = this.ruleStore.findRuleForDomain(domain);

    if (rule && rule.type === 'blocked') {
      const payload: MonitoringEventPayload = {
        eventId: 'SITE_BLOCKED_VISIT',
        domain,
        timeSpentSeconds: rule.spentTodaySeconds,
        limitSeconds: rule.dailyLimitSeconds,
        percentSpent: 100,
        remainingSeconds: 0,
        siteType: 'blocked',
      };

      const result = this.behavioralEngine.processEvent(payload, this.emotionOrchestrator);
      if (result && this.listeners.onEventTriggered) {
        this.listeners.onEventTriggered(payload, result.speechText);
      }

      return { isBlocked: true, speechText: result?.speechText };
    }

    return { isBlocked: false };
  }

  /**
   * Execute unblock puzzle finish action (Goal 2 & Goal 6).
   * Unblocks website but applies anger and sadness penalty to Chleo!
   */
  completePuzzleAndUnblock(domain: string): { rule: SiteRule; speechText: string } {
    const rule = this.ruleStore.setUnblockSite(domain);

    const payload: MonitoringEventPayload = {
      eventId: 'PUZZLE_UNBLOCK_PENALTY',
      domain,
      timeSpentSeconds: rule.spentTodaySeconds,
      limitSeconds: rule.dailyLimitSeconds,
      percentSpent: 0,
      remainingSeconds: 0,
      siteType: 'neutral',
    };

    const result = this.behavioralEngine.processEvent(payload, this.emotionOrchestrator);

    if (result && this.listeners.onEventTriggered) {
      this.listeners.onEventTriggered(payload, result.speechText);
    }
    if (this.listeners.onRuleChanged) this.listeners.onRuleChanged();

    return { rule, speechText: result?.speechText || `Unblocked ${domain}` };
  }

  /**
   * Process natural language text commands (e.g. "block facebook.com", "limit youtube.com to 1 min").
   */
  processCommand(textCommand: string): { parsed: ParsedCommand; responseText: string } {
    const parsed = parseMonitoringCommand(textCommand);
    let responseText = '';

    switch (parsed.action) {
      case 'BLOCK': {
        if (parsed.domain) {
          this.ruleStore.setBlockSite(parsed.domain);
          responseText = `Okay, I have completely blocked ${parsed.domain}!`;
        }
        break;
      }

      case 'UNBLOCK': {
        if (parsed.domain) {
          // Unblocking triggers puzzle requirement notice
          responseText = `To unblock ${parsed.domain}, you must finish my puzzle challenge! Click the puzzle unblock button below.`;
        }
        break;
      }

      case 'LIMIT': {
        if (parsed.domain && parsed.seconds) {
          this.ruleStore.setSiteLimit(parsed.domain, parsed.seconds);
          const formatted = parsed.seconds >= 60 ? `${Math.round(parsed.seconds / 60)} minutes` : `${parsed.seconds} seconds`;
          responseText = `Got it! Set a daily limit of ${formatted} for ${parsed.domain}.`;
        }
        break;
      }

      case 'MARK_PRODUCTIVE': {
        if (parsed.domain) {
          this.ruleStore.setSiteProductive(parsed.domain, true);
          responseText = `Marked ${parsed.domain} as productive! You will earn rewards for staying focused there.`;
        }
        break;
      }

      case 'UNMARK_PRODUCTIVE': {
        if (parsed.domain) {
          this.ruleStore.setSiteProductive(parsed.domain, false);
          responseText = `Removed ${parsed.domain} from productive sites.`;
        }
        break;
      }

      default: {
        responseText = `I didn't understand that monitoring command. Try: 'block twitter.com', 'limit youtube.com to 1 minute', or 'mark github.com productive'.`;
      }
    }

    if (this.listeners.onRuleChanged) this.listeners.onRuleChanged();

    return { parsed, responseText };
  }

  getEmotionState() {
    return this.emotionOrchestrator.getState();
  }

  getOverallEmotion() {
    return this.emotionOrchestrator.getOverallEmotion();
  }
}
