import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  id: string;
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

// Renders a styled dropdown selection input with an optional text label.
export const Select: React.FC<SelectProps> = ({
  id,
  label,
  value,
  options,
  onChange,
  className = '',
  style,
}) => {
  return (
    <div className="select-field">
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#cbd5e1',
            marginBottom: '4px',
            display: 'block',
          }}
        >
          {label}
        </label>
      )}
      <select
        id={id}
        className={`text-input ${className}`.trim()}
        style={{ padding: '6px 10px', cursor: 'pointer', width: '100%', ...style }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
