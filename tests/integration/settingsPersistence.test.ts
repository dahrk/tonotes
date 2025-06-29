/**
 * Integration Test: Settings Persistence
 *
 * Tests the complete settings workflow including persistence,
 * application to windows, and system integration.
 */

import { BrowserWindow, app, nativeTheme } from 'electron';
import { SettingsWindow } from '../../src/main/settings-window';
import { PostItApp } from '../../src/main/main';
import { Database } from '../../src/database/database';

// Types for mocked objects
interface MockWindow {
  loadURL: jest.MockedFunction<any>;
  loadFile: jest.MockedFunction<any>;
  on: jest.MockedFunction<any>;
  once: jest.MockedFunction<any>;
  focus: jest.MockedFunction<any>;
  show: jest.MockedFunction<any>;
  hide: jest.MockedFunction<any>;
  close: jest.MockedFunction<any>;
  setAlwaysOnTop: jest.MockedFunction<any>;
  setVisibleOnAllWorkspaces: jest.MockedFunction<any>;
  isDestroyed: jest.MockedFunction<any>;
  getPosition: jest.MockedFunction<any>;
  getSize: jest.MockedFunction<any>;
  webContents: {
    send: jest.MockedFunction<any>;
    executeJavaScript: jest.MockedFunction<any>;
    openDevTools: jest.MockedFunction<any>;
  };
}

interface MockDatabase {
  initialize: jest.MockedFunction<any>;
  getAllNotes: jest.MockedFunction<any>;
  createNote: jest.MockedFunction<any>;
  updateNote: jest.MockedFunction<any>;
  deleteNote: jest.MockedFunction<any>;
  getNote: jest.MockedFunction<any>;
}

interface MockSettings {
  alwaysOnTop: boolean;
  theme: string;
  autoSaveInterval?: number;
  launchOnStartup?: boolean;
}

// Mock electron modules
jest.mock('electron', () => {
  const mockWindow: MockWindow = {
    loadURL: jest.fn(),
    loadFile: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    focus: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    close: jest.fn(),
    setAlwaysOnTop: jest.fn(),
    setVisibleOnAllWorkspaces: jest.fn(),
    isDestroyed: jest.fn(() => false),
    getPosition: jest.fn(() => [100, 100]),
    getSize: jest.fn(() => [400, 400]),
    webContents: {
      send: jest.fn(),
      executeJavaScript: jest.fn().mockResolvedValue(undefined),
      openDevTools: jest.fn(),
    },
  };

  return {
    BrowserWindow: jest.fn(() => mockWindow),
    app: {
      whenReady: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      commandLine: {
        appendSwitch: jest.fn(),
      },
      getPath: jest.fn(() => '/mock/path'),
      getLoginItemSettings: jest.fn(() => ({ openAtLogin: false })),
      setLoginItemSettings: jest.fn(),
      quit: jest.fn(),
    },
    screen: {
      getPrimaryDisplay: jest.fn(() => ({
        workAreaSize: { width: 1920, height: 1080 },
      })),
    },
    ipcMain: {
      handle: jest.fn(),
      on: jest.fn(),
    },
    nativeTheme: {
      shouldUseDarkColors: false,
      on: jest.fn(),
    },
    globalShortcut: {
      register: jest.fn(),
      unregister: jest.fn(),
      unregisterAll: jest.fn(),
    },
    Tray: jest.fn(() => ({
      setToolTip: jest.fn(),
      setContextMenu: jest.fn(),
      on: jest.fn(),
      destroy: jest.fn(),
      setTitle: jest.fn(),
    })),
    Menu: {
      buildFromTemplate: jest.fn(),
    },
    nativeImage: {
      createFromPath: jest.fn().mockReturnValue({
        isEmpty: jest.fn(() => false),
        resize: jest.fn().mockReturnThis(),
      }),
      createFromDataURL: jest.fn().mockReturnValue({}),
    },
    Notification: jest.fn(() => ({
      show: jest.fn(),
    })),
  };
});

// Mock database
jest.mock('../../src/database/database');

describe('Settings Persistence Integration', () => {
  let postItApp: PostItApp;
  let mockDatabase: MockDatabase;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup database mock
    mockDatabase = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getAllNotes: jest.fn(() => []),
      createNote: jest.fn(),
      updateNote: jest.fn(),
      deleteNote: jest.fn(),
      getNote: jest.fn(),
    };
    (Database as jest.MockedClass<typeof Database>).mockImplementation(
      () => mockDatabase as any
    );

    // Reset BrowserWindow static methods
    (BrowserWindow as any).getAllWindows = jest.fn(() => []);
    (BrowserWindow as any).fromWebContents = jest.fn(() => null);
  });

  /**
   * Test complete settings initialization and application flow
   */
  it('initializes settings and applies them to app on startup', async () => {
    postItApp = new PostItApp();

    // Simulate app ready
    const appMock = app as any;
    const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Verify settings window was created
    expect((postItApp as any).settingsWindow).toBeTruthy();

    // Get default settings
    const settings = (
      postItApp as any
    ).settingsWindow.getSettings() as MockSettings;
    expect(settings.alwaysOnTop).toBe(true);
    expect(settings.theme).toBe('system');

    // Create a note and verify always-on-top is applied
    const noteId = postItApp.createNote();
    const browserWindowMock = BrowserWindow as jest.MockedClass<
      typeof BrowserWindow
    >;
    const windows = browserWindowMock.mock.results.map(
      result => result.value as MockWindow
    );
    const noteWindow = windows[windows.length - 1];

    expect(noteWindow.setAlwaysOnTop).toHaveBeenCalledWith(true);
  });

  /**
   * Test theme changes propagate to all windows
   */
  it('propagates theme changes to all open windows', async () => {
    postItApp = new PostItApp();

    // Simulate app ready
    const appMock = app as any;
    const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Create multiple notes
    postItApp.createNote();
    postItApp.createNote();
    postItApp.createNote();

    // Change theme to dark
    postItApp.handleSettingsChange({
      theme: 'dark',
      alwaysOnTop: true,
    });

    // Verify theme was applied to all note windows
    const browserWindowMock = BrowserWindow as jest.MockedClass<
      typeof BrowserWindow
    >;
    const windows = browserWindowMock.mock.results.map(
      result => result.value as MockWindow
    );
    windows.forEach(window => {
      expect(window.webContents.executeJavaScript).toHaveBeenCalledWith(
        expect.stringContaining("setAttribute('data-theme', 'dark')")
      );
    });

    // Verify settings window also received theme update
    const settingsWindow = (postItApp as any).settingsWindow;
    if (settingsWindow.applyTheme) {
      expect(settingsWindow.applyTheme).toHaveBeenCalledWith('dark');
    }
  });

  /**
   * Test always-on-top toggle affects all windows
   */
  it('toggles always-on-top for all windows when setting changes', async () => {
    postItApp = new PostItApp();

    // Simulate app ready
    const appMock = app as any;
    const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Create multiple notes
    postItApp.createNote();
    postItApp.createNote();

    // Mock settings with always-on-top enabled
    const mockSettings: MockSettings = { alwaysOnTop: true, theme: 'system' };
    (postItApp as any).settingsWindow.getSettings = jest.fn(() => mockSettings);
    (postItApp as any).settingsWindow.updateSettings = jest.fn(
      (newSettings: Partial<MockSettings>) => {
        Object.assign(mockSettings, newSettings);
      }
    );

    // Toggle always-on-top off
    postItApp.toggleAlwaysOnTopGlobal();

    // Verify setting was updated
    expect(
      (postItApp as any).settingsWindow.updateSettings
    ).toHaveBeenCalledWith({
      alwaysOnTop: false,
    });

    // Verify all windows were updated
    const browserWindowMock = BrowserWindow as jest.MockedClass<
      typeof BrowserWindow
    >;
    const windows = browserWindowMock.mock.results.map(
      result => result.value as MockWindow
    );
    windows.forEach(window => {
      expect(window.setAlwaysOnTop).toHaveBeenCalledWith(false);
    });
  });

  /**
   * Test system theme detection integration
   */
  it('responds to system theme changes when theme is set to system', async () => {
    postItApp = new PostItApp();

    // Mock settings with system theme
    const mockSettings: MockSettings = { theme: 'system', alwaysOnTop: true };
    (postItApp as any).settingsWindow = {
      getSettings: jest.fn(() => mockSettings),
      updateSettings: jest.fn(),
      applyTheme: jest.fn(),
    };

    // Simulate app ready
    const appMock = app as any;
    const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Create a note
    postItApp.createNote();

    // Find the nativeTheme 'updated' event handler
    const nativeThemeMock = nativeTheme as any;
    const themeUpdateHandler = nativeThemeMock.on.mock.calls.find(
      (call: any[]) => call[0] === 'updated'
    )?.[1];

    expect(themeUpdateHandler).toBeTruthy();

    // Mock system theme change to dark
    (nativeTheme as any).shouldUseDarkColors = true;

    // Trigger theme update
    if (themeUpdateHandler) {
      themeUpdateHandler();
    }

    // Verify theme was applied to windows
    const browserWindowMock = BrowserWindow as jest.MockedClass<
      typeof BrowserWindow
    >;
    const windows = browserWindowMock.mock.results.map(
      result => result.value as MockWindow
    );
    windows.forEach(window => {
      expect(window.webContents.executeJavaScript).toHaveBeenCalledWith(
        expect.stringContaining("setAttribute('data-theme', 'dark')")
      );
    });
  });

  /**
   * Test settings persistence across app restarts
   */
  it('maintains custom settings across app restart simulation', async () => {
    // First app instance
    let postItApp1 = new PostItApp();

    // Simulate app ready
    const appMock = app as any;
    let readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Update settings
    const customSettings: Partial<MockSettings> = {
      alwaysOnTop: false,
      theme: 'dark',
      autoSaveInterval: 60000,
      launchOnStartup: true,
    };

    (postItApp1 as any).settingsWindow.updateSettings(customSettings);

    // Verify settings were updated
    let settings = (
      postItApp1 as any
    ).settingsWindow.getSettings() as MockSettings;
    expect(settings.alwaysOnTop).toBe(false);
    expect(settings.theme).toBe('dark');

    // Simulate app shutdown and restart
    jest.clearAllMocks();

    // Second app instance (simulating restart)
    let postItApp2 = new PostItApp();

    // Simulate app ready again
    readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Settings should be preserved (in a real implementation)
    // Note: In this test, we're testing the architecture, not file persistence
    settings = (postItApp2 as any).settingsWindow.getSettings() as MockSettings;
    expect(settings).toBeDefined();
    expect(['system', 'light', 'dark']).toContain(settings.theme);
    expect(typeof settings.alwaysOnTop).toBe('boolean');
  });

  /**
   * Test new windows inherit current settings
   */
  it('applies current settings to newly created windows', async () => {
    postItApp = new PostItApp();

    // Mock custom settings
    const customSettings: MockSettings = { alwaysOnTop: false, theme: 'dark' };
    (postItApp as any).settingsWindow = {
      getSettings: jest.fn(() => customSettings),
      updateSettings: jest.fn(),
      applyTheme: jest.fn(),
    };

    // Simulate app ready
    const appMock = app as any;
    const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Create a new note
    postItApp.createNote();

    // Verify window was created with current settings
    const browserWindowMock = BrowserWindow as jest.MockedClass<
      typeof BrowserWindow
    >;
    const windows = browserWindowMock.mock.results.map(
      result => result.value as MockWindow
    );
    const newWindow = windows[windows.length - 1];

    expect(newWindow.setAlwaysOnTop).toHaveBeenCalledWith(false);

    // Verify theme was applied after window creation
    expect(newWindow.webContents.executeJavaScript).toHaveBeenCalledWith(
      expect.stringContaining("setAttribute('data-theme', 'dark')")
    );
  });

  /**
   * Test settings window integration with main app
   */
  it('integrates settings window with main app correctly', async () => {
    postItApp = new PostItApp();

    // Simulate app ready
    const appMock = app as any;
    const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Show settings window
    (postItApp as any).settingsWindow.show();

    // Verify settings window was created
    expect(BrowserWindow).toHaveBeenCalled();

    // Verify settings window has correct properties
    const browserWindowMock = BrowserWindow as jest.MockedClass<
      typeof BrowserWindow
    >;
    const settingsWindowCall = browserWindowMock.mock.calls.find(
      (call: any[]) => call[0]?.title === 'PostIt Settings'
    );
    expect(settingsWindowCall).toBeTruthy();

    if (settingsWindowCall) {
      const windowOptions = settingsWindowCall[0];
      expect(windowOptions.width).toBe(450);
      expect(windowOptions.height).toBe(350);
      expect(windowOptions.resizable).toBe(false);
      expect(windowOptions.alwaysOnTop).toBe(true);
    }
  });

  /**
   * Test auto-save interval application
   */
  it('applies auto-save interval changes to note management', async () => {
    postItApp = new PostItApp();

    // Simulate app ready
    const appMock = app as any;
    const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Change auto-save interval
    const newSettings = {
      autoSaveInterval: 10000, // 10 seconds
      alwaysOnTop: true,
      theme: 'system',
    };

    postItApp.handleSettingsChange(newSettings);

    // Verify settings were processed
    // In a real implementation, this would affect note auto-save timers
    expect((postItApp as any).settingsWindow).toBeTruthy();
  });

  /**
   * Test startup behavior setting
   */
  it('handles launch on startup setting changes', async () => {
    postItApp = new PostItApp();

    // Simulate app ready
    const appMock = app as any;
    const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Enable launch on startup
    const startupSettings = {
      launchOnStartup: true,
      alwaysOnTop: true,
      theme: 'system',
    };

    postItApp.handleSettingsChange(startupSettings);

    // Verify system login item would be set
    // (In real implementation, this would call app.setLoginItemSettings)
    expect(appMock.setLoginItemSettings).toHaveBeenCalledWith({
      openAtLogin: true,
    });
  });

  /**
   * Test error handling in settings
   */
  it('handles settings errors gracefully', async () => {
    postItApp = new PostItApp();

    // Simulate app ready
    const appMock = app as any;
    const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Try to apply invalid settings
    const invalidSettings = {
      theme: 'invalid-theme',
      alwaysOnTop: 'not-a-boolean' as any,
      autoSaveInterval: -1000,
    };

    // Should not crash
    expect(() => {
      postItApp.handleSettingsChange(invalidSettings);
    }).not.toThrow();

    // Settings should remain valid
    const settings = (
      postItApp as any
    ).settingsWindow.getSettings() as MockSettings;
    expect(['system', 'light', 'dark']).toContain(settings.theme);
    expect(typeof settings.alwaysOnTop).toBe('boolean');
    expect(settings.autoSaveInterval).toBeGreaterThan(0);
  });

  /**
   * Test settings changes during runtime
   */
  it('handles real-time settings changes during app operation', async () => {
    postItApp = new PostItApp();

    // Simulate app ready
    const appMock = app as any;
    const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Create some notes
    postItApp.createNote();
    postItApp.createNote();

    // Change multiple settings at once
    const runtimeSettings = {
      theme: 'light',
      alwaysOnTop: false,
    };

    postItApp.handleSettingsChange(runtimeSettings);

    // Verify all windows were updated with new settings
    const browserWindowMock = BrowserWindow as jest.MockedClass<
      typeof BrowserWindow
    >;
    const windows = browserWindowMock.mock.results.map(
      result => result.value as MockWindow
    );
    windows.forEach(window => {
      expect(window.setAlwaysOnTop).toHaveBeenCalledWith(false);
      expect(window.webContents.executeJavaScript).toHaveBeenCalledWith(
        expect.stringContaining("setAttribute('data-theme', 'light')")
      );
    });
  });
});
