import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

// Standalone marketplace landing page component.
export const MarketplacePage: React.FC = () => {
  return (
    <div className="app-layout">
      <Header activeTab="marketplace" />

      <main className="page-container">
        <section className="dev-banner-card panel-section panel-bg-marketplace">
          <div className="dev-banner-header">
            <span className="banner-icon">🔒</span>
            <div>
              <h2 className="banner-title">Community Marketplace Under Construction</h2>
              <p className="banner-subtitle">Database integration &amp; user auth are currently in development.</p>
            </div>
            <span className="badge-dev-locked">In Development</span>
          </div>

          <p className="banner-desc">
            The marketplace will allow community members and creators to publish custom content for free or paid download.
            Database schema models, asset storage, and serverless API endpoints will be connected here!
          </p>

          <a href="./index.html" className="action-btn btn-primary return-btn">
            <span className="btn-icon">🎮</span> Return to Interactive Playground
          </a>
        </section>

        <section className="marketplace-preview-section">
          <h3 className="section-subtitle">Upcoming Marketplace Categories</h3>

          <div className="marketplace-grid">
            <div className="marketplace-card disabled-card">
              <div className="card-badge">Customizations</div>
              <div className="card-icon">🎨</div>
              <h4 className="card-title">Outfits &amp; UI Skins</h4>
              <p className="card-desc">Custom visual outfits, pixel sprite skins, color schemes, and UI themes for CHLEO.</p>
              <button className="marketplace-btn disabled" disabled>Unavailable</button>
            </div>

            <div className="marketplace-card disabled-card">
              <div className="card-badge">Foods</div>
              <div className="card-icon">🍱</div>
              <h4 className="card-title">Snacks &amp; Treats</h4>
              <p className="card-desc">Treat Chleo with interactive digital snacks, meals, and favorite drinks to boost her mood.</p>
              <button className="marketplace-btn disabled" disabled>Unavailable</button>
            </div>

            <div className="marketplace-card disabled-card">
              <div className="card-badge">MODS</div>
              <div className="card-icon">🧩</div>
              <h4 className="card-title">Community Mods</h4>
              <p className="card-desc">Experimental features and community modifications that alter CHLEO&apos;s core behaviors.</p>
              <button className="marketplace-btn disabled" disabled>Unavailable</button>
            </div>

            <div className="marketplace-card disabled-card">
              <div className="card-badge">AI Brains</div>
              <div className="card-icon">🧠</div>
              <h4 className="card-title">LLMs &amp; Prompts</h4>
              <p className="card-desc">Swap Chleo&apos;s AI brain models, custom system prompts, and personality fine-tunes.</p>
              <button className="marketplace-btn disabled" disabled>Unavailable</button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
