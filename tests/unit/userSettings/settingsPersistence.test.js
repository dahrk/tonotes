/**
 * Test Suite: User Settings Persistence
 *
 * Verifies that user preferences are saved and applied correctly
 * across app restarts and that settings changes propagate properly.
 */

import { BrowserWindow, screen } from 'electron';
import { SettingsWindow } from '../../../src/main/settings-window';

// Mock electron modules
jest.mock('electron', () => ({
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadURL: jest.fn(),
    on: jest.fn(),
    focus: jest.fn(),
    show: jest.fn(),
    isDestroyed: jest.fn(() => false),
    webContents: {
      send: jest.fn(),
      executeJavaScript: jest.fn(),
    },
  })),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
  },
  screen: {
    getPrimaryDisplay: jest.fn(() => ({
      workAreaSize: { width: 1920, height: 1080 },
    })),
  },
  app: {
    getLoginItemSettings: jest.fn(() => ({ openAtLogin: false })),
    setLoginItemSettings: jest.fn(),
  },
}));

describe('Settings Persistence', () => {
  let settingsWindow;
  let mockWindow;

  beforeEach(() => {
    jest.clearAllMocks();

    mockWindow = {
      loadURL: jest.fn(),
      on: jest.fn(),
      focus: jest.fn(),
      show: jest.fn(),
      isDestroyed: jest.fn(() => false),
      webContents: {
        send: jest.fn(),
        executeJavaScript: jest.fn(),
      },
    };
    BrowserWindow.mockImplementation(() => mockWindow);

    settingsWindow = new SettingsWindow();
  });

  /**
   * Test default settings initialization
   */
  describe('Default Settings', () => {
    it('initializes with correct default settings', () => {
      const settings = settingsWindow.getSettings();

      expect(settings).toEqual({
        launchOnStartup: false,
        theme: 'system',
        autoSaveInterval: 30000,
        alwaysOnTop: true,
      });
    });

    it('validates settings values on initialization', () => {
      const settings = settingsWindow.getSettings();

      // Validate types
      expect(typeof settings.launchOnStartup).toBe('boolean');
      expect(typeof settings.theme).toBe('string');
      expect(typeof settings.autoSaveInterval).toBe('number');
      expect(typeof settings.alwaysOnTop).toBe('boolean');

      // Validate ranges
      expect(settings.autoSaveInterval).toBeGreaterThan(0);
      expect(['system', 'light', 'dark']).toContain(settings.theme);
    });
  });

  /**
   * Test individual setting updates
   */
  describe('Individual Setting Updates', () => {
    it('saves and restores always-on-top preference', () => {
      // Update always-on-top setting
      settingsWindow.updateSettings({ alwaysOnTop: false });

      // Verify setting was updated
      const settings = settingsWindow.getSettings();
      expect(settings.alwaysOnTop).toBe(false);

      // Update back to true
      settingsWindow.updateSettings({ alwaysOnTop: true });
      expect(settingsWindow.getSettings().alwaysOnTop).toBe(true);
    });

    it('saves and restores theme preference', () => {
      // Test each theme option
      const themes = ['light', 'dark', 'system'];

      themes.forEach(theme => {
        settingsWindow.updateSettings({ theme });
        expect(settingsWindow.getSettings().theme).toBe(theme);
      });
    });

    it('saves and restores auto-save interval', () => {
      // Test different intervals
      const intervals = [10000, 30000, 60000, 120000];

      intervals.forEach(interval => {
        settingsWindow.updateSettings({ autoSaveInterval: interval });
        expect(settingsWindow.getSettings().autoSaveInterval).toBe(interval);
      });
    });

    it('saves and restores launch on startup preference', () => {
      // Test startup setting
      settingsWindow.updateSettings({ launchOnStartup: true });
      expect(settingsWindow.getSettings().launchOnStartup).toBe(true);

      settingsWindow.updateSettings({ launchOnStartup: false });
      expect(settingsWindow.getSettings().launchOnStartup).toBe(false);
    });
  });

  /**
   * Test bulk settings updates
   */
  describe('Bulk Settings Updates', () => {
    it('updates multiple settings atomically', () => {
      const newSettings = {
        alwaysOnTop: false,
        theme: 'dark',
        autoSaveInterval: 60000,
        launchOnStartup: true,
      };

      settingsWindow.updateSettings(newSettings);

      const savedSettings = settingsWindow.getSettings();
      expect(savedSettings.alwaysOnTop).toBe(false);
      expect(savedSettings.theme).toBe('dark');
      expect(savedSettings.autoSaveInterval).toBe(60000);
      expect(savedSettings.launchOnStartup).toBe(true);
    });

    it('partially updates settings without affecting others', () => {
      // Set initial state
      settingsWindow.updateSettings({
        alwaysOnTop: false,
        theme: 'dark',
      });

      // Partially update
      settingsWindow.updateSettings({
        theme: 'light',
      });

      const settings = settingsWindow.getSettings();
      expect(settings.theme).toBe('light');
      expect(settings.alwaysOnTop).toBe(false); // Should remain unchanged
      expect(settings.autoSaveInterval).toBe(30000); // Should remain default
    });
  });

  /**
   * Test settings validation
   */
  describe('Settings Validation', () => {
    it('rejects invalid theme values', () => {
      const initialTheme = settingsWindow.getSettings().theme;

      // Try to set invalid theme
      settingsWindow.updateSettings({ theme: 'invalid-theme' });

      // Theme should remain unchanged
      expect(settingsWindow.getSettings().theme).toBe(initialTheme);
    });

    it('rejects invalid auto-save intervals', () => {
      const initialInterval = settingsWindow.getSettings().autoSaveInterval;

      // Try invalid intervals
      const invalidIntervals = [-1000, 0, 'not-a-number', null];

      invalidIntervals.forEach(interval => {
        settingsWindow.updateSettings({ autoSaveInterval: interval });
        expect(settingsWindow.getSettings().autoSaveInterval).toBe(
          initialInterval
        );
      });
    });

    it('rejects non-boolean values for boolean settings', () => {
      const initialSettings = settingsWindow.getSettings();

      // Try invalid boolean values
      const invalidValues = ['true', 1, 0, null, undefined];

      invalidValues.forEach(value => {
        settingsWindow.updateSettings({ alwaysOnTop: value });
        expect(settingsWindow.getSettings().alwaysOnTop).toBe(
          initialSettings.alwaysOnTop
        );

        settingsWindow.updateSettings({ launchOnStartup: value });
        expect(settingsWindow.getSettings().launchOnStartup).toBe(
          initialSettings.launchOnStartup
        );
      });
    });
  });

  /**
   * Test window position restoration
   */
  describe('Window Position Management', () => {
    it('creates settings window at center of screen', () => {
      settingsWindow.show();

      // Verify window was created
      expect(BrowserWindow).toHaveBeenCalled();

      // Verify window options
      const windowOptions = BrowserWindow.mock.calls[0][0];
      expect(windowOptions.width).toBe(450);
      expect(windowOptions.height).toBe(350);

      // Verify centered position calculation
      const screenWidth = 1920;
      const screenHeight = 1080;
      const expectedX = Math.floor((screenWidth - 450) / 2);
      const expectedY = Math.floor((screenHeight - 350) / 2);

      expect(windowOptions.x).toBe(expectedX);
      expect(windowOptions.y).toBe(expectedY);
    });

    it('focuses existing window instead of creating new one', () => {
      // Show window first time
      settingsWindow.show();
      expect(BrowserWindow).toHaveBeenCalledTimes(1);

      // Show window second time
      settingsWindow.show();

      // Should not create new window
      expect(BrowserWindow).toHaveBeenCalledTimes(1);

      // Should focus existing window
      expect(mockWindow.focus).toHaveBeenCalled();
      expect(mockWindow.show).toHaveBeenCalled();
    });

    it('creates new window if previous was destroyed', () => {
      // Show window first time
      settingsWindow.show();
      expect(BrowserWindow).toHaveBeenCalledTimes(1);

      // Mock window as destroyed
      mockWindow.isDestroyed.mockReturnValue(true);

      // Show window again
      settingsWindow.show();

      // Should create new window
      expect(BrowserWindow).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * Test theme application
   */
  describe('Theme Application', () => {
    it('applies theme to settings window', () => {
      settingsWindow.show();

      // Apply light theme
      settingsWindow.applyTheme('light');
      expect(mockWindow.webContents.executeJavaScript).toHaveBeenCalledWith(
        "document.documentElement.setAttribute('data-theme', 'light');"
      );

      // Apply dark theme
      settingsWindow.applyTheme('dark');
      expect(mockWindow.webContents.executeJavaScript).toHaveBeenCalledWith(
        "document.documentElement.setAttribute('data-theme', 'dark');"
      );
    });

    it('handles theme application when window does not exist', () => {
      // Don't create window, just try to apply theme
      settingsWindow.applyTheme('dark');

      // Should not crash and no calls should be made
      expect(mockWindow.webContents.executeJavaScript).not.toHaveBeenCalled();
    });

    it('handles theme application when window is destroyed', () => {
      settingsWindow.show();

      // Mock window as destroyed
      mockWindow.isDestroyed.mockReturnValue(true);

      // Try to apply theme
      settingsWindow.applyTheme('dark');

      // Should not crash and no calls should be made to destroyed window
      expect(mockWindow.webContents.executeJavaScript).not.toHaveBeenCalled();
    });
  });

  /**
   * Test settings persistence across window recreation
   */
  describe('Settings Persistence Across Window Recreation', () => {
    it('maintains settings when window is recreated', () => {
      // Update settings
      const customSettings = {
        alwaysOnTop: false,
        theme: 'dark',
        autoSaveInterval: 60000,
        launchOnStartup: true,
      };
      settingsWindow.updateSettings(customSettings);

      // Show window first time
      settingsWindow.show();

      // Simulate window close
      const closeHandler = mockWindow.on.mock.calls.find(
        call => call[0] === 'closed'
      )?.[1];
      if (closeHandler) {
        closeHandler();
      }

      // Mock window as destroyed
      mockWindow.isDestroyed.mockReturnValue(true);

      // Show window again (should recreate)
      settingsWindow.show();

      // Settings should still be preserved
      const preservedSettings = settingsWindow.getSettings();
      expect(preservedSettings.alwaysOnTop).toBe(false);
      expect(preservedSettings.theme).toBe('dark');
      expect(preservedSettings.autoSaveInterval).toBe(60000);
      expect(preservedSettings.launchOnStartup).toBe(true);
    });
  });

  /**
   * Test settings HTML generation
   */
  describe('Settings UI Generation', () => {
    it('generates valid HTML for settings interface', () => {
      settingsWindow.show();

      // Verify loadURL was called with HTML content
      expect(mockWindow.loadURL).toHaveBeenCalled();

      const loadURLCall = mockWindow.loadURL.mock.calls[0][0];
      expect(loadURLCall).toMatch(/^data:text\/html;charset=utf-8,/);

      // Decode and check HTML content
      const htmlContent = decodeURIComponent(
        loadURLCall.replace('data:text/html;charset=utf-8,', '')
      );
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<title>Settings</title>');
      expect(htmlContent).toContain('data-theme');
    });
  });

  /**
   * Test window cleanup
   */
  describe('Window Cleanup', () => {
    it('cleans up window reference on close', () => {
      settingsWindow.show();

      // Find the 'closed' event handler
      const closedHandler = mockWindow.on.mock.calls.find(
        call => call[0] === 'closed'
      )?.[1];

      expect(closedHandler).toBeTruthy();

      // Simulate window close
      closedHandler();

      // Window reference should be cleaned up
      // We can test this by showing again and verifying new window is created
      settingsWindow.show();
      expect(BrowserWindow).toHaveBeenCalledTimes(2);
    });

    it('properly destroys window on app shutdown', () => {
      settingsWindow.show();

      // Call destroy method
      settingsWindow.destroy();

      // Window should be closed if it exists
      expect(mockWindow.close || mockWindow.destroy).toHaveBeenCalled();
    });
  });
});
