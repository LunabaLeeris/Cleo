import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'contribute'
    | 'theme'
    | 'drawer-toggle'
    | 'back'
    | 'activity'
    | 'chip'
    | 'marketplace'
    | 'custom';
  icon?: React.ReactNode;
  active?: boolean;
}

// Renders a reusable button with optional icons and pixel art themes.
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  icon,
  children,
  className = '',
  active = false,
  disabled = false,
  title,
  id,
  type = 'button',
  onClick,
  style,
  ...restProps
}) => {
  const getVariantClass = (): string => {
    switch (variant) {
      case 'primary':
        return 'action-btn btn-primary';
      case 'secondary':
        return 'action-btn btn-secondary';
      case 'accent':
        return 'action-btn btn-accent';
      case 'contribute':
        return 'contribute-btn';
      case 'theme':
        return `theme-btn ${active ? 'active' : ''}`;
      case 'drawer-toggle':
        return 'drawer-toggle-btn';
      case 'back':
        return 'action-btn btn-accent btn-back-nav';
      case 'activity':
        return 'activity-btn';
      case 'chip':
        return 'mapped-word-chip';
      case 'marketplace':
        return `marketplace-btn ${disabled ? 'disabled' : ''}`;
      default:
        return '';
    }
  };

  const combinedClass = `${getVariantClass()} ${className}`.trim();

  return (
    <button
      id={id}
      type={type}
      className={combinedClass}
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={style}
      {...restProps}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {children && (variant === 'drawer-toggle' ? <span className="btn-text">{children}</span> : children)}
    </button>
  );
};
