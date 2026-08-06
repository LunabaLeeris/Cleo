import React from 'react';
import { PanelSection, Badge } from './ui';

// Renders project overview, core feature grids, inspiration quote, and social contact cards.
export const ProjectOverview: React.FC = () => {
  return (
    <PanelSection
      title="Project Overview & Developer Contact"
      icon="📌"
      bgVariant="discussions"
      className="discussions-section"
      extraHeader={<Badge variant="status">Active Project</Badge>}
    >
      <div className="readme-content-card">
        <div className="readme-banner">
          <h3 className="readme-title">Chleo 🎀</h3>
          <p className="readme-subtitle">
            An interactive desktop and browser companion designed to keep you on track. She monitors your digital
            activity, playfully guides you toward better habits, and adds life to your workspace.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <h4>🛡️ Productivity &amp; Focus</h4>
            <ul>
              <li><strong>Website Monitoring:</strong> Tracks time spent on distracting sites and offers productive alternatives.</li>
              <li><strong>Puzzle-Gated Blocking:</strong> Block specific websites. Solve a puzzle to unlock them.</li>
              <li><strong>&quot;Close Her Eyes&quot; Break Time:</strong> Temporary guilt-free browsing after completing hard puzzles.</li>
              <li><strong>Productivity Rewards:</strong> Praises and rewards you for focusing on work.</li>
            </ul>
          </div>

          <div className="feature-card">
            <h4>✨ Interactions &amp; Personality</h4>
            <ul>
              <li><strong>Dynamic Emotions:</strong> Chleo reacts to behavior. She gets happy, angry, or grumpy <code>:|</code>.</li>
              <li><strong>Companion Commentary:</strong> Chimes in with comments about what you&apos;re working on.</li>
              <li><strong>Attention Nudges:</strong> Throws something at your cursor if ignored too long!</li>
              <li><strong>Casual Play:</strong> Play mini-games and interact during breaks.</li>
            </ul>
          </div>

          <div className="feature-card">
            <h4>🎨 Composable Pixel Engine</h4>
            <ul>
              <li><strong>Layered Compositor:</strong> Independent body, eyes, mouth, and eyebrow layers.</li>
              <li><strong>Custom Animations:</strong> Frame-accurate sprite sheet playback and keyframe sync.</li>
              <li><strong>Web &amp; Desktop Ready:</strong> Runs in Electron desktop app and web browsers.</li>
            </ul>
          </div>
        </div>

        <div className="inspiration-box">
          <span className="quote-icon">💡</span>
          <p>
            <em>&quot;The concept and assets for Chleo are inspired by my girlfriend (and yes, she looks just as beautiful, if not more).&quot;</em>
          </p>
        </div>
      </div>

      <div className="contact-section">
        <h3 className="contact-title">📬 Contact Me</h3>
        <div className="social-grid">
          <a
            href="https://www.facebook.com/qwersdfzxc"
            target="_blank"
            rel="noopener noreferrer"
            className="social-card fb"
          >
            <span className="social-icon">👤</span>
            <div className="social-info">
              <span className="social-name">Facebook</span>
              <span className="social-handle">Christian Lee Lunaba</span>
            </div>
          </a>

          <a
            href="https://www.linkedin.com/in/christianlee-lunaba-72229025b/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-card li"
          >
            <span className="social-icon">💼</span>
            <div className="social-info">
              <span className="social-name">LinkedIn</span>
              <span className="social-handle">Christian Lee Lunaba</span>
            </div>
          </a>

          <a
            href="https://github.com/LunabaLeeris"
            target="_blank"
            rel="noopener noreferrer"
            className="social-card gh"
          >
            <span className="social-icon">🐙</span>
            <div className="social-info">
              <span className="social-name">GitHub</span>
              <span className="social-handle">@LunabaLeeris</span>
            </div>
          </a>
        </div>
      </div>
    </PanelSection>
  );
};
