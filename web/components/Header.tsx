import React from 'react';
import { Button, Badge } from './ui';

interface HeaderProps {
  activeTab: 'playground' | 'marketplace' | 'blog';
  theme?: 'cream' | 'grid';
  onThemeChange?: (theme: 'cream' | 'grid') => void;
  onToggleDrawer?: () => void;
}

// Renders the main application header with navigation tabs and control buttons.
export const Header: React.FC<HeaderProps> = ({
  activeTab,
  theme = 'cream',
  onThemeChange,
  onToggleDrawer,
}) => {
  return (
    <header className="app-header panel-bg-header">
      <div className="brand">
        <div className="brand-avatar-icon">
          <img src="/logo.png" alt="CHLEO Logo" className="brand-logo-img" />
        </div>
        <h1 className="brand-title">
          CHLEO{' '}
          <span className="pixel-tag">
            {activeTab === 'playground' ? 'Playground' : activeTab === 'marketplace' ? 'Marketplace' : 'Blog'}
          </span>
        </h1>
      </div>

      <nav className="app-nav-tabs">
        <a
          href="./index.html"
          className={`nav-tab ${activeTab === 'playground' ? 'active' : ''}`}
        >
          <span className="nav-icon">🎮</span> Playground
        </a>
        <a
          href="./marketplace.html"
          className={`nav-tab ${activeTab === 'marketplace' ? 'active' : 'disabled-tab'}`}
        >
          <span className="nav-icon">🛍️</span> Marketplace <Badge variant="nav">Dev</Badge>
        </a>
        <a
          href="./blog.html"
          className={`nav-tab ${activeTab === 'blog' ? 'active' : 'disabled-tab'}`}
        >
          <span className="nav-icon">📰</span> Blog &amp; Updates <Badge variant="nav">Dev</Badge>
        </a>
      </nav>

      <div className="header-actions">
        {activeTab === 'playground' && (
          <Badge variant="pill" icon={<span className="pulse-dot" />}>
            Live v1.0
          </Badge>
        )}

        <a
          href="https://github.com/LunabaLeeris/Chleo"
          target="_blank"
          rel="noopener noreferrer"
          className="contribute-btn"
          title="Contribute on GitHub"
        >
          <span className="btn-icon">⭐</span> Contribute
        </a>

        {activeTab === 'playground' && onThemeChange && (
          <div className="theme-selector">
            <Button
              id="theme-cream-btn"
              variant="theme"
              active={theme === 'cream'}
              title="Cozy Cream Pixel Theme"
              onClick={() => onThemeChange('cream')}
            >
              Cream
            </Button>
            <Button
              id="theme-grid-btn"
              variant="theme"
              active={theme === 'grid'}
              title="Pixel Grid Stage"
              onClick={() => onThemeChange('grid')}
            >
              Grid
            </Button>
          </div>
        )}

        {activeTab === 'playground' && onToggleDrawer && (
          <Button
            id="btn-toggle-drawer"
            variant="drawer-toggle"
            icon="⚙️"
            title="Open Controls Sidebar"
            onClick={onToggleDrawer}
          >
            Controls
          </Button>
        )}
      </div>
    </header>
  );
};
