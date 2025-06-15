// Jest DOM matchers
import '@testing-library/jest-dom';

// Mock Electron
const electron = require('electron');
electron.app = {
  getVersion: () => '1.0.0',
  getName: () => 'Sticky Notes',
  getPath: (name) => `/mock/path/${name}`,
  quit: jest.fn(),
  on: jest.fn(),
  when: jest.fn(),
};

electron.ipcRenderer = {
  invoke: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  send: jest.fn(),
};

electron.ipcMain = {
  handle: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

// Mock window.electronAPI
global.window.electronAPI = {
  notes: {
    getAll: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  },
  search: {
    searchNotes: jest.fn(),
  },
  settings: {
    get: jest.fn(),
    set: jest.fn(),
  },
  window: {
    close: jest.fn(),
    minimize: jest.fn(),
    setAlwaysOnTop: jest.fn(),
  },
  theme: {
    toggle: jest.fn(),
    set: jest.fn(),
  },
};

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && args[0].includes('componentWillReceiveProps')) {
    return;
  }
  originalWarn(...args);
};