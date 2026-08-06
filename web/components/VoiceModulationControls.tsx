import React, { useState } from 'react';
import { defaultTTSModulator, TTSModulatorConfig } from '../../src/avatar';
import { PanelSection, Slider, Button } from './ui';

interface VoiceModulationControlsProps {
  onTestVoice: () => void;
}

// Renders robotic voice synthesis sliders and configuration controls.
export const VoiceModulationControls: React.FC<VoiceModulationControlsProps> = ({
  onTestVoice,
}) => {
  const [config, setConfig] = useState<TTSModulatorConfig>(defaultTTSModulator.getConfig());
  const [statusMessage, setStatusMessage] = useState<string>('');

  const isProd = import.meta.env.PROD;

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage('');
    }, 3000);
  };

  const updateParam = (partial: Partial<TTSModulatorConfig>) => {
    defaultTTSModulator.updateConfig(partial);
    setConfig({ ...defaultTTSModulator.getConfig() });
  };

  const handleSave = () => {
    defaultTTSModulator.saveConfig();
    showStatus('Modulation settings saved as default!');
  };

  const handleReset = () => {
    defaultTTSModulator.resetToDefault();
    setConfig({ ...defaultTTSModulator.getConfig() });
    showStatus('Reset to default voice settings.');
  };

  return (
    <PanelSection
      id="section-voice-modulation"
      title="Robotic Voice Modulation"
      icon="🎙️"
      bgVariant="tuning"
    >
      <Slider
        id="pitch-slider"
        label="Speech Pitch"
        min={0.5}
        max={3.0}
        step={0.05}
        value={config.speechPitch}
        displayValue={config.speechPitch.toFixed(2)}
        onChange={(val) => updateParam({ speechPitch: val })}
      />

      <Slider
        id="rate-slider"
        label="Speech Rate"
        min={0.2}
        max={3.5}
        step={0.05}
        value={config.speechRate}
        displayValue={config.speechRate.toFixed(2)}
        onChange={(val) => updateParam({ speechRate: val })}
      />

      <Slider
        id="volume-slider"
        label="Master Volume"
        min={0.0}
        max={1.5}
        step={0.05}
        value={config.masterVolume}
        displayValue={config.masterVolume.toFixed(2)}
        onChange={(val) => updateParam({ masterVolume: val })}
      />

      <Slider
        id="blend-slider"
        label="Wall-E Synth Blend"
        min={0.0}
        max={1.0}
        step={0.05}
        value={config.robotToneBlend}
        displayValue={config.robotToneBlend.toFixed(2)}
        onChange={(val) => updateParam({ robotToneBlend: val })}
      />

      <Slider
        id="f0-slider"
        label="Fundamental Pitch (F0)"
        min={100}
        max={800}
        step={10}
        value={config.f0}
        displayValue={`${config.f0}Hz`}
        onChange={(val) => updateParam({ f0: Math.round(val) })}
      />

      <Slider
        id="f1-slider"
        label="Formant F1 Frequency"
        min={200}
        max={2500}
        step={10}
        value={config.f1}
        displayValue={`${config.f1}Hz`}
        onChange={(val) => updateParam({ f1: Math.round(val) })}
      />

      <Slider
        id="f2-slider"
        label="Formant F2 Frequency"
        min={800}
        max={5000}
        step={25}
        value={config.f2}
        displayValue={`${config.f2}Hz`}
        onChange={(val) => updateParam({ f2: Math.round(val) })}
      />

      <Slider
        id="vibrato-rate-slider"
        label="Vibrato Speed"
        min={0.0}
        max={20.0}
        step={0.5}
        value={config.vibratoRate ?? 5.0}
        displayValue={`${(config.vibratoRate ?? 5.0).toFixed(1)}Hz`}
        onChange={(val) => updateParam({ vibratoRate: val })}
      />

      <Slider
        id="vibrato-depth-slider"
        label="Vibrato Depth"
        min={0.0}
        max={1.0}
        step={0.05}
        value={config.vibratoDepth ?? 0.15}
        displayValue={(config.vibratoDepth ?? 0.15).toFixed(2)}
        onChange={(val) => updateParam({ vibratoDepth: val })}
      />

      <Slider
        id="distortion-slider"
        label="Overdrive Crunch"
        min={0.0}
        max={1.0}
        step={0.05}
        value={config.distortion ?? 0.20}
        displayValue={(config.distortion ?? 0.20).toFixed(2)}
        onChange={(val) => updateParam({ distortion: val })}
      />

      <div
        className="button-grid"
        style={{
          marginTop: '12px',
          gridTemplateColumns: isProd ? '1fr 1fr' : '1fr 1fr 1fr',
        }}
      >
        <Button
          id="btn-test-voice"
          variant="primary"
          icon="🔊"
          title="Test active voice settings"
          onClick={onTestVoice}
        >
          Test
        </Button>
        {!isProd && (
          <Button
            id="btn-save-voice-config"
            variant="accent"
            icon="💾"
            title="Save configuration as default"
            onClick={handleSave}
          >
            Save
          </Button>
        )}
        <Button
          id="btn-reset-voice-config"
          variant="secondary"
          icon="🔄"
          title="Reset to factory defaults"
          onClick={handleReset}
        >
          Reset
        </Button>
      </div>

      {statusMessage && (
        <div
          id="voice-config-status"
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '0.75rem',
            color: 'var(--accent-primary)',
            marginTop: '8px',
            textAlign: 'center',
            display: 'block',
          }}
        >
          {statusMessage}
        </div>
      )}
    </PanelSection>
  );
};
