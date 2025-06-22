/**
 * Integration Test: Window Lifecycle Management
 *
 * Tests the complete window lifecycle including creation, management,
 * theme application, and cleanup across the entire system.
 */

import { BrowserWindow, app, ipcMain, nativeTheme } from 'electron';
import { PostItApp } from '../../src/main/main';
import { Database } from '../../src/database/database';
import { SystemTray } from '../../src/main/system-tray';
import { createMockNote } from '../utils/testHelpers';

// Types for mocked objects
interface MockWindow {
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
  searchNotes: jest.MockedFunction<any>;
  createTag: jest.MockedFunction<any>;
  addTagToNote: jest.MockedFunction<any>;
  removeTagFromNote: jest.MockedFunction<any>;
  getNoteTags: jest.MockedFunction<any>;
  getAllTags: jest.MockedFunction<any>;
}

interface MockSystemTray {
  updateTrayTitle: jest.MockedFunction<any>;
  updateTrayMenu: jest.MockedFunction<any>;
  destroy: jest.MockedFunction<any>;
  onCreateNote?: () => string;
  onShowSearch?: () => void;
  onShowSettings?: () => void;
  onGetAllNotes?: () => any[];
  onFocusNote?: (noteId: string) => boolean;
  onCheckWindowExists?: (noteId: string) => boolean;
}

// Mock all electron modules comprehensively
jest.mock('electron', () => {
  const mockWindow: MockWindow = {
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
    Notification: jest.fn().mockImplementation(() => ({
      show: jest.fn(),
    })),
  };
});

// Mock other modules
jest.mock('../../src/database/database');
jest.mock('../../src/main/system-tray');

describe('Window Lifecycle Integration', () => {
  let mockDatabase: MockDatabase;
  let mockSystemTray: MockSystemTray;
  let postItApp: PostItApp;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup comprehensive database mock
    mockDatabase = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getAllNotes: jest.fn(() => []),
      createNote: jest.fn(),
      updateNote: jest.fn(),
      deleteNote: jest.fn(),
      getNote: jest.fn(),
      searchNotes: jest.fn(() => []),
      createTag: jest.fn(),
      addTagToNote: jest.fn(),
      removeTagFromNote: jest.fn(),
      getNoteTags: jest.fn(() => []),
      getAllTags: jest.fn(() => []),
    };
    (Database as jest.MockedClass<typeof Database>).mockImplementation(
      () => mockDatabase as any
    );

    // Setup system tray mock
    mockSystemTray = {
      updateTrayTitle: jest.fn(),
      updateTrayMenu: jest.fn(),
      destroy: jest.fn(),
    };
    (SystemTray as jest.MockedClass<typeof SystemTray>).mockImplementation(
      () => mockSystemTray as any
    );

    // Reset BrowserWindow static methods
    (BrowserWindow as any).getAllWindows = jest.fn(() => []);
    (BrowserWindow as any).fromWebContents = jest.fn(() => null);
  });

  /**
   * Test complete application initialization and window creation flow
   */
  it('initializes application and creates windows for existing notes', async () => {
    // Setup existing notes in database
    const existingNotes = [
      createMockNote({ id: 'note1', content: 'First note' }),
      createMockNote({ id: 'note2', content: 'Second note' }),
    ];
    mockDatabase.getAllNotes.mockReturnValue(existingNotes);

    // Create app instance
    postItApp = new PostItApp();

    // Simulate app ready event
    const appMock = app as any;
    const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Verify database was initialized
    expect(mockDatabase.initialize).toHaveBeenCalled();

    // Verify system tray was created
    expect(SystemTray).toHaveBeenCalled();

    // Verify windows were created for existing notes
    expect(BrowserWindow).toHaveBeenCalledTimes(2);

    // Verify tray was updated with note count
    expect(mockSystemTray.updateTrayTitle).toHaveBeenCalledWith(2);
  });

  /**
   * Test application behavior when no notes exist
   */
  it('creates first note when no existing notes found', async () => {
    // Setup empty database
    mockDatabase.getAllNotes.mockReturnValue([]);

    postItApp = new PostItApp();

    // Simulate app ready event
    const appMock = app as any;
    const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Verify a new note was created
    expect(mockDatabase.createNote).toHaveBeenCalled();
    expect(BrowserWindow).toHaveBeenCalled();

    // Verify tray was updated
    expect(mockSystemTray.updateTrayTitle).toHaveBeenCalled();
  });

  /**
   * Test IPC handler registration and functionality
   */
  it('registers all IPC handlers correctly', async () => {
    postItApp = new PostItApp();

    // Verify all expected IPC handlers were registered
    const expectedHandlers = [
      'create-note',
      'update-note',
      'delete-note',
      'get-note',
      'get-all-notes',
      'search-notes',
      'create-tag',
      'add-tag-to-note',
      'remove-tag-from-note',
      'get-note-tags',
      'get-all-tags',
      'close-window',
      'minimize-window',
      'focus-note',
      'toggle-always-on-top',
      'open-search',
    ];

    expectedHandlers.forEach(handler => {
      expect(ipcMain.handle).toHaveBeenCalledWith(
        handler,
        expect.any(Function)
      );
    });
  });

  /**
   * Test complete note creation workflow including IPC
   */
  it('handles complete note creation workflow through IPC', async () => {
    postItApp = new PostItApp();

    // Simulate app ready
    const appMock = app as any;
    const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Find the create-note IPC handler
    const ipcMainMock = ipcMain as any;
    const createNoteHandler = ipcMainMock.handle.mock.calls.find(
      (call: any[]) => call[0] === 'create-note'
    )?.[1];

    expect(createNoteHandler).toBeTruthy();

    // Simulate IPC call to create note
    const mockEvent = { sender: { id: 1 } };
    const noteRequest = {
      content: 'Test note content',
      color: 'yellow',
      position_x: 200,
      position_y: 300,
    };

    const noteId = await createNoteHandler(mockEvent, noteRequest);

    // Verify note was created in database
    expect(mockDatabase.createNote).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Test note content',
        color: 'yellow',
        position_x: 200,
        position_y: 300,
      })
    );

    // Verify window was created
    expect(BrowserWindow).toHaveBeenCalled();

    // Verify note ID was returned
    expect(noteId).toBeTruthy();
  });

  /**
   * Test note deletion workflow
   */
  it('handles complete note deletion workflow', async () => {
    const noteToDelete = createMockNote({ id: 'delete-me' });
    mockDatabase.getAllNotes.mockReturnValue([noteToDelete]);

    postItApp = new PostItApp();

    // Simulate app ready
    const appMock = app as any;
    const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Find the delete-note IPC handler
    const ipcMainMock = ipcMain as any;
    const deleteNoteHandler = ipcMainMock.handle.mock.calls.find(
      (call: any[]) => call[0] === 'delete-note'
    )?.[1];

    expect(deleteNoteHandler).toBeTruthy();

    // Get the window that was created for the note
    const browserWindowMock = BrowserWindow as jest.MockedClass<
      typeof BrowserWindow
    >;
    const windowInstance = browserWindowMock.mock.results[0]
      ?.value as MockWindow;

    // Simulate IPC call to delete note
    const mockEvent = { sender: { id: 1 } };
    await deleteNoteHandler(mockEvent, 'delete-me');

    // Verify note was deleted from database
    expect(mockDatabase.deleteNote).toHaveBeenCalledWith('delete-me');

    // Verify window was closed
    expect(windowInstance.close).toHaveBeenCalled();
  });

  /**
   * Test theme application across all windows
   */
  it('applies theme changes to all open windows', async () => {
    // Setup multiple notes
    const notes = [
      createMockNote({ id: 'note1' }),
      createMockNote({ id: 'note2' }),
      createMockNote({ id: 'note3' }),
    ];
    mockDatabase.getAllNotes.mockReturnValue(notes);

    postItApp = new PostItApp();

    // Mock settings window
    const mockSettings = { theme: 'dark', alwaysOnTop: true };
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

    // Trigger theme change
    postItApp.handleSettingsChange({ theme: 'light', alwaysOnTop: false });

    // Verify theme was applied to all windows
    const browserWindowMock = BrowserWindow as jest.MockedClass<
      typeof BrowserWindow
    >;
    const windows = browserWindowMock.mock.results.map(
      result => result.value as MockWindow
    );
    windows.forEach(window => {
      expect(window.webContents.executeJavaScript).toHaveBeenCalledWith(
        expect.stringContaining("setAttribute('data-theme', 'light')")
      );
      expect(window.setAlwaysOnTop).toHaveBeenCalledWith(false);
    });
  });

  /**
   * Test window recreation after crash or destruction
   */
  it('recreates windows when focusing destroyed windows', async () => {
    const existingNote = createMockNote({ id: 'existing-note' });
    mockDatabase.getNote.mockReturnValue(existingNote);

    postItApp = new PostItApp();

    // Simulate app ready
    const appMock = app as any;
    const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Mock window as destroyed
    const browserWindowMock = BrowserWindow as jest.MockedClass<
      typeof BrowserWindow
    >;
    const windowInstance = browserWindowMock.mock.results[0]
      ?.value as MockWindow;
    if (windowInstance) {
      windowInstance.isDestroyed.mockReturnValue(true);
    }

    // Try to focus the note
    const focused = postItApp.focusNote('existing-note');

    // Verify new window was created
    expect(focused).toBe(true);
    expect(mockDatabase.getNote).toHaveBeenCalledWith('existing-note');
    expect(BrowserWindow).toHaveBeenCalledTimes(2); // Original + recreated
  });

  /**
   * Test proper cleanup on app shutdown
   */
  it('cleans up resources properly on app shutdown', async () => {
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

    // Find the before-quit handler
    const beforeQuitHandler = appMock.on.mock.calls.find(
      (call: any[]) => call[0] === 'before-quit'
    )?.[1];

    expect(beforeQuitHandler).toBeTruthy();

    // Simulate app quit
    if (beforeQuitHandler) {
      beforeQuitHandler();
    }

    // Verify system tray was destroyed
    expect(mockSystemTray.destroy).toHaveBeenCalled();

    // Verify all windows were closed
    const browserWindowMock = BrowserWindow as jest.MockedClass<
      typeof BrowserWindow
    >;
    const windows = browserWindowMock.mock.results.map(
      result => result.value as MockWindow
    );
    windows.forEach(window => {
      expect(window.close).toHaveBeenCalled();
    });
  });

  /**
   * Test system tray integration with window management
   */
  it('integrates system tray with window management correctly', async () => {
    postItApp = new PostItApp();

    // Simulate app ready
    const appMock = app as any;
    const readyCallback = appMock.whenReady.mock.calls[0]?.[0];
    if (readyCallback) {
      await readyCallback();
    }

    // Verify system tray was initialized with correct callbacks
    expect(SystemTray).toHaveBeenCalledWith(
      expect.any(Function), // onCreateNote
      expect.any(Function), // onShowSearch
      expect.any(Function), // onShowSettings
      expect.any(Function), // onGetAllNotes
      expect.any(Function), // onFocusNote
      expect.any(Function) // onCheckWindowExists
    );

    // Test create note callback
    const systemTrayMock = SystemTray as jest.MockedClass<typeof SystemTray>;
    const [onCreateNote] = systemTrayMock.mock.calls[0];
    const noteId = onCreateNote();
    expect(noteId).toBeTruthy();
    expect(mockDatabase.createNote).toHaveBeenCalled();

    // Test get all notes callback
    const [, , , onGetAllNotes] = systemTrayMock.mock.calls[0];
    const notes = onGetAllNotes();
    expect(mockDatabase.getAllNotes).toHaveBeenCalled();

    // Test focus note callback
    const [, , , , onFocusNote] = systemTrayMock.mock.calls[0];
    mockDatabase.getNote.mockReturnValue(createMockNote({ id: 'test' }));
    const focused = onFocusNote('test');
    expect(focused).toBe(true);

    // Test check window exists callback
    const [, , , , , onCheckWindowExists] = systemTrayMock.mock.calls[0];
    const exists = onCheckWindowExists(noteId);
    expect(exists).toBe(true);
  });
});
