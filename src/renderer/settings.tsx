import React from 'react';
import { createRoot } from 'react-dom/client';
import SettingsWindow from '../components/SettingsWindow';
import './styles.css';

const container = document.getElementById('settings-root');
if (!container) {
  throw new Error('Failed to find settings-root element');
}

const root = createRoot(container);

// Theme detection
const theme = document.body.getAttribute('data-theme') as 'light' | 'dark' || 'light';

root.render(<SettingsWindow theme={theme} />);