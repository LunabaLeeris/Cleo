import React from 'react';
import { PanelSection, Badge, Button } from './ui';

// Renders the community marketplace section preview with locked feature cards.
export const MarketplaceSection: React.FC = () => {
  return (
    <PanelSection
      title="Community Marketplace"
      icon="🛍️"
      bgVariant="marketplace"
      className="marketplace-section"
      extraHeader={<Badge variant="dev-locked">🔒 In Development (Coming Soon)</Badge>}
    >
      <p className="marketplace-intro">
        The marketplace is how we interact with the community. Creator and community members will be able to share
        custom content for free or paid download!
      </p>

      <div className="marketplace-grid disabled-grid">
        <div className="marketplace-card disabled-card">
          <div className="card-badge">Customizations</div>
          <div className="card-icon">🎨</div>
          <h4 className="card-title">Outfits &amp; UI Themes</h4>
          <p className="card-desc">Custom visual outfits, pixel sprite skins, color schemes, and UI themes for CHLEO.</p>
          <Button variant="marketplace" disabled>Locked</Button>
        </div>

        <div className="marketplace-card disabled-card">
          <div className="card-badge">Foods</div>
          <div className="card-icon">🍱</div>
          <h4 className="card-title">Snacks &amp; Treats</h4>
          <p className="card-desc">Treat Chleo with interactive digital snacks, meals, and favorite drinks to boost her mood.</p>
          <Button variant="marketplace" disabled>Locked</Button>
        </div>

        <div className="marketplace-card disabled-card">
          <div className="card-badge">MODS</div>
          <div className="card-icon">🧩</div>
          <h4 className="card-title">Community Mods</h4>
          <p className="card-desc">Experimental features and community modifications that alter CHLEO&apos;s core behaviors.</p>
          <Button variant="marketplace" disabled>Locked</Button>
        </div>

        <div className="marketplace-card disabled-card">
          <div className="card-badge">AI Brains</div>
          <div className="card-icon">🧠</div>
          <h4 className="card-title">LLMs &amp; Prompts</h4>
          <p className="card-desc">Swap Chleo&apos;s AI brain models, custom system prompts, and personality fine-tunes.</p>
          <Button variant="marketplace" disabled>Locked</Button>
        </div>
      </div>
    </PanelSection>
  );
};
