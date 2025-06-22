import React from 'react';
import { createRoot } from 'react-dom/client';
import SearchWindow from '../components/SearchWindow';
import './styles.css';

const container = document.getElementById('search-root');
if (!container) {
  throw new Error('Failed to find search-root element');
}

const root = createRoot(container);

// Theme detection
const theme = document.body.getAttribute('data-theme') as 'light' | 'dark' || 'light';

root.render(<SearchWindow theme={theme} />);