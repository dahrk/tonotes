// Jest DOM matchers
import '@testing-library/jest-dom';

// Mock Electron using Jest's built-in mocking capabilities
// No external library needed - Jest handles all mocking

// Create global electron mock
(global as any).electron = {};
(global as any).electron.app = {
  getVersion: () => '1.0.0',
  getName: () => 'Sticky Notes',
  getPath: (name: string) => `/mock/path/${name}`,
  quit: jest.fn(),
  on: jest.fn(),
  whenReady: jest.fn().mockResolvedValue(undefined),
};

(global as any).electron.ipcRenderer = {
  invoke: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  send: jest.fn(),
};

(global as any).electron.ipcMain = {
  handle: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

// Mock window.electronAPI
Object.defineProperty(global, 'window', {
  value: {
    electronAPI: {
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
    },
  },
  writable: true,
});

// Mock ResizeObserver
(global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
(global as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (args[0] && args[0].includes('componentWillReceiveProps')) {
    return;
  }
  originalWarn(...args);
};
