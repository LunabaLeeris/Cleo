import React, { useEffect, useState, useCallback } from 'react';
import {
  EmotionsOrchestrator,
  getAvatarEmotionFrames,
  EMOTION_TO_FAMILY,
  PrimaryEmotion,
  PRIMARY_EMOTIONS,
  ResponseType,
  PlutchikEmotion,
  EmotionFrameConfig,
} from '../../src/avatar';
import { PanelSection, Select } from './ui';

interface EmotionsWheelVisualizerProps {
  emotionEngine: EmotionsOrchestrator;
  onChangeEmotionState: (state: {
    overallEmotion: PlutchikEmotion;
    responseType: ResponseType;
    emotionFrames: EmotionFrameConfig;
  }) => void;
  refreshKey?: number;
}

interface EmotionMeta {
  key: PrimaryEmotion;
  label: string;
  color: string;
  darkColor: string;
  icon: string;
  angle: number; // Angle on Plutchik wheel (degrees)
}

const EMOTION_METADATA: EmotionMeta[] = [
  { key: 'joy', label: 'Joy', color: '#fde047', darkColor: '#ca8a04', icon: '😊', angle: 0 },
  { key: 'trust', label: 'Trust', color: '#4ade80', darkColor: '#16a34a', icon: '🤝', angle: 45 },
  { key: 'fear', label: 'Fear', color: '#14b8a6', darkColor: '#0d9488', icon: '😨', angle: 90 },
  { key: 'surprise', label: 'Surprise', color: '#38bdf8', darkColor: '#0284c7', icon: '😮', angle: 135 },
  { key: 'sadness', label: 'Sadness', color: '#60a5fa', darkColor: '#2563eb', icon: '😢', angle: 180 },
  { key: 'disgust', label: 'Disgust', color: '#c084fc', darkColor: '#9333ea', icon: '🤢', angle: 225 },
  { key: 'anger', label: 'Anger', color: '#f87171', darkColor: '#dc2626', icon: '😡', angle: 270 },
  { key: 'anticipation', label: 'Anticipation', color: '#fb923c', darkColor: '#ea580c', icon: '🤩', angle: 315 },
];

const PRESETS: Array<{ label: string; state: Partial<Record<PrimaryEmotion, number>> }> = [
  { label: '💖 Love', state: { joy: 0.9, trust: 0.8 } },
  { label: '🌟 Optimism', state: { joy: 0.85, anticipation: 0.75 } },
  { label: '🔥 Aggression', state: { anger: 0.9, anticipation: 0.7 } },
  { label: '😲 Awe', state: { fear: 0.8, surprise: 0.85 } },
  { label: '🎭 Bittersweet', state: { joy: 0.7, sadness: 0.7 } },
  { label: '🧹 Reset (0%)', state: { joy: 0, trust: 0, fear: 0, surprise: 0, sadness: 0, disgust: 0, anger: 0, anticipation: 0 } },
];

const RESPONSE_TYPE_OPTIONS = [
  { value: 'declarative', label: 'Declarative' },
  { value: 'exclamatory', label: 'Exclamatory' },
  { value: 'interrogative', label: 'Interrogative' },
  { value: 'imperative', label: 'Imperative' },
];

export const EmotionsWheelVisualizer: React.FC<EmotionsWheelVisualizerProps> = ({
  emotionEngine,
  onChangeEmotionState,
  refreshKey,
}) => {
  const [emotionsState, setEmotionsState] = useState<Record<PrimaryEmotion, number>>(() => ({
    joy: 0.9,
    trust: 0.8,
    fear: 0,
    surprise: 0,
    sadness: 0,
    disgust: 0,
    anger: 0,
    anticipation: 0,
  }));

  const [responseType, setResponseType] = useState<ResponseType>('declarative');
  const [derivedEmotion, setDerivedEmotion] = useState<PlutchikEmotion>('Love');
  const [mappedFramesText, setMappedFramesText] = useState<string>('');

  // Sync internal state with emotionEngine & propagate changes up
  const syncEmotionState = useCallback(
    (newState: Record<PrimaryEmotion, number>, currentResponseType: ResponseType) => {
      emotionEngine.setState(newState);
      const overallEmotion = emotionEngine.getOverallEmotion();
      const emotionFrames = getAvatarEmotionFrames(overallEmotion, currentResponseType);
      const family = EMOTION_TO_FAMILY[overallEmotion] ?? 'neutral';

      setDerivedEmotion(overallEmotion);
      setMappedFramesText(`Family: ${family} | Intent: ${currentResponseType}`);

      onChangeEmotionState({
        overallEmotion,
        responseType: currentResponseType,
        emotionFrames,
      });
    },
    [emotionEngine, onChangeEmotionState]
  );

  // Initialize engine state on mount
  useEffect(() => {
    syncEmotionState(emotionsState, responseType);
  }, []);

  // Update slider values when external events modify emotionEngine
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      const updatedState = emotionEngine.getState();
      setEmotionsState(updatedState);
      const overallEmotion = emotionEngine.getOverallEmotion();
      const emotionFrames = getAvatarEmotionFrames(overallEmotion, responseType);
      const family = EMOTION_TO_FAMILY[overallEmotion] ?? 'neutral';

      setDerivedEmotion(overallEmotion);
      setMappedFramesText(`Family: ${family} | Intent: ${responseType}`);

      onChangeEmotionState({
        overallEmotion,
        responseType,
        emotionFrames,
      });
    }
  }, [refreshKey, emotionEngine, responseType, onChangeEmotionState]);

  const handleSliderChange = (emotionKey: PrimaryEmotion, value: number) => {
    const nextState = {
      ...emotionsState,
      [emotionKey]: value,
    };
    setEmotionsState(nextState);
    syncEmotionState(nextState, responseType);
  };

  const handleResponseTypeChange = (newType: ResponseType) => {
    setResponseType(newType);
    syncEmotionState(emotionsState, newType);
  };

  const applyPreset = (presetState: Partial<Record<PrimaryEmotion, number>>) => {
    const nextState: Record<PrimaryEmotion, number> = {
      joy: 0,
      trust: 0,
      fear: 0,
      surprise: 0,
      sadness: 0,
      disgust: 0,
      anger: 0,
      anticipation: 0,
      ...presetState,
    };
    setEmotionsState(nextState);
    syncEmotionState(nextState, responseType);
  };

  // Calculate SVG wheel arc paths for visual representation
  const renderWheelSvg = () => {
    const size = 180;
    const center = size / 2;
    const radius = 72;
    const innerRadius = 26;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="emotions-wheel-svg">
        <circle cx={center} cy={center} r={radius + 4} fill="rgba(15, 23, 42, 0.4)" stroke="var(--border-pixel)" strokeWidth="2" />
        
        {EMOTION_METADATA.map((meta) => {
          const intensity = emotionsState[meta.key] ?? 0;
          const angleRad = (meta.angle - 90) * (Math.PI / 180);
          const arcAngle = (360 / 8) * (Math.PI / 180);
          const startAngle = angleRad - arcAngle / 2;
          const endAngle = angleRad + arcAngle / 2;

          const currentRadius = innerRadius + (radius - innerRadius) * Math.max(0.15, intensity);

          const x1 = center + currentRadius * Math.cos(startAngle);
          const y1 = center + currentRadius * Math.sin(startAngle);
          const x2 = center + currentRadius * Math.cos(endAngle);
          const y2 = center + currentRadius * Math.sin(endAngle);

          const xInner1 = center + innerRadius * Math.cos(startAngle);
          const yInner1 = center + innerRadius * Math.sin(startAngle);
          const xInner2 = center + innerRadius * Math.cos(endAngle);
          const yInner2 = center + innerRadius * Math.sin(endAngle);

          const pathData = [
            `M ${xInner1} ${yInner1}`,
            `L ${x1} ${y1}`,
            `A ${currentRadius} ${currentRadius} 0 0 1 ${x2} ${y2}`,
            `L ${xInner2} ${yInner2}`,
            `A ${innerRadius} ${innerRadius} 0 0 0 ${xInner1} ${yInner1}`,
            'Z',
          ].join(' ');

          const isTopActive = intensity >= 0.5;

          return (
            <g key={meta.key} className="wheel-sector-group">
              <path
                d={pathData}
                fill={meta.color}
                fillOpacity={intensity > 0 ? 0.35 + intensity * 0.6 : 0.12}
                stroke={meta.darkColor}
                strokeWidth={isTopActive ? 2 : 1}
                style={{
                  transition: 'd 0.15s ease, fill-opacity 0.15s ease',
                  filter: isTopActive ? `drop-shadow(0 0 6px ${meta.color})` : 'none',
                }}
              >
                <title>{`${meta.label}: ${Math.round(intensity * 100)}%`}</title>
              </path>
            </g>
          );
        })}

        {/* Center Plutchik Core */}
        <circle cx={center} cy={center} r={innerRadius - 2} fill="#0f172a" stroke="var(--border-pixel)" strokeWidth="2" />
        <text
          x={center}
          y={center + 4}
          textAnchor="middle"
          fill="#38bdf8"
          fontSize="10px"
          fontWeight="bold"
          fontFamily="var(--font-pixel)"
        >
          {derivedEmotion}
        </text>
      </svg>
    );
  };

  return (
    <PanelSection
      id="section-emotions-wheel"
      title="Emotions Wheel Visualizer"
      icon="☸️"
      bgVariant="actions"
    >
      {/* Visual Plutchik Wheel Display */}
      <div className="emotions-wheel-top-container">
        <div className="wheel-graphic-box">
          {renderWheelSvg()}
        </div>

        <div className="wheel-status-badge">
          <div className="status-label">Overall Emotion Dyad</div>
          <div id="derived-emotion-display" className="derived-emotion-title">
            {derivedEmotion}
          </div>
          <div id="mapped-frames-display" className="mapped-frames-subtitle">
            {mappedFramesText}
          </div>

          <div className="response-type-wrapper">
            <Select
              id="select-response-type"
              label="Response Type Intent"
              value={responseType}
              options={RESPONSE_TYPE_OPTIONS}
              onChange={(val) => handleResponseTypeChange(val as ResponseType)}
            />
          </div>
        </div>
      </div>

      {/* Preset Action Mixers */}
      <div className="preset-mixers-container">
        <span className="preset-label">Presets:</span>
        <div className="preset-buttons-scroll">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="preset-btn"
              onClick={() => applyPreset(preset.state)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Volume Tuner Console */}
      <div className="volume-tuners-section">
        <div className="tuners-header">
          <span className="tuners-title">🎛️ Emotion Intensity Tuners (0% - 100%)</span>
        </div>

        <div className="tuners-grid">
          {EMOTION_METADATA.map((meta) => {
            const intensity = emotionsState[meta.key] ?? 0;
            const pct = Math.round(intensity * 100);
            const sliderId = `tuner-${meta.key}`;

            // Create LED VU-meter bars (5 segments)
            const ledCount = 5;
            const activeLeds = Math.round((pct / 100) * ledCount);

            return (
              <div key={meta.key} className="tuner-card" style={{ '--tuner-color': meta.color } as React.CSSProperties}>
                <div className="tuner-card-header">
                  <div className="tuner-info">
                    <span className="tuner-icon">{meta.icon}</span>
                    <span className="tuner-name">{meta.label}</span>
                  </div>
                  <span className="tuner-value-badge">{pct}%</span>
                </div>

                <div className="tuner-controls">
                  <input
                    type="range"
                    id={sliderId}
                    className="volume-fader"
                    min={0}
                    max={1}
                    step={0.05}
                    value={intensity}
                    onChange={(e) => handleSliderChange(meta.key, parseFloat(e.target.value))}
                  />

                  <div className="vu-meter">
                    {Array.from({ length: ledCount }).map((_, i) => (
                      <span
                        key={i}
                        className={`vu-led ${i < activeLeds ? 'active' : ''}`}
                        style={{
                          backgroundColor: i < activeLeds ? meta.color : 'rgba(255,255,255,0.1)',
                          boxShadow: i < activeLeds ? `0 0 4px ${meta.color}` : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PanelSection>
  );
};
