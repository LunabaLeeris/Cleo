import React from 'react';
import { PanelSection, Slider } from './ui';

interface EngineTuningControlsProps {
  cycleSpeed: number;
  renderScale: number;
  onCycleSpeedChange: (val: number) => void;
  onRenderScaleChange: (val: number) => void;
}

// Renders cycle speed and pixel render scale controls for avatar engine.
export const EngineTuningControls: React.FC<EngineTuningControlsProps> = ({
  cycleSpeed,
  renderScale,
  onCycleSpeedChange,
  onRenderScaleChange,
}) => {
  return (
    <PanelSection
      title="Engine Tuning"
      icon="⚙️"
      bgVariant="tuning"
    >
      <Slider
        id="speed-slider"
        label="Master Cycle Speed"
        min={300}
        max={2500}
        step={50}
        value={cycleSpeed}
        displayValue={`${cycleSpeed}ms`}
        onChange={onCycleSpeedChange}
      />

      <Slider
        id="scale-slider"
        label="Pixel Render Scale"
        min={1}
        max={6}
        step={1}
        value={renderScale}
        displayValue={`${renderScale}×`}
        onChange={onRenderScaleChange}
      />
    </PanelSection>
  );
};
