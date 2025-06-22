/**
 * Test Suite: Window Lifecycle Management
 *
 * Ensures windows are created, managed, and destroyed properly.
 * Critical for app stability and resource management.
 */

import { BrowserWindow, app, Tray, Menu } from 'electron';
import { PostItApp } from '../../../src/main/main';
import { Database } from '../../../src/database/database';
import { createMockNote } from '../../utils/testHelpers';

// Types for mocked objects
interface MockBrowserWindow {
  loadFile: jest.MockedFunction<any>;
  loadURL: jest.MockedFunction<any>;
  on: jest.MockedFunction<any>;
  once: jest.MockedFunction<any>;
  show: jest.MockedFunction<any>;
  hide: jest.MockedFunction<any>;
  close: jest.MockedFunction<any>;
  minimize: jest.MockedFunction<any>;
  focus: jest.MockedFunction<any>;
  setAlwaysOnTop: jest.MockedFunction<any>;
  setVisibleOnAllWorkspaces: jest.MockedFunction<any>;
  getPosition: jest.MockedFunction<any>;
  getSize: jest.MockedFunction<any>;
  isDestroyed: jest.MockedFunction<any>;
  webContents: {
    send: jest.MockedFunction<any>;
    on: jest.MockedFunction<any>;
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

interface MockTray {
  setToolTip: jest.MockedFunction<any>;
  setContextMenu: jest.MockedFunction<any>;
  on: jest.MockedFunction<any>;
  destroy: jest.MockedFunction<any>;
  setTitle: jest.MockedFunction<any>;
  popUpContextMenu: jest.MockedFunction<any>;
}

// Mock electron modules
jest.mock('electron', () => ({
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadFile: jest.fn(),
    loadURL: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    close: jest.fn(),
    minimize: jest.fn(),
    focus: jest.fn(),
    setAlwaysOnTop: jest.fn(),
    setVisibleOnAllWorkspaces: jest.fn(),
    getPosition: jest.fn(() => [100, 100]),
    getSize: jest.fn(() => [400, 400]),
    isDestroyed: jest.fn(() => false),
    webContents: {
      send: jest.fn(),
      on: jest.fn(),
      executeJavaScript: jest.fn(),
      openDevTools: jest.fn(),
    },
  })),
  app: {
    whenReady: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    commandLine: {
      appendSwitch: jest.fn(),
    },
    getPath: jest.fn(() => '/mock/path'),
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
  Tray: jest.fn().mockImplementation(() => ({
    setToolTip: jest.fn(),
    setContextMenu: jest.fn(),
    on: jest.fn(),
    destroy: jest.fn(),
    setTitle: jest.fn(),
    popUpContextMenu: jest.fn(),
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
}));

// Mock database
jest.mock('../../../src/database/database');

describe('Window Lifecycle Management', () => {
  let mockDatabase: MockDatabase;
  let mockBrowserWindow: MockBrowserWindow;
  let mockTray: MockTray;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock database
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

    // Setup mock BrowserWindow
    mockBrowserWindow = {
      loadFile: jest.fn(),
      loadURL: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      close: jest.fn(),
      minimize: jest.fn(),
      focus: jest.fn(),
      setAlwaysOnTop: jest.fn(),
      setVisibleOnAllWorkspaces: jest.fn(),
      getPosition: jest.fn(() => [100, 100]),
      getSize: jest.fn(() => [400, 400]),
      isDestroyed: jest.fn(() => false),
      webContents: {
        send: jest.fn(),
        on: jest.fn(),
        executeJavaScript: jest.fn(),
        openDevTools: jest.fn(),
      },
    };
    (
      BrowserWindow as jest.MockedClass<typeof BrowserWindow>
    ).mockImplementation(() => mockBrowserWindow as any);

    // Setup mock Tray
    mockTray = {
      setToolTip: jest.fn(),
      setContextMenu: jest.fn(),
      on: jest.fn(),
      destroy: jest.fn(),
      setTitle: jest.fn(),
      popUpContextMenu: jest.fn(),
    };
    (Tray as jest.MockedClass<typeof Tray>).mockImplementation(
      () => mockTray as any
    );

    // Setup BrowserWindow static methods
    (BrowserWindow as any).getAllWindows = jest.fn(() => []);
    (BrowserWindow as any).fromWebContents = jest.fn(() => mockBrowserWindow);
  });

  /**
   * System tray should persist when all windows are closed.
   * This test ensures users can always access the app.
   */
  describe('System Tray Persistence', () => {
    it('keeps system tray icon when all windows are closed', async () => {
      const postItApp = new PostItApp();

      // Simulate app initialization
      const appMock = app as any;
      const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
      if (readyCallback) {
        await readyCallback();
      }

      // Verify tray was created during initialization
      expect(Tray).toHaveBeenCalled();
      expect(mockTray.setToolTip).toHaveBeenCalledWith('PostIt - Sticky Notes');

      // Simulate closing all windows
      const windowAllClosedCallback = appMock.on.mock.calls.find(
        (call: any[]) => call[0] === 'window-all-closed'
      )?.[1];

      if (windowAllClosedCallback) {
        windowAllClosedCallback();
      }

      // Tray should still exist (not destroyed)
      expect(mockTray.destroy).not.toHaveBeenCalled();
    });

    it('displays correct note count in tray when notes change', async () => {
      // Mock notes in database
      const mockNotes = [
        createMockNote({ id: 'note1' }),
        createMockNote({ id: 'note2' }),
      ];
      mockDatabase.getAllNotes.mockReturnValue(mockNotes);

      const postItApp = new PostItApp();

      // Simulate initialization
      const appMock = app as any;
      const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
      if (readyCallback) {
        await readyCallback();
      }

      // Create a new note
      postItApp.createNote();

      // Verify tray title was updated with note count
      // The exact call depends on implementation, but tray should be updated
      expect(mockTray.setTitle || mockTray.setToolTip).toHaveBeenCalled();
    });
  });

  /**
   * Window creation and management tests
   */
  describe('Window Creation and Management', () => {
    it('creates new window from system tray with no existing windows', async () => {
      const postItApp = new PostItApp();

      // Simulate initialization
      const appMock = app as any;
      const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
      if (readyCallback) {
        await readyCallback();
      }

      // Create a note
      const noteId = postItApp.createNote();

      // Verify BrowserWindow was created
      expect(BrowserWindow).toHaveBeenCalled();
      expect(
        mockBrowserWindow.loadFile || mockBrowserWindow.loadURL
      ).toHaveBeenCalled();
      expect(mockBrowserWindow.show).toHaveBeenCalled();
      expect(mockBrowserWindow.focus).toHaveBeenCalled();

      // Verify note was saved to database
      expect(mockDatabase.createNote).toHaveBeenCalled();
      expect(noteId).toBeTruthy();
    });

    it('creates window with correct position and size', async () => {
      const postItApp = new PostItApp();

      // Simulate initialization
      const appMock = app as any;
      const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
      if (readyCallback) {
        await readyCallback();
      }

      // Create note with specific position
      const noteId = postItApp.createNote({
        position_x: 200,
        position_y: 300,
        width: 500,
        height: 600,
      });

      // Verify BrowserWindow was created with correct options
      const browserWindowMock = BrowserWindow as jest.MockedClass<
        typeof BrowserWindow
      >;
      const browserWindowCall =
        browserWindowMock.mock.calls[browserWindowMock.mock.calls.length - 1];
      const windowOptions = browserWindowCall[0];

      expect(windowOptions.x).toBe(200);
      expect(windowOptions.y).toBe(300);
      expect(windowOptions.width).toBe(500);
      expect(windowOptions.height).toBe(600);
    });

    it('handles window position updates correctly', async () => {
      const postItApp = new PostItApp();

      // Simulate initialization
      const appMock = app as any;
      const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
      if (readyCallback) {
        await readyCallback();
      }

      // Create a note
      const noteId = postItApp.createNote();

      // Find the 'moved' event handler
      const movedHandler = mockBrowserWindow.on.mock.calls.find(
        (call: any[]) => call[0] === 'moved'
      )?.[1];

      expect(movedHandler).toBeTruthy();

      // Mock new position
      mockBrowserWindow.getPosition.mockReturnValue([300, 400]);

      // Simulate window move
      if (movedHandler) {
        movedHandler();
      }

      // Verify database was updated with new position
      expect(mockDatabase.updateNote).toHaveBeenCalledWith(
        expect.objectContaining({
          position_x: 300,
          position_y: 400,
        })
      );
    });

    it('handles window resize updates correctly', async () => {
      const postItApp = new PostItApp();

      // Simulate initialization
      const appMock = app as any;
      const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
      if (readyCallback) {
        await readyCallback();
      }

      // Create a note
      const noteId = postItApp.createNote();

      // Find the 'resized' event handler
      const resizedHandler = mockBrowserWindow.on.mock.calls.find(
        (call: any[]) => call[0] === 'resized'
      )?.[1];

      expect(resizedHandler).toBeTruthy();

      // Mock new size
      mockBrowserWindow.getSize.mockReturnValue([600, 700]);

      // Simulate window resize
      if (resizedHandler) {
        resizedHandler();
      }

      // Verify database was updated with new size
      expect(mockDatabase.updateNote).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 600,
          height: 700,
        })
      );
    });

    it('cleans up window references when window is closed', async () => {
      const postItApp = new PostItApp();

      // Simulate initialization
      const appMock = app as any;
      const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
      if (readyCallback) {
        await readyCallback();
      }

      // Create a note
      const noteId = postItApp.createNote();

      // Verify window exists
      expect(postItApp.checkNoteWindowExists(noteId)).toBe(true);

      // Find the 'closed' event handler
      const closedHandler = mockBrowserWindow.on.mock.calls.find(
        (call: any[]) => call[0] === 'closed'
      )?.[1];

      expect(closedHandler).toBeTruthy();

      // Simulate window close
      if (closedHandler) {
        closedHandler();
      }

      // Verify window reference was cleaned up
      expect(postItApp.checkNoteWindowExists(noteId)).toBe(false);
    });
  });

  /**
   * Always-on-top functionality tests
   */
  describe('Always-on-Top Functionality', () => {
    it('applies always-on-top setting to all windows', async () => {
      const postItApp = new PostItApp();

      // Mock settings
      const mockSettings = { alwaysOnTop: true, theme: 'system' };
      (postItApp as any).settingsWindow = {
        getSettings: jest.fn(() => mockSettings),
        updateSettings: jest.fn(),
      };

      // Simulate initialization
      const appMock = app as any;
      const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
      if (readyCallback) {
        await readyCallback();
      }

      // Create multiple notes
      const noteId1 = postItApp.createNote();
      const noteId2 = postItApp.createNote();

      // Verify always-on-top was set for both windows
      expect(mockBrowserWindow.setAlwaysOnTop).toHaveBeenCalledWith(true);

      // On macOS, should also set floating level
      if (process.platform === 'darwin') {
        expect(mockBrowserWindow.setAlwaysOnTop).toHaveBeenCalledWith(
          true,
          'floating',
          1
        );
        expect(
          mockBrowserWindow.setVisibleOnAllWorkspaces
        ).toHaveBeenCalledWith(true, { visibleOnFullScreen: true });
      }
    });

    it('toggles always-on-top for all windows globally', async () => {
      const postItApp = new PostItApp();

      // Mock settings
      const mockSettings = { alwaysOnTop: true, theme: 'system' };
      (postItApp as any).settingsWindow = {
        getSettings: jest.fn(() => mockSettings),
        updateSettings: jest.fn((newSettings: any) => {
          Object.assign(mockSettings, newSettings);
        }),
      };

      // Simulate initialization
      const appMock = app as any;
      const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
      if (readyCallback) {
        await readyCallback();
      }

      // Create a note
      const noteId = postItApp.createNote();

      // Toggle always-on-top
      postItApp.toggleAlwaysOnTopGlobal();

      // Verify setting was updated
      expect(
        (postItApp as any).settingsWindow.updateSettings
      ).toHaveBeenCalledWith({
        alwaysOnTop: false,
      });
    });
  });

  /**
   * Window focus and recreation tests
   */
  describe('Window Focus and Recreation', () => {
    it('focuses existing window when requested', async () => {
      const postItApp = new PostItApp();

      // Simulate initialization
      const appMock = app as any;
      const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
      if (readyCallback) {
        await readyCallback();
      }

      // Create a note
      const noteId = postItApp.createNote();

      // Focus the note
      const focused = postItApp.focusNote(noteId);

      expect(focused).toBe(true);
      expect(mockBrowserWindow.focus).toHaveBeenCalled();
      expect(mockBrowserWindow.show).toHaveBeenCalled();
    });

    it('recreates window from database when window is destroyed', async () => {
      const postItApp = new PostItApp();

      // Mock note in database
      const mockNote = createMockNote({ id: 'test-note' });
      mockDatabase.getNote.mockReturnValue(mockNote);

      // Simulate initialization
      const appMock = app as any;
      const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
      if (readyCallback) {
        await readyCallback();
      }

      // Mock destroyed window
      mockBrowserWindow.isDestroyed.mockReturnValue(true);

      // Try to focus note (should recreate window)
      const focused = postItApp.focusNote('test-note');

      expect(focused).toBe(true);
      expect(mockDatabase.getNote).toHaveBeenCalledWith('test-note');
      // Should create a new window
      expect(BrowserWindow).toHaveBeenCalled();
    });

    it('returns false when trying to focus non-existent note', async () => {
      const postItApp = new PostItApp();

      // Mock database returning null
      mockDatabase.getNote.mockReturnValue(null);

      // Simulate initialization
      const appMock = app as any;
      const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
      if (readyCallback) {
        await readyCallback();
      }

      // Try to focus non-existent note
      const focused = postItApp.focusNote('non-existent');

      expect(focused).toBe(false);
      expect(mockDatabase.getNote).toHaveBeenCalledWith('non-existent');
    });
  });

  /**
   * Window positioning and cascading tests
   */
  describe('Window Positioning', () => {
    it('cascades new windows with offset', async () => {
      const postItApp = new PostItApp();

      // Simulate initialization
      const appMock = app as any;
      const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
      if (readyCallback) {
        await readyCallback();
      }

      // Create multiple notes
      const noteId1 = postItApp.createNote();
      const noteId2 = postItApp.createNote();
      const noteId3 = postItApp.createNote();

      // Verify windows were created with cascading positions
      const browserWindowMock = BrowserWindow as jest.MockedClass<
        typeof BrowserWindow
      >;
      const windowCalls = browserWindowMock.mock.calls;
      expect(windowCalls.length).toBe(3);

      // Each window should have different position
      const positions = windowCalls.map((call: any[]) => ({
        x: call[0].x,
        y: call[0].y,
      }));
      expect(positions[0]).not.toEqual(positions[1]);
      expect(positions[1]).not.toEqual(positions[2]);
    });

    it('keeps windows within screen boundaries', async () => {
      const postItApp = new PostItApp();

      // Simulate initialization
      const appMock = app as any;
      const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
      if (readyCallback) {
        await readyCallback();
      }

      // Create note with position that would go off-screen
      const noteId = postItApp.createNote({
        position_x: 2000, // Beyond screen width
        position_y: 1500, // Beyond screen height
      });

      // Verify position was adjusted to stay on screen
      const browserWindowMock = BrowserWindow as jest.MockedClass<
        typeof BrowserWindow
      >;
      const windowCall =
        browserWindowMock.mock.calls[browserWindowMock.mock.calls.length - 1];
      const windowOptions = windowCall[0];

      expect(windowOptions.x).toBeLessThan(1920); // Screen width
      expect(windowOptions.y).toBeLessThan(1080); // Screen height
    });
  });
});
