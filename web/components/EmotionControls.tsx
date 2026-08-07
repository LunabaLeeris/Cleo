import React from 'react';
import { EmotionsWheelVisualizer } from './EmotionsWheelVisualizer';
import { EmotionsOrchestrator, ResponseType, PlutchikEmotion, EmotionFrameConfig } from '../../src/avatar';

interface EmotionControlsProps {
  emotionEngine: EmotionsOrchestrator;
  onChangeEmotionState: (state: {
    overallEmotion: PlutchikEmotion;
    responseType: ResponseType;
    emotionFrames: EmotionFrameConfig;
  }) => void;
}

// EmotionControls now delegates to the tuner-based EmotionsWheelVisualizer component.
export const EmotionControls: React.FC<EmotionControlsProps> = (props) => {
  return <EmotionsWheelVisualizer {...props} />;
};
