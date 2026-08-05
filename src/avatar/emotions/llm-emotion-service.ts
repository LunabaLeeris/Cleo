import type {
  EmotionalState,
  LLMEmotionOutput,
  ResponseType,
  BehavioralData,
} from './emotion-types';

export interface LLMEmotionServiceOptions {
  memoryContext?: string;
  behaviorsContext?: string;
  instructionsContext?: string;
}

/**
 * Service scaffold responsible for interfacing with LLM APIs.
 * Accepts user action inputs, context files (memory.md, behaviors.md, instructions.md),
 * and current emotional state, returning structured output (text, responseType, behavioralData).
 */
export class LLMEmotionServiceScaffold {
  private options: LLMEmotionServiceOptions;

  constructor(options: LLMEmotionServiceOptions = {}) {
    this.options = options;
  }

  /**
   * Update configuration contexts dynamically at runtime.
   */
  setContexts(options: Partial<LLMEmotionServiceOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Mock/Scaffold execution method to simulate LLM action parsing.
   *
   * @param userActionText - Raw action input from user or environment.
   * @param currentEmotionalState - Current state snapshot of the avatar.
   * @returns Structured LLM output with text, responseType, and behavioral deltas.
   */
  async processUserAction(
    userActionText: string,
    currentEmotionalState: EmotionalState
  ): Promise<LLMEmotionOutput> {
    console.log('[LLMEmotionServiceScaffold] Processing action:', userActionText);
    console.log('[LLMEmotionServiceScaffold] Current emotional state:', currentEmotionalState);
    console.log('[LLMEmotionServiceScaffold] Context options active:', {
      hasMemory: Boolean(this.options.memoryContext),
      hasBehaviors: Boolean(this.options.behaviorsContext),
      hasInstructions: Boolean(this.options.instructionsContext),
    });

    // Default mock response generator for testing UI & emotion pipeline
    let responseType: ResponseType = 'declarative';
    let behavioralData: BehavioralData = {};

    const lower = userActionText.toLowerCase();

    if (lower.includes('?') || lower.includes('why') || lower.includes('what') || lower.includes('how')) {
      responseType = 'interrogative';
      behavioralData = { surprise: 0.3, anticipation: 0.2 };
    } else if (lower.includes('!') || lower.includes('wow') || lower.includes('stop')) {
      responseType = 'exclamatory';
      behavioralData = { joy: 0.4, surprise: 0.3 };
    } else if (lower.includes('must') || lower.includes('do') || lower.includes('go')) {
      responseType = 'imperative';
      behavioralData = { anger: 0.2, trust: 0.2 };
    } else {
      responseType = 'declarative';
      behavioralData = { joy: 0.1, trust: 0.1 };
    }

    return {
      text: userActionText,
      responseType,
      behavioralData,
    };
  }
}
