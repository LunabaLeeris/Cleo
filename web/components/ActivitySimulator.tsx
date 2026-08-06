import React from 'react';
import { PanelSection, Button } from './ui';

interface ActivitySimulatorProps {
  onSpeakText: (text: string) => void;
}

// Renders browser activity simulation buttons to trigger avatar reactions.
export const ActivitySimulator: React.FC<ActivitySimulatorProps> = ({ onSpeakText }) => {
  const triggerActivityReaction = (url: string) => {
    let speech = `Visiting ${url}?`;
    if (url.includes('youtube')) {
      speech = "Watching YouTube again? Don't forget your tasks!";
    } else if (url.includes('github') || url.includes('stackoverflow')) {
      speech = 'Ooh, writing code! You are locked in.';
    } else if (url.includes('facebook')) {
      speech = 'I thought you wanted to reduce social media usage?';
    }
    onSpeakText(speech);
  };

  return (
    <PanelSection
      id="section-activity"
      title="Simulate Browser Events"
      icon="🌐"
      bgVariant="activity"
    >
      <div className="activity-grid">
        <Button
          id="sim-youtube"
          variant="activity"
          onClick={() => triggerActivityReaction('youtube.com')}
        >
          <span className="activity-badge yt">YT</span> YouTube
        </Button>
        <Button
          id="sim-github"
          variant="activity"
          onClick={() => triggerActivityReaction('github.com')}
        >
          <span className="activity-badge gh">GH</span> GitHub
        </Button>
        <Button
          id="sim-social"
          variant="activity"
          onClick={() => triggerActivityReaction('facebook.com')}
        >
          <span className="activity-badge fb">FB</span> Social Media
        </Button>
        <Button
          id="sim-stackoverflow"
          variant="activity"
          onClick={() => triggerActivityReaction('stackoverflow.com')}
        >
          <span className="activity-badge so">SO</span> StackOverflow
        </Button>
      </div>
    </PanelSection>
  );
};
