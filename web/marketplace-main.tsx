import React from 'react';
import { createRoot } from 'react-dom/client';
import { MarketplacePage } from './pages/MarketplacePage';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <MarketplacePage />
    </React.StrictMode>
  );
}
