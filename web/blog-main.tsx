import React from 'react';
import { createRoot } from 'react-dom/client';
import { BlogPage } from './pages/BlogPage';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <BlogPage />
    </React.StrictMode>
  );
}
