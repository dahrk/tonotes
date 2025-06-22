import React from 'react';
import { createRoot } from 'react-dom/client';
import AboutWindow from '../components/AboutWindow';

const container = document.getElementById('about-root');
if (!container) {
  throw new Error('Failed to find about-root element');
}

const root = createRoot(container);

root.render(<AboutWindow />);