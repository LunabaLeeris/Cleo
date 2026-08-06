import React from 'react';

export interface SliderProps {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  displayValue: string;
  onChange: (value: number) => void;
}

// Renders a range slider with a label and dynamic value display readout.
export const Slider: React.FC<SliderProps> = ({
  id,
  label,
  min,
  max,
  step,
  value,
  displayValue,
  onChange,
}) => {
  return (
    <div className="slider-group">
      <div className="slider-header">
        <label htmlFor={id}>{label}</label>
        <span id={`${id}-value`}>{displayValue}</span>
      </div>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
};
