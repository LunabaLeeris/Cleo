import React, { useState, useEffect } from 'react';
import { PanelSection, Button } from './ui';
import { ActivityTracker, defaultRuleStore, SiteRule } from '../../src/monitoring';
import { defaultShortTermMemory } from '../../src/memory/short-term-memory';
import { defaultLongTermMemory } from '../../src/memory/long-term-memory';
import { EmotionsOrchestrator } from '../../src/avatar/emotions/emotions-orchestrator';

interface MonitoringSimulatorProps {
  emotionEngine: EmotionsOrchestrator;
  onSpeakText: (text: string) => void;
  onRefreshEmotionState: () => void;
}

export const MonitoringSimulator: React.FC<MonitoringSimulatorProps> = ({
  emotionEngine,
  onSpeakText,
  onRefreshEmotionState,
}) => {
  const [tracker, setTracker] = useState<ActivityTracker | null>(null);
  const [siteRules, setSiteRules] = useState<SiteRule[]>([]);
  const [currentDomain, setCurrentDomain] = useState<string>('youtube.com');
  const [activeSiteStatus, setActiveSiteStatus] = useState<string>('Visiting youtube.com');
  const [tickCounter, setTickCounter] = useState<number>(0);

  // Natural language command input
  const [commandInput, setCommandInput] = useState<string>('');

  // Custom limit input state
  const [limitDomain, setLimitDomain] = useState<string>('youtube.com');
  const [limitSecondsInput, setLimitSecondsInput] = useState<number>(15);

  // Modifiable penalties & rewards state (Goal 3 & Goal 9)
  const [puzzleAngerDelta, setPuzzleAngerDelta] = useState<number>(0.35);
  const [puzzleSadnessDelta, setPuzzleSadnessDelta] = useState<number>(0.25);
  const [productiveRewardInterval, setProductiveRewardInterval] = useState<number>(10); // 10s for fast testing
  const [productiveJoyDelta, setProductiveJoyDelta] = useState<number>(0.35);

  // Memory log preview
  const [memoryEvents, setMemoryEvents] = useState<any[]>([]);

  // Initialize ActivityTracker instance
  useEffect(() => {
    defaultRuleStore.setProductiveRewardIntervalSeconds(productiveRewardInterval);

    const instance = new ActivityTracker(
      defaultRuleStore,
      defaultShortTermMemory,
      defaultLongTermMemory,
      emotionEngine,
      {
        onEventTriggered: (payload, speechText) => {
          onRefreshEmotionState();
          onSpeakText(speechText);
          refreshMemoryLogs();
        },
        onRuleChanged: () => {
          refreshRules();
        },
        onTick: () => {
          refreshRules();
        },
      }
    );

    setTracker(instance);
    setSiteRules(defaultRuleStore.getSiteRules());
    refreshMemoryLogs();

    return () => {
      instance.stopTicker();
    };
  }, []);

  const refreshRules = () => {
    setSiteRules([...defaultRuleStore.getSiteRules()]);
    setTickCounter((prev) => prev + 1);
  };

  const refreshMemoryLogs = () => {
    setMemoryEvents([...defaultShortTermMemory.getRecentEvents(10)]);
  };

  // Simulate visiting a domain
  const handleVisitSite = (domain: string) => {
    setCurrentDomain(domain);
    if (!tracker) return;

    const result = tracker.handleSiteVisit(domain);
    if (result.isBlocked) {
      setActiveSiteStatus(`🚫 BLOCKED: Access restricted to ${domain}`);
    } else {
      setActiveSiteStatus(`🌐 Active on ${domain}`);
    }
    refreshRules();
    refreshMemoryLogs();
  };

  // Block a site
  const handleBlockSite = (domain: string) => {
    defaultRuleStore.setBlockSite(domain);
    refreshRules();
    onSpeakText(`I have completely blocked ${domain}!`);
    onRefreshEmotionState();
  };

  //  Unblock via Puzzle Finish (with Anger & Sadness Penalty)
  const handleUnblockWithPuzzle = (domain: string) => {
    if (!tracker) return;
    const result = tracker.completePuzzleAndUnblock(domain);
    setActiveSiteStatus(`🔓 Unblocked ${domain} after puzzle challenge`);
    refreshRules();
    refreshMemoryLogs();
  };

  // Set time limit on site
  const handleSetLimit = (domain: string, seconds: number) => {
    defaultRuleStore.setSiteLimit(domain, seconds);
    refreshRules();
    onSpeakText(`Set daily limit of ${seconds} seconds for ${domain}.`);
    onRefreshEmotionState();
  };

  // Mark productive
  const handleToggleProductive = (domain: string, isProductive: boolean) => {
    defaultRuleStore.setSiteProductive(domain, isProductive);
    refreshRules();
    onSpeakText(`${domain} is now marked as ${isProductive ? 'productive' : 'neutral'}.`);
    onRefreshEmotionState();
  };

  // Update penalty & reward settings
  const handleUpdatePenalties = () => {
    defaultRuleStore.updateBehavioralRule('PUZZLE_UNBLOCK_PENALTY', {
      emotionDeltas: { anger: puzzleAngerDelta, sadness: puzzleSadnessDelta },
    });
    defaultRuleStore.updateBehavioralRule('PRODUCTIVE_MILESTONE', {
      emotionDeltas: { joy: productiveJoyDelta, trust: 0.2 },
    });
    defaultRuleStore.setProductiveRewardIntervalSeconds(productiveRewardInterval);

    onSpeakText('Updated penalty and reward rules!');
    onRefreshEmotionState();
  };

  // Natural language command handler
  const handleExecuteCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || !tracker) return;

    const { responseText } = tracker.processCommand(commandInput);
    onSpeakText(responseText);
    setCommandInput('');
    refreshRules();
    refreshMemoryLogs();
  };

  const activeRule = defaultRuleStore.findRuleForDomain(currentDomain);

  return (
    <PanelSection
      id="section-monitoring"
      title="Chleo Monitoring Engine Simulator"
      icon="🛡️"
      bgVariant="tuning"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'var(--font-body)' }}>

        {/* Active Domain Simulation Status */}
        <div style={{
          padding: '12px 14px',
          background: 'var(--bg-card-secondary, #f4ece0)',
          borderRadius: '8px',
          border: '2px solid var(--border-pixel, #2d2424)',
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark, #2d2424)', fontFamily: 'var(--font-pixel)', marginBottom: '6px' }}>
            Current Active Simulator Domain:
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: activeRule?.type === 'blocked' ? '#d32f2f' : '#2e7d32' }}>
              {activeSiteStatus}
            </span>
          </div>

          {activeRule && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #6e625e)', marginTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Total Spent Today: <strong>{activeRule.spentTodaySeconds}s</strong></span>
                {activeRule.dailyLimitSeconds > 0 && (
                  <span>Daily Limit: <strong>{activeRule.dailyLimitSeconds}s</strong></span>
                )}
              </div>
              {activeRule.dailyLimitSeconds > 0 && (
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#e2e8f0',
                  borderRadius: '4px',
                  marginTop: '4px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-pixel, #2d2424)'
                }}>
                  <div style={{
                    width: `${Math.min(100, (activeRule.spentTodaySeconds / activeRule.dailyLimitSeconds) * 100)}%`,
                    height: '100%',
                    background: activeRule.spentTodaySeconds >= activeRule.dailyLimitSeconds ? '#ef4444' : activeRule.spentTodaySeconds >= activeRule.dailyLimitSeconds * 0.75 ? '#f59e0b' : '#10b981',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              )}
            </div>
          )}

          {/* Quick Domain Visit Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
            <Button variant="activity" onClick={() => handleVisitSite('youtube.com')}>Visit YouTube</Button>
            <Button variant="activity" onClick={() => handleVisitSite('facebook.com')}>Visit Facebook</Button>
            <Button variant="activity" onClick={() => handleVisitSite('github.com')}>Visit GitHub</Button>
            <Button variant="activity" onClick={() => handleVisitSite('twitter.com')}>Visit Twitter</Button>
          </div>
        </div>

        {/* Natural Language Command Parser */}
        <form onSubmit={handleExecuteCommand} style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            placeholder="Command e.g. 'block twitter.com', 'limit youtube.com to 10 seconds'"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: '2px solid var(--border-pixel, #2d2424)',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-body)',
              background: '#fffbf5',
            }}
          />
          <Button variant="primary" type="submit">Run Command</Button>
        </form>

        {/* Quick Rule Configurator */}
        <div style={{ background: 'var(--bg-card-secondary, #f4ece0)', padding: '10px 12px', borderRadius: '8px', border: '2px solid var(--border-pixel, #2d2424)' }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-pixel)', marginBottom: '8px' }}>
            ⚙️ Quick Site Limit Configurator
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={limitDomain}
              onChange={(e) => setLimitDomain(e.target.value)}
              placeholder="Domain"
              style={{ width: '120px', padding: '6px', fontSize: '0.8rem', border: '2px solid var(--border-pixel, #2d2424)', borderRadius: '6px', background: '#fff' }}
            />
            <input
              type="number"
              value={limitSecondsInput}
              onChange={(e) => setLimitSecondsInput(Number(e.target.value))}
              placeholder="Seconds"
              style={{ width: '70px', padding: '6px', fontSize: '0.8rem', border: '2px solid var(--border-pixel, #2d2424)', borderRadius: '6px', background: '#fff' }}
            />
            <span style={{ fontSize: '0.8rem' }}>seconds</span>
            <Button variant="secondary" onClick={() => handleSetLimit(limitDomain, limitSecondsInput)}>
              Set Limit
            </Button>
          </div>
        </div>

        {/* Site Rules Table */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-pixel)', marginBottom: '6px' }}>
            📋 Active Site Monitoring Rules:
          </div>
          <div style={{ maxHeight: '180px', overflowY: 'auto', border: '2px solid var(--border-pixel, #2d2424)', borderRadius: '8px', background: '#fffbf5' }}>
            <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-secondary, #f4ece0)', textAlign: 'left', fontFamily: 'var(--font-pixel)', borderBottom: '2px solid var(--border-pixel, #2d2424)' }}>
                  <th style={{ padding: '6px 8px' }}>Domain</th>
                  <th style={{ padding: '6px 8px' }}>Type</th>
                  <th style={{ padding: '6px 8px' }}>Usage / Limit</th>
                  <th style={{ padding: '6px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {siteRules.map((rule) => (
                  <tr key={rule.domain} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{rule.domain}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: '#fff',
                        fontWeight: 'bold',
                        background:
                          rule.type === 'blocked' ? '#e53935' :
                            rule.type === 'avoid' ? '#fb8c00' :
                              rule.type === 'productive' ? '#43a047' : '#757575'
                      }}>
                        {rule.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      {rule.dailyLimitSeconds > 0 ? `${rule.spentTodaySeconds}s / ${rule.dailyLimitSeconds}s` : `${rule.spentTodaySeconds}s`}
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {rule.type === 'blocked' ? (
                          <Button
                            variant="primary"
                            onClick={() => handleUnblockWithPuzzle(rule.domain)}
                            title="Unblock with Puzzle Challenge"
                            style={{ padding: '3px 8px', fontSize: '0.95rem' }}
                          >
                            🧩
                          </Button>
                        ) : (
                          <Button
                            variant="activity"
                            onClick={() => handleBlockSite(rule.domain)}
                            title="Block Domain"
                            style={{ padding: '3px 8px', fontSize: '0.95rem' }}
                          >
                            🚫
                          </Button>
                        )}
                        <Button
                          variant={rule.type === 'productive' ? 'primary' : 'secondary'}
                          onClick={() => handleToggleProductive(rule.domain, rule.type !== 'productive')}
                          title={rule.type === 'productive' ? 'Unmark Productive' : 'Mark Productive'}
                          style={{ padding: '3px 8px', fontSize: '0.95rem' }}
                        >
                          ⭐
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modifiable Penalties & Rewards Controls */}
        <div style={{ background: 'var(--bg-card-secondary, #f4ece0)', padding: '10px 12px', borderRadius: '8px', border: '2px solid var(--border-pixel, #2d2424)' }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-pixel)', marginBottom: '8px' }}>
            🛠️ Modify Emotion Penalties &amp; Reward Rules:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Puzzle Anger Delta:</label>
              <input
                type="number"
                step="0.05"
                value={puzzleAngerDelta}
                onChange={(e) => setPuzzleAngerDelta(Number(e.target.value))}
                style={{ width: '100%', padding: '4px', marginTop: '2px', border: '2px solid var(--border-pixel, #2d2424)', borderRadius: '4px', background: '#fff' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Puzzle Sadness Delta:</label>
              <input
                type="number"
                step="0.05"
                value={puzzleSadnessDelta}
                onChange={(e) => setPuzzleSadnessDelta(Number(e.target.value))}
                style={{ width: '100%', padding: '4px', marginTop: '2px', border: '2px solid var(--border-pixel, #2d2424)', borderRadius: '4px', background: '#fff' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Productive Reward (sec):</label>
              <input
                type="number"
                step="5"
                value={productiveRewardInterval}
                onChange={(e) => setProductiveRewardInterval(Number(e.target.value))}
                style={{ width: '100%', padding: '4px', marginTop: '2px', border: '2px solid var(--border-pixel, #2d2424)', borderRadius: '4px', background: '#fff' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Productive Joy Boost:</label>
              <input
                type="number"
                step="0.05"
                value={productiveJoyDelta}
                onChange={(e) => setProductiveJoyDelta(Number(e.target.value))}
                style={{ width: '100%', padding: '4px', marginTop: '2px', border: '2px solid var(--border-pixel, #2d2424)', borderRadius: '4px', background: '#fff' }}
              />
            </div>
          </div>
          <Button variant="primary" onClick={handleUpdatePenalties} style={{ marginTop: '10px', width: '100%' }}>
            Save Penalty &amp; Reward Rules
          </Button>
        </div>

        {/* Short-Term Memory Preview - Scrollable fixed height */}
        <div style={{
          background: '#fffbf5',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '2px solid var(--border-pixel, #2d2424)',
          fontSize: '0.75rem',
        }}>
          <div style={{ fontWeight: 600, fontFamily: 'var(--font-pixel)', marginBottom: '6px', color: 'var(--text-dark, #2d2424)' }}>
            🧠 Short-Term Memory Event Stream:
          </div>
          <div style={{ maxHeight: '100px', overflowY: 'auto', paddingRight: '4px' }}>
            {memoryEvents.length === 0 ? (
              <div style={{ color: 'var(--text-muted, #6e625e)' }}>No events recorded yet. Try visiting a site or using a command!</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {memoryEvents.map((evt) => (
                  <li key={evt.id} style={{ marginBottom: '3px' }}>
                    <strong>[{new Date(evt.timestamp).toLocaleTimeString()}] {evt.type.toUpperCase()}:</strong> {evt.details}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </PanelSection>
  );
};
