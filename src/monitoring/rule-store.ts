import type { SiteRule, SiteType, BehavioralRule, MonitoringConfig, BehavioralConfig } from './monitoring-types';
import defaultActivityRules from './config/activity-rules.json';
import defaultBehavioralRules from './config/behavioral-rules.json';

/**
 * RuleStore manages reading, writing, and updating site rules and behavioral rules
 * at runtime, persisting changes to localStorage or local state.
 */
//[ADD] rules should be saved and loaded for persistence
export class RuleStore {
  private activityConfig: MonitoringConfig;
  private behavioralConfig: BehavioralConfig;
  private storageKeyActivity = 'chleo_activity_rules_v1';
  private storageKeyBehavioral = 'chleo_behavioral_rules_v1';

  constructor() {
    this.activityConfig = this.loadActivityConfig();
    this.behavioralConfig = this.loadBehavioralConfig();
  }

  private loadActivityConfig(): MonitoringConfig {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.storageKeyActivity);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[RuleStore] Failed to load activity rules from storage:', e);
    }
    return JSON.parse(JSON.stringify(defaultActivityRules)) as MonitoringConfig;
  }

  private loadBehavioralConfig(): BehavioralConfig {
    const defaults = JSON.parse(JSON.stringify(defaultBehavioralRules)) as BehavioralConfig;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.storageKeyBehavioral);
        if (raw) {
          const parsed = JSON.parse(raw) as BehavioralConfig;
          defaults.rules.forEach((defRule) => {
            const storedRule = parsed.rules.find((r) => r.id === defRule.id);
            if (storedRule) {
              storedRule.emotionDeltas = defRule.emotionDeltas;
              storedRule.conditions = defRule.conditions;
            } else {
              parsed.rules.push(defRule);
            }
          });
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[RuleStore] Failed to load behavioral rules from storage:', e);
    }
    return defaults;
  }

  saveActivityConfig(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.storageKeyActivity, JSON.stringify(this.activityConfig));
      }
    } catch (e) {
      console.warn('[RuleStore] Failed to save activity rules:', e);
    }
  }

  saveBehavioralConfig(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.storageKeyBehavioral, JSON.stringify(this.behavioralConfig));
      }
    } catch (e) {
      console.warn('[RuleStore] Failed to save behavioral rules:', e);
    }
  }

  // --- Site Rules Methods ---
  getSiteRules(): SiteRule[] {
    return this.activityConfig.rules;
  }

  findRuleForDomain(domain: string): SiteRule | undefined {
    const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    return this.activityConfig.rules.find((r) => {
      const cleanRuleDomain = r.domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      return cleanDomain === cleanRuleDomain || cleanDomain.endsWith('.' + cleanRuleDomain);
    });
  }

  setBlockSite(domain: string): SiteRule {
    let rule = this.findRuleForDomain(domain);
    if (!rule) {
      rule = {
        domain,
        type: 'blocked',
        dailyLimitSeconds: 0,
        spentTodaySeconds: 0,
        warningThresholdPercent: 80,
        requiresPuzzleToUnblock: true,
      };
      this.activityConfig.rules.push(rule);
    } else {
      rule.type = 'blocked';
      rule.requiresPuzzleToUnblock = true;
    }
    this.saveActivityConfig();
    return rule;
  }

  setUnblockSite(domain: string): SiteRule {
    let rule = this.findRuleForDomain(domain);
    if (!rule) {
      rule = {
        domain,
        type: 'neutral',
        dailyLimitSeconds: 0,
        spentTodaySeconds: 0,
        warningThresholdPercent: 80,
        requiresPuzzleToUnblock: false,
      };
      this.activityConfig.rules.push(rule);
    } else {
      rule.type = 'neutral';
      rule.requiresPuzzleToUnblock = false;
    }
    this.saveActivityConfig();
    return rule;
  }

  setSiteLimit(domain: string, dailyLimitSeconds: number): SiteRule {
    let rule = this.findRuleForDomain(domain);
    if (!rule) {
      rule = {
        domain,
        type: 'avoid',
        dailyLimitSeconds,
        spentTodaySeconds: 0,
        warningThresholdPercent: 75,
        requiresPuzzleToUnblock: false,
      };
      this.activityConfig.rules.push(rule);
    } else {
      rule.type = 'avoid';
      rule.dailyLimitSeconds = dailyLimitSeconds;
      rule.spentTodaySeconds = 0; // reset for new limit testing
    }
    this.saveActivityConfig();
    return rule;
  }

  setSiteProductive(domain: string, isProductive: boolean): SiteRule {
    let rule = this.findRuleForDomain(domain);
    if (!rule) {
      rule = {
        domain,
        type: isProductive ? 'productive' : 'neutral',
        dailyLimitSeconds: 0,
        spentTodaySeconds: 0,
        warningThresholdPercent: 80,
        requiresPuzzleToUnblock: false,
      };
      this.activityConfig.rules.push(rule);
    } else {
      rule.type = isProductive ? 'productive' : 'neutral';
    }
    this.saveActivityConfig();
    return rule;
  }

  updateSpentTime(domain: string, deltaSeconds: number): void {
    let rule = this.findRuleForDomain(domain);
    if (!rule) {
      rule = {
        domain,
        type: 'neutral',
        dailyLimitSeconds: 0,
        spentTodaySeconds: deltaSeconds,
        warningThresholdPercent: 80,
        requiresPuzzleToUnblock: false,
      };
      this.activityConfig.rules.push(rule);
    } else {
      rule.spentTodaySeconds += deltaSeconds;
    }
    this.saveActivityConfig();
  }

  // --- Behavioral Rules & Penalty/Reward Methods ---
  getBehavioralRules(): BehavioralRule[] {
    return this.behavioralConfig.rules;
  }

  getBehavioralRule(id: string): BehavioralRule | undefined {
    return this.behavioralConfig.rules.find((r) => r.id === id);
  }

  updateBehavioralRule(id: string, updates: Partial<BehavioralRule>): BehavioralRule | undefined {
    const rule = this.getBehavioralRule(id);
    if (rule) {
      if (updates.emotionDeltas) rule.emotionDeltas = { ...rule.emotionDeltas, ...updates.emotionDeltas };
      if (updates.rewards) rule.rewards = { ...rule.rewards, ...updates.rewards };
      if (updates.heuristicTemplates) rule.heuristicTemplates = [...updates.heuristicTemplates];
      if (updates.llmDirective) rule.llmDirective = updates.llmDirective;
      this.saveBehavioralConfig();
    }
    return rule;
  }

  getProductiveRewardIntervalSeconds(): number {
    return this.activityConfig.productiveRewardIntervalSeconds;
  }

  setProductiveRewardIntervalSeconds(seconds: number): void {
    this.activityConfig.productiveRewardIntervalSeconds = seconds;
    this.saveActivityConfig();
  }

  resetAllRules(): void {
    this.activityConfig = JSON.parse(JSON.stringify(defaultActivityRules));
    this.behavioralConfig = JSON.parse(JSON.stringify(defaultBehavioralRules));
    this.saveActivityConfig();
    this.saveBehavioralConfig();
  }
}

export const defaultRuleStore = new RuleStore();
