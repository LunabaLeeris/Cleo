import React from 'react';

export interface TextInputProps {
  id?: string;
  value: string;
  placeholder?: string;
  onChange: (val: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}

// Renders a stylized text input field for speech and search queries.
export const TextInput: React.FC<TextInputProps> = ({
  id,
  value,
  placeholder,
  onChange,
  onKeyDown,
  className = '',
  style,
}) => {
  return (
    <input
      type="text"
      id={id}
      className={`text-input ${className}`.trim()}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      style={style}
    />
  );
};
