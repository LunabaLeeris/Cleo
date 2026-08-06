import React from 'react';

export interface BadgeProps {
  variant?: 'dev-locked' | 'status' | 'count' | 'pill' | 'nav';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

// Renders styled status badges and tag labels.
export const Badge: React.FC<BadgeProps> = ({
  variant = 'pill',
  icon,
  children,
  className = '',
  id,
}) => {
  const getBadgeClass = (): string => {
    switch (variant) {
      case 'dev-locked':
        return 'badge-dev-locked';
      case 'status':
        return 'badge-status';
      case 'count':
        return 'badge-count';
      case 'pill':
        return 'status-pill';
      case 'nav':
        return 'nav-badge';
      default:
        return '';
    }
  };

  const combinedClass = `${getBadgeClass()} ${className}`.trim();

  return (
    <span id={id} className={combinedClass}>
      {icon}
      {children}
    </span>
  );
};
