import React, { useEffect, useRef, useState } from 'react';
import { inject as injectVercelAnalytics } from '@vercel/analytics';
import {
  AvatarCompositor,
  defaultAvatarConfig,
  defaultSpeechOrchestrator,
  defaultTTSModulator,
  EmotionsOrchestrator,
  PlutchikEmotion,
  ResponseType,
  EmotionFrameConfig,
  getAvatarEmotionFrames,
} from '../../src/avatar';

import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { AvatarStage } from '../components/AvatarStage';
import { EmotionControls } from '../components/EmotionControls';
import { EmotionsWheelVisualizer } from '../components/EmotionsWheelVisualizer';
import { SpeechSimulator } from '../components/SpeechSimulator';
import { MappedWordsView } from '../components/MappedWordsView';
import { ActivitySimulator } from '../components/ActivitySimulator';
import { EngineTuningControls } from '../components/EngineTuningControls';
import { VoiceModulationControls } from '../components/VoiceModulationControls';
import { MonitoringSimulator } from '../components/MonitoringSimulator';
import { MarketplaceSection } from '../components/MarketplaceSection';
import { ProjectOverview } from '../components/ProjectOverview';

import { Button } from '../components/ui';

// Initialize Vercel Analytics tracking.
injectVercelAnalytics();

// Main interactive playground page view.
export const PlaygroundPage: React.FC = () => {
  const emotionEngineRef = useRef<EmotionsOrchestrator>(new EmotionsOrchestrator());
  const compositorRef = useRef<AvatarCompositor | null>(null);

  const [theme, setTheme] = useState<'cream' | 'grid'>('cream');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [showMappedWords, setShowMappedWords] = useState<boolean>(false);
  const [activeTabPanel, setActiveTabPanel] = useState<'modulation' | 'monitoring'>('modulation');

  const [speechBubbleText, setSpeechBubbleText] = useState<string>(
    'Hello! I am CHLEO. Click any action below to test my reactions!'
  );
  const [isBubbleVisible, setIsBubbleVisible] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [activeExpressionLabel, setActiveExpressionLabel] = useState<string>('Idle');
  const [speechInputText, setSpeechInputText] = useState<string>(
    'Hello. I am Chleo! Nice to meet you...'
  );

  const [cycleSpeed, setCycleSpeed] = useState<number>(1000);
  const [renderScale, setRenderScale] = useState<number>(6);
  const [emotionRefreshKey, setEmotionRefreshKey] = useState<number>(0);

  const [currentEmotionState, setCurrentEmotionState] = useState<{
    overallEmotion: PlutchikEmotion;
    responseType: ResponseType;
    emotionFrames: EmotionFrameConfig;
  }>({
    overallEmotion: 'Love',
    responseType: 'declarative',
    emotionFrames: getAvatarEmotionFrames('Love', 'declarative'),
  });

  const speechTimerRef = useRef<number | null>(null);
  const bubbleTimerRef = useRef<number | null>(null);

  // Sync theme class to document body.
  useEffect(() => {
    document.body.className = theme === 'cream' ? 'theme-light-pixel' : 'theme-pixel-grid';
  }, [theme]);

  // Display speech bubble text and synthesize speech audio.
  const speakText = async (text: string, customEmotionFrames?: EmotionFrameConfig) => {
    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);

    // Pre-warm Web AudioContext and OS audio hardware drivers immediately on user gesture
    defaultTTSModulator.preWarm();

    // Query real-time overall emotion directly from engine instance to avoid stale React closure state
    const realTimeOverall = emotionEngineRef.current.getOverallEmotion();
    const emotionFrames = customEmotionFrames ?? getAvatarEmotionFrames(realTimeOverall, currentEmotionState.responseType || 'declarative');
    const compositor = compositorRef.current;
    const tickMs = (defaultAvatarConfig.cycleDurationMs ?? 1000) / defaultAvatarConfig.masterFrameCount;

    // Show thinking bubble & subtle expression while measuring TTS in background
    setIsThinking(true);
    setActiveExpressionLabel(`Thinking... (${realTimeOverall})`);
    if (compositor) {
      compositor.playAnimation('eyebrows', 'question', 'once');
    }

    const packet = await defaultSpeechOrchestrator.preRenderSpeech(text, tickMs, emotionFrames);

    setIsThinking(false);
    setSpeechBubbleText(text);
    setIsBubbleVisible(true);
    setActiveExpressionLabel(`Speaking (${realTimeOverall})`);

    if (compositor) {
      defaultSpeechOrchestrator.playPreRenderedSpeech(packet, compositor);
    }

    const speakDuration = Math.max(1200, packet.totalDurationMs);
    const bubbleDuration = speakDuration + 1500;

    speechTimerRef.current = window.setTimeout(() => {
      if (compositorRef.current) {
        compositorRef.current.resetAll();
      }
      setActiveExpressionLabel('Idle');
    }, speakDuration);

    bubbleTimerRef.current = window.setTimeout(() => {
      setIsBubbleVisible(false);
    }, bubbleDuration);
  };

  const handleCycleSpeedChange = (ms: number) => {
    setCycleSpeed(ms);
    if (compositorRef.current) {
      compositorRef.current.setCycleDurationMs(ms);
    }
  };

  const handleRenderScaleChange = (scale: number) => {
    setRenderScale(scale);
    if (compositorRef.current) {
      compositorRef.current.setScale(scale);
    }
  };

  return (
    <div className="app-layout">
      {/* Drawer Backdrop */}
      <div
        id="drawer-backdrop"
        className={`drawer-backdrop ${isDrawerOpen ? 'active' : ''}`}
        onClick={() => setIsDrawerOpen(false)}
      />

      <Header
        activeTab="playground"
        theme={theme}
        onThemeChange={(newTheme) => setTheme(newTheme)}
        onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
      />

      <main className="main-content">
        <AvatarStage
          speechBubbleText={speechBubbleText}
          isBubbleVisible={isBubbleVisible}
          isThinking={isThinking}
          activeExpressionLabel={activeExpressionLabel}
          renderScale={renderScale}
          theme={theme}
          onThemeChange={(newTheme) => setTheme(newTheme)}
          onCompositorInit={(compositor) => {
            compositorRef.current = compositor;
          }}
          onBlink={() => setActiveExpressionLabel('Blinking')}
        />

        {/* Collapsible Control Side-Drawer */}
        <aside
          className={`controls-panel ${isDrawerOpen ? 'drawer-active open' : ''}`}
          id="controls-panel"
        >
          <div className="drawer-header">
            <div className="drawer-title-group">
              <span className="drawer-icon">🎮</span>
              <h3 className="drawer-title">Controls &amp; Actions</h3>
            </div>
            <button
              id="btn-close-drawer"
              className="drawer-close-btn"
              title="Close Panel"
              onClick={() => setIsDrawerOpen(false)}
            >
              ✕
            </button>
          </div>
          <EmotionsWheelVisualizer
            emotionEngine={emotionEngineRef.current}
            onChangeEmotionState={(newState) => setCurrentEmotionState(newState)}
            refreshKey={emotionRefreshKey}
          />

          {!showMappedWords ? (
            <SpeechSimulator
              speechInputText={speechInputText}
              onSpeechInputChange={(val) => setSpeechInputText(val)}
              onSpeakText={(text) => speakText(text)}
              onToggleMappedWords={() => setShowMappedWords(true)}
            />
          ) : (
            <MappedWordsView
              onSelectWord={(word) => {
                setSpeechInputText(word);
                speakText(word);
              }}
              onBack={() => setShowMappedWords(false)}
            />
          )}

          <EngineTuningControls
            cycleSpeed={cycleSpeed}
            renderScale={renderScale}
            onCycleSpeedChange={handleCycleSpeedChange}
            onRenderScaleChange={handleRenderScaleChange}
          />

          {/* Sub-panel Tabs for Voice Modulation & Monitoring Simulator */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', marginBottom: '8px' }}>
            <Button
              variant={activeTabPanel === 'modulation' ? 'primary' : 'secondary'}
              onClick={() => setActiveTabPanel('modulation')}
              style={{ flex: 1, padding: '8px 10px', fontSize: '0.85rem' }}
            >
              🎙️ Voice Modulation
            </Button>
            <Button
              variant={activeTabPanel === 'monitoring' ? 'primary' : 'secondary'}
              onClick={() => setActiveTabPanel('monitoring')}
              style={{ flex: 1, padding: '8px 10px', fontSize: '0.85rem' }}
            >
              🛡️ Monitoring
            </Button>
          </div>

          {activeTabPanel === 'modulation' ? (
            <VoiceModulationControls
              onTestVoice={() => {
                const testText = speechInputText.trim() || 'get me some water';
                speakText(testText);
              }}
            />
          ) : (
            <MonitoringSimulator
              emotionEngine={emotionEngineRef.current}
              onSpeakText={(text) => speakText(text)}
              onRefreshEmotionState={() => {
                const overall = emotionEngineRef.current.getOverallEmotion();
                const newFrames = getAvatarEmotionFrames(overall, 'declarative');
                setCurrentEmotionState({
                  overallEmotion: overall,
                  responseType: 'declarative',
                  emotionFrames: newFrames,
                });
                // Update the values of the tuners to reflect the new values in emotionEngineRef
                setEmotionRefreshKey((prev) => prev + 1);
              }}
            />
          )}
        </aside>
      </main>

      <MarketplaceSection />
      <ProjectOverview />
      <Footer />
    </div>
  );
};
