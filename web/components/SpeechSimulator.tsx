import React from 'react';
import { PanelSection, TextInput, Button } from './ui';

interface SpeechSimulatorProps {
  speechInputText: string;
  onSpeechInputChange: (val: string) => void;
  onSpeakText: (text: string) => void;
  onToggleMappedWords: () => void;
}

// Renders the speech input simulator and action buttons.
export const SpeechSimulator: React.FC<SpeechSimulatorProps> = ({
  speechInputText,
  onSpeechInputChange,
  onSpeakText,
  onToggleMappedWords,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = speechInputText.trim();
      if (trimmed) {
        onSpeakText(trimmed);
      }
    }
  };

  return (
    <PanelSection
      title="Speech & TTS Simulator"
      icon="💬"
      bgVariant="speech"
    >
      <div className="speech-control-group">
        <TextInput
          id="speech-input"
          value={speechInputText}
          onChange={onSpeechInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter text for CHLEO to speak..."
        />
        <div className="speech-actions">
          <Button
            id="btn-speak-text"
            variant="primary"
            icon="🗣️"
            onClick={() => {
              const trimmed = speechInputText.trim();
              if (trimmed) onSpeakText(trimmed);
            }}
          >
            Speak Text
          </Button>
          <Button
            id="btn-mapped-words"
            variant="secondary"
            icon="📖"
            onClick={onToggleMappedWords}
          >
            Mapped Words
          </Button>
        </div>
      </div>
    </PanelSection>
  );
};
