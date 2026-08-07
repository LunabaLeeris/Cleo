export interface ParsedCommand {
  action: 'BLOCK' | 'UNBLOCK' | 'LIMIT' | 'MARK_PRODUCTIVE' | 'UNMARK_PRODUCTIVE' | 'SET_REWARD_INTERVAL' | 'UNKNOWN';
  domain?: string;
  seconds?: number;
  minutes?: number;
  rawText: string;
}

/**
 * Command Manual for Chleo Monitoring directives.
 * Defines supported natural language command syntax patterns for local heuristic parsing
 * and local LLM prompt instruction context.
 */
export const COMMAND_MANUAL = {
  commands: [
    {
      syntax: "block <domain>",
      examples: ["block facebook.com", "restrict twitter.com"],
      description: "Completely restricts access to the domain until unblocked via puzzle challenge."
    },
    {
      syntax: "unblock <domain>",
      examples: ["unblock facebook.com"],
      description: "Requests to unblock access, requiring user to complete a puzzle challenge at an emotion penalty."
    },
    {
      syntax: "limit <domain> to <number> [minutes|seconds]",
      examples: ["limit youtube.com to 15 minutes", "limit reddit.com to 30 seconds"],
      description: "Sets daily allowed time limit on a domain. Triggers warning at threshold and blocks when reached."
    },
    {
      syntax: "mark <domain> productive",
      examples: ["mark github.com productive", "set stackoverflow.com as productive"],
      description: "Tags a domain as productive, granting focus streak rewards, coins, and Chleo praise."
    },
    {
      syntax: "unmark <domain>",
      examples: ["unmark github.com", "remove reddit.com from productive"],
      description: "Removes productive tag from a domain."
    }
  ]
};

/**
 * Utility function to parse user natural language commands into structured monitoring operations.
 */
export function parseMonitoringCommand(text: string): ParsedCommand {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Block command e.g. "block facebook.com" or "restrict facebook.com"
  const blockMatch = lower.match(/^(?:block|restrict)\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (blockMatch) {
    return {
      action: 'BLOCK',
      domain: blockMatch[1],
      rawText: trimmed,
    };
  }

  // 2. Unblock command e.g. "unblock facebook.com"
  const unblockMatch = lower.match(/^unblock\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (unblockMatch) {
    return {
      action: 'UNBLOCK',
      domain: unblockMatch[1],
      rawText: trimmed,
    };
  }

  // 3. Limit command e.g. "limit youtube.com to 5 minutes" or "limit youtube.com to 30 seconds"
  const limitMatch = lower.match(/^limit\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s+(?:to\s+)?(\d+)\s*(min|minute|minutes|sec|second|seconds)?/);
  if (limitMatch) {
    const domain = limitMatch[1];
    const amount = parseInt(limitMatch[2], 10);
    const unit = limitMatch[3] || 'minutes';
    const seconds = unit.startsWith('sec') ? amount : amount * 60;

    return {
      action: 'LIMIT',
      domain,
      seconds,
      minutes: Math.ceil(seconds / 60),
      rawText: trimmed,
    };
  }

  // 4. Mark productive e.g. "mark github.com productive" or "set github.com as productive"
  const productiveMatch = lower.match(/^(?:mark|set)\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s+(?:as\s+)?productive/);
  if (productiveMatch) {
    return {
      action: 'MARK_PRODUCTIVE',
      domain: productiveMatch[1],
      rawText: trimmed,
    };
  }

  // 5. Unmark productive e.g. "unmark github.com" or "remove github.com from productive"
  const unmarkProductiveMatch = lower.match(/^(?:unmark|remove)\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*(?:from\s+productive)?/);
  if (unmarkProductiveMatch) {
    return {
      action: 'UNMARK_PRODUCTIVE',
      domain: unmarkProductiveMatch[1],
      rawText: trimmed,
    };
  }

  return {
    action: 'UNKNOWN',
    rawText: trimmed,
  };
}
