import React from 'react';
import { createRoot } from 'react-dom/client';
import { PlaygroundPage } from './pages/PlaygroundPage';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <PlaygroundPage />
    </React.StrictMode>
  );
}
