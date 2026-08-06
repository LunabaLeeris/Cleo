import React from 'react';

export interface PanelSectionProps {
  id?: string;
  title?: string;
  icon?: React.ReactNode;
  bgVariant?: 'actions' | 'speech' | 'mapped' | 'activity' | 'tuning' | 'marketplace' | 'discussions';
  extraHeader?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// Renders a panel card container with consistent headers and pixel background themes.
export const PanelSection: React.FC<PanelSectionProps> = ({
  id,
  title,
  icon,
  bgVariant = 'actions',
  extraHeader,
  children,
  className = '',
  style,
}) => {
  const bgClass = `panel-bg-${bgVariant}`;
  const combinedClass = `panel-section ${bgClass} ${className}`.trim();

  return (
    <div id={id} className={combinedClass} style={style}>
      {(title || icon || extraHeader) && (
        <div className={extraHeader ? 'section-header' : ''}>
          {title && (
            <h2 className="section-title">
              {icon && <span className="title-icon">{icon}</span>}
              {title}
            </h2>
          )}
          {extraHeader}
        </div>
      )}
      {children}
    </div>
  );
};
