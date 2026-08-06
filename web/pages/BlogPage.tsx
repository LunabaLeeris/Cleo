import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

// Standalone blog and update release notes page component.
export const BlogPage: React.FC = () => {
  return (
    <div className="app-layout">
      <Header activeTab="blog" />

      <main className="page-container">
        <section className="dev-banner-card panel-section panel-bg-discussions">
          <div className="dev-banner-header">
            <span className="banner-icon">🔒</span>
            <div>
              <h2 className="banner-title">Official Blog &amp; Release Notes Under Construction</h2>
              <p className="banner-subtitle">Database publishing engine &amp; post CMS are currently in development.</p>
            </div>
            <span className="badge-dev-locked">In Development</span>
          </div>

          <p className="banner-desc">
            The blog page will store dev logs, feature announcements, patch notes, and community tutorials. Once database
            storage is connected, articles and update posts will be fetched directly here!
          </p>

          <a href="./index.html" className="action-btn btn-primary return-btn">
            <span className="btn-icon">🎮</span> Return to Interactive Playground
          </a>
        </section>

        <section className="blog-preview-section">
          <h3 className="section-subtitle">Upcoming Blog Features</h3>

          <div className="features-grid">
            <div className="feature-card disabled-card">
              <h4>📢 Release Notes &amp; Changelogs</h4>
              <p className="card-desc">Detailed updates for every desktop and browser extension release.</p>
            </div>

            <div className="feature-card disabled-card">
              <h4>🛠️ Sprite Compositor Tutorials</h4>
              <p className="card-desc">Guides on creating custom sprite sheets and layer offset configurations.</p>
            </div>

            <div className="feature-card disabled-card">
              <h4>🧠 AI &amp; Personality Roadmap</h4>
              <p className="card-desc">Deep dives into CHLEO&apos;s emotion engine, productivity rules, and local LLMs.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
