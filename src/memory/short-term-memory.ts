import type { ShortTermMemoryEvent, ActiveWarningState } from './memory-types';

/**
 * ShortTermMemory keeps an in-memory rolling history of recent activities,
 * tab visits, warning states, and speech responses to prevent repetitive behavior.
 */
//[ADD] add a save short term memory to file and load short term memory to file
export class ShortTermMemory {
  private events: ShortTermMemoryEvent[] = [];
  private activeWarnings: Map<string, ActiveWarningState> = new Map();
  private recentSpeechPhrases: string[] = [];
  private currentActiveDomain: string | null = null;
  private currentDomainStartTime: number = Date.now();
  private maxEventHistory: number = 50;
  private storageKey: string = 'chleo_short_term_memory_v1';

  constructor() {
    this.load();
  }

  /**
   * Save short-term memory state to storage for restart persistence.
   */
  save(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const payload = {
          events: this.events,
          recentSpeechPhrases: this.recentSpeechPhrases,
          activeWarnings: Array.from(this.activeWarnings.entries()),
          currentActiveDomain: this.currentActiveDomain,
        };
        window.localStorage.setItem(this.storageKey, JSON.stringify(payload));
      }
    } catch (e) {
      console.warn('[ShortTermMemory] Failed to save to localStorage:', e);
    }
  }

  /**
   * Load short-term memory state from storage.
   */
  load(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.events)) this.events = parsed.events;
          if (Array.isArray(parsed.recentSpeechPhrases)) this.recentSpeechPhrases = parsed.recentSpeechPhrases;
          if (Array.isArray(parsed.activeWarnings)) {
            this.activeWarnings = new Map(parsed.activeWarnings);
          }
          if (parsed.currentActiveDomain) this.currentActiveDomain = parsed.currentActiveDomain;
        }
      }
    } catch (e) {
      console.warn('[ShortTermMemory] Failed to load from localStorage:', e);
    }
  }

  /**
   * Record a short-term activity event.
   */
  recordEvent(event: Omit<ShortTermMemoryEvent, 'id' | 'timestamp'>): ShortTermMemoryEvent {
    const fullEvent: ShortTermMemoryEvent = {
      ...event,
      id: `stm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
    };

    this.events.unshift(fullEvent);
    if (this.events.length > this.maxEventHistory) {
      this.events.pop();
    }
    this.save();
    return fullEvent;
  }

  /**
   * Get all recent events (newest first).
   */
  getRecentEvents(limit: number = 20): ShortTermMemoryEvent[] {
    return this.events.slice(0, limit);
  }

  /**
   * Update active domain and return time spent on previous domain in ms.
   */
  setActiveDomain(domain: string): { previousDomain: string | null; timeSpentMs: number } {
    const now = Date.now();
    const previousDomain = this.currentActiveDomain;
    const timeSpentMs = previousDomain ? now - this.currentDomainStartTime : 0;

    this.currentActiveDomain = domain;
    this.currentDomainStartTime = now;

    return { previousDomain, timeSpentMs };
  }

  getCurrentActiveDomain(): string | null {
    return this.currentActiveDomain;
  }

  /**
   * Warning states tracking.
   */
  setWarning(domain: string, percentSpent: number): void {
    this.activeWarnings.set(domain, {
      domain,
      warnedAt: Date.now(),
      percentSpent,
    });
    this.save();
  }

  clearWarning(domain: string): void {
    this.activeWarnings.delete(domain);
    this.save();
  }

  isWarningActive(domain: string): boolean {
    return this.activeWarnings.has(domain);
  }

  /**
   * Recent speech tracking to prevent repetitive dialogue.
   */
  recordSpeech(phrase: string): void {
    this.recentSpeechPhrases.unshift(phrase);
    if (this.recentSpeechPhrases.length > 10) {
      this.recentSpeechPhrases.pop();
    }
    this.save();
  }

  wasPhraseRecentlySaid(phrase: string): boolean {
    return this.recentSpeechPhrases.includes(phrase);
  }

  /**
   * Clear short-term memory session data.
   */
  clear(): void {
    this.events = [];
    this.activeWarnings.clear();
    this.recentSpeechPhrases = [];
    this.currentActiveDomain = null;
    this.save();
  }
}

export const defaultShortTermMemory = new ShortTermMemory();
