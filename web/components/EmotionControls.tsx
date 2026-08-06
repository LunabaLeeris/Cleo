import React, { useEffect, useState } from 'react';
import {
  EmotionsOrchestrator,
  getAvatarEmotionFrames,
  EMOTION_TO_FAMILY,
  PrimaryEmotion,
  ResponseType,
  PlutchikEmotion,
  EmotionFrameConfig,
} from '../../src/avatar';
import { PanelSection, Select } from './ui';

interface EmotionControlsProps {
  emotionEngine: EmotionsOrchestrator;
  onChangeEmotionState: (state: {
    overallEmotion: PlutchikEmotion;
    responseType: ResponseType;
    emotionFrames: EmotionFrameConfig;
  }) => void;
}

const PRIMARY_EMOTION_OPTIONS = [
  { value: 'joy', label: 'Joy' },
  { value: 'trust', label: 'Trust' },
  { value: 'fear', label: 'Fear' },
  { value: 'surprise', label: 'Surprise' },
  { value: 'sadness', label: 'Sadness' },
  { value: 'disgust', label: 'Disgust' },
  { value: 'anger', label: 'Anger' },
  { value: 'anticipation', label: 'Anticipation' },
];

const PRIMARY_EMOTION_2_OPTIONS = [
  ...PRIMARY_EMOTION_OPTIONS,
  { value: 'none', label: 'None (Single Primary)' },
];

const RESPONSE_TYPE_OPTIONS = [
  { value: 'declarative', label: 'Declarative' },
  { value: 'exclamatory', label: 'Exclamatory' },
  { value: 'interrogative', label: 'Interrogative' },
  { value: 'imperative', label: 'Imperative' },
];

// Renders the emotion engine configuration dropdowns and emotion indicators.
export const EmotionControls: React.FC<EmotionControlsProps> = ({
  emotionEngine,
  onChangeEmotionState,
}) => {
  const [emotion1, setEmotion1] = useState<PrimaryEmotion>('joy');
  const [emotion2, setEmotion2] = useState<string>('trust');
  const [responseType, setResponseType] = useState<ResponseType>('declarative');

  const [derivedEmotion, setDerivedEmotion] = useState<PlutchikEmotion>('love');
  const [mappedFramesText, setMappedFramesText] = useState<string>('');

  // Calculate emotion state when selection changes.
  useEffect(() => {
    const stateUpdate: Partial<Record<PrimaryEmotion, number>> = {
      joy: 0,
      trust: 0,
      fear: 0,
      surprise: 0,
      sadness: 0,
      disgust: 0,
      anger: 0,
      anticipation: 0,
    };

    if (emotion2 === 'none') {
      stateUpdate[emotion1] = 0.9;
    } else {
      const e2 = emotion2 as PrimaryEmotion;
      if (emotion1 === e2) {
        stateUpdate[emotion1] = 0.9;
      } else {
        stateUpdate[emotion1] = 0.8;
        stateUpdate[e2] = 0.7;
      }
    }

    emotionEngine.setState(stateUpdate);
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
  }, [emotion1, emotion2, responseType, emotionEngine]);

  return (
    <PanelSection
      id="section-emotions"
      title="Avatar Emotion Engine"
      icon="🎭"
      bgVariant="actions"
    >
      <div
        className="emotion-select-group"
        style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}
      >
        <Select
          id="select-primary-emotion-1"
          label="Top Emotion 1"
          value={emotion1}
          options={PRIMARY_EMOTION_OPTIONS}
          onChange={(val) => setEmotion1(val as PrimaryEmotion)}
        />

        <Select
          id="select-primary-emotion-2"
          label="Top Emotion 2"
          value={emotion2}
          options={PRIMARY_EMOTION_2_OPTIONS}
          onChange={(val) => setEmotion2(val)}
        />

        <Select
          id="select-response-type"
          label="Response Type"
          value={responseType}
          options={RESPONSE_TYPE_OPTIONS}
          onChange={(val) => setResponseType(val as ResponseType)}
        />
      </div>

      <div
        className="emotion-status-badge"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '10px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#94a3b8',
          }}
        >
          Plutchik Overall Emotion
        </div>
        <div
          id="derived-emotion-display"
          style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8', margin: '4px 0' }}
        >
          {derivedEmotion}
        </div>
        <div id="mapped-frames-display" style={{ fontSize: '11px', color: '#cbd5e1' }}>
          {mappedFramesText}
        </div>
      </div>
    </PanelSection>
  );
};
