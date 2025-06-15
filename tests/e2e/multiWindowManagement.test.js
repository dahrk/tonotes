/**
 * E2E Test: Multi-Window Management
 * 
 * Tests the complete multi-window experience including creating multiple notes,
 * managing them through the system tray, and coordinating between windows.
 */

import { BrowserWindow, app, Tray } from 'electron';
import { PostItApp } from '../../src/main/main';
import { Database } from '../../src/database/database';
import { SystemTray } from '../../src/main/system-tray';
import { createMockNote } from '../utils/testHelpers';

// Mock electron modules comprehensively
jest.mock('electron', () => {
  const mockWindows = new Map();
  let windowIdCounter = 1;
  
  const createMockWindow = () => {
    const windowId = windowIdCounter++;
    const mockWindow = {
      id: windowId,
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
      getPosition: jest.fn(() => [100 + windowId * 30, 100 + windowId * 30]),
      getSize: jest.fn(() => [400, 400]),
      isDestroyed: jest.fn(() => false),
      webContents: {
        send: jest.fn(),
        on: jest.fn(),
        executeJavaScript: jest.fn().mockResolvedValue(),
        openDevTools: jest.fn(),
      },
    };
    mockWindows.set(windowId, mockWindow);
    return mockWindow;
  };

  return {
    BrowserWindow: jest.fn(() => createMockWindow()),
    app: {
      whenReady: jest.fn().mockResolvedValue(),
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
      setTitle: jest.fn(),
      on: jest.fn(),
      destroy: jest.fn(),
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
    Notification: jest.fn(() => ({
      show: jest.fn(),
    })),
  };
});

// Mock other modules
jest.mock('../../src/database/database');
jest.mock('../../src/main/system-tray');

describe('E2E: Multi-Window Management', () => {
  let postItApp;
  let mockDatabase;
  let mockSystemTray;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup comprehensive database mock
    mockDatabase = {
      initialize: jest.fn().mockResolvedValue(),
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
    Database.mockImplementation(() => mockDatabase);

    // Setup system tray mock with callback tracking
    mockSystemTray = {
      updateTrayTitle: jest.fn(),
      updateTrayMenu: jest.fn(),
      destroy: jest.fn(),
    };
    SystemTray.mockImplementation((onCreateNote, onShowSearch, onShowSettings, onGetAllNotes, onFocusNote, onCheckWindowExists) => {
      mockSystemTray.onCreateNote = onCreateNote;
      mockSystemTray.onShowSearch = onShowSearch;
      mockSystemTray.onShowSettings = onShowSettings;
      mockSystemTray.onGetAllNotes = onGetAllNotes;
      mockSystemTray.onFocusNote = onFocusNote;
      mockSystemTray.onCheckWindowExists = onCheckWindowExists;
      return mockSystemTray;
    });

    // Reset BrowserWindow static methods
    BrowserWindow.getAllWindows = jest.fn(() => []);
    BrowserWindow.fromWebContents = jest.fn(() => null);
  });

  /**
   * Test complete multi-note workflow
   */
  it('manages multiple notes through complete lifecycle', async () => {
    // Initialize app
    postItApp = new PostItApp();
    const readyCallback = app.whenReady.mock.calls[0][0];
    await readyCallback();

    // Verify initial state - should create first note if none exist
    expect(BrowserWindow).toHaveBeenCalledTimes(1);
    expect(mockSystemTray.updateTrayTitle).toHaveBeenCalledWith(1);

    // Create additional notes through system tray
    const note2Id = mockSystemTray.onCreateNote();
    const note3Id = mockSystemTray.onCreateNote();
    const note4Id = mockSystemTray.onCreateNote();

    // Verify multiple windows were created
    expect(BrowserWindow).toHaveBeenCalledTimes(4);
    expect(mockSystemTray.updateTrayTitle).toHaveBeenLastCalledWith(4);

    // Verify window positions are cascaded
    const windowCalls = BrowserWindow.mock.calls;
    expect(windowCalls[0][0].x).not.toEqual(windowCalls[1][0].x);
    expect(windowCalls[1][0].x).not.toEqual(windowCalls[2][0].x);

    // Test focusing notes through system tray
    const mockNote = createMockNote({ id: note2Id });
    mockDatabase.getNote.mockReturnValue(mockNote);

    const focused = mockSystemTray.onFocusNote(note2Id);
    expect(focused).toBe(true);

    // Test checking window existence
    const exists = mockSystemTray.onCheckWindowExists(note2Id);
    expect(exists).toBe(true);

    // Test note deletion and window cleanup
    postItApp.deleteNote(note3Id);
    expect(mockDatabase.deleteNote).toHaveBeenCalledWith(note3Id);

    // Simulate window close event
    const windowInstance = BrowserWindow.mock.results[2].value; // Third window
    const closedHandler = windowInstance.on.mock.calls.find(
      call => call[0] === 'closed'
    )?.[1];
    if (closedHandler) {
      closedHandler();
    }

    // Tray should be updated with new count
    expect(mockSystemTray.updateTrayTitle).toHaveBeenCalledWith(2);
  });

  /**
   * Test system tray context menu functionality
   */
  it('provides comprehensive system tray functionality', async () => {
    // Setup existing notes
    const existingNotes = [
      createMockNote({ id: 'note1', content: '# First Note' }),
      createMockNote({ id: 'note2', content: '# Second Note' }),
      createMockNote({ id: 'note3', content: '# Third Note' }),
    ];
    mockDatabase.getAllNotes.mockReturnValue(existingNotes);

    postItApp = new PostItApp();
    const readyCallback = app.whenReady.mock.calls[0][0];
    await readyCallback();

    // Test getting all notes through tray callback
    const allNotes = mockSystemTray.onGetAllNotes();
    expect(allNotes).toEqual(existingNotes);

    // Test creating note through tray
    const newNoteId = mockSystemTray.onCreateNote();
    expect(mockDatabase.createNote).toHaveBeenCalled();
    expect(BrowserWindow).toHaveBeenCalledTimes(4); // 3 existing + 1 new

    // Test showing search through tray
    mockSystemTray.onShowSearch();
    // In real implementation, this would open search window

    // Test showing settings through tray
    mockSystemTray.onShowSettings();
    // In real implementation, this would open settings window
  });

  /**
   * Test window position management and cascading
   */
  it('manages window positions correctly with cascading', async () => {
    postItApp = new PostItApp();
    const readyCallback = app.whenReady.mock.calls[0][0];
    await readyCallback();

    // Create multiple notes and verify cascading positions
    const positions = [];
    
    for (let i = 0; i < 5; i++) {
      const noteId = postItApp.createNote();
      const windowCall = BrowserWindow.mock.calls[BrowserWindow.mock.calls.length - 1];
      positions.push({ x: windowCall[0].x, y: windowCall[0].y });
    }

    // Verify each position is different (cascaded)
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i].x).not.toBe(positions[i - 1].x);
      expect(positions[i].y).not.toBe(positions[i - 1].y);
    }

    // Verify positions don't go off-screen
    positions.forEach(pos => {
      expect(pos.x).toBeLessThan(1920 - 400); // Screen width - window width
      expect(pos.y).toBeLessThan(1080 - 400); // Screen height - window height
    });
  });

  /**
   * Test window state persistence and recreation
   */
  it('handles window destruction and recreation properly', async () => {
    const existingNote = createMockNote({ id: 'persistent-note' });
    mockDatabase.getNote.mockReturnValue(existingNote);
    mockDatabase.getAllNotes.mockReturnValue([existingNote]);

    postItApp = new PostItApp();
    const readyCallback = app.whenReady.mock.calls[0][0];
    await readyCallback();

    // Verify window was created for existing note
    expect(BrowserWindow).toHaveBeenCalledTimes(1);

    // Simulate window destruction
    const windowInstance = BrowserWindow.mock.results[0].value;
    windowInstance.isDestroyed.mockReturnValue(true);

    // Try to focus the note - should recreate window
    const focused = postItApp.focusNote('persistent-note');
    expect(focused).toBe(true);
    expect(BrowserWindow).toHaveBeenCalledTimes(2); // Original + recreated
  });

  /**
   * Test theme application across multiple windows
   */
  it('applies theme changes to all windows simultaneously', async () => {
    postItApp = new PostItApp();

    // Mock settings
    const mockSettings = { theme: 'system', alwaysOnTop: true };
    postItApp.settingsWindow = {
      getSettings: jest.fn(() => mockSettings),
      updateSettings: jest.fn(),
      applyTheme: jest.fn(),
    };

    const readyCallback = app.whenReady.mock.calls[0][0];
    await readyCallback();

    // Create multiple notes
    postItApp.createNote();
    postItApp.createNote();
    postItApp.createNote();

    // Apply theme change
    postItApp.handleSettingsChange({ theme: 'dark', alwaysOnTop: false });

    // Verify theme was applied to all windows
    const windowInstances = BrowserWindow.mock.results.map(result => result.value);
    windowInstances.forEach(window => {
      expect(window.webContents.executeJavaScript).toHaveBeenCalledWith(
        expect.stringContaining("setAttribute('data-theme', 'dark')")
      );
      expect(window.setAlwaysOnTop).toHaveBeenCalledWith(false);
    });
  });

  /**
   * Test always-on-top coordination
   */
  it('coordinates always-on-top across all windows', async () => {
    postItApp = new PostItApp();

    // Mock settings with always-on-top enabled
    const mockSettings = { alwaysOnTop: true, theme: 'system' };
    postItApp.settingsWindow = {
      getSettings: jest.fn(() => mockSettings),
      updateSettings: jest.fn((newSettings) => {
        Object.assign(mockSettings, newSettings);
      }),
    };

    const readyCallback = app.whenReady.mock.calls[0][0];
    await readyCallback();

    // Create multiple notes
    postItApp.createNote();
    postItApp.createNote();

    // Verify all windows have always-on-top
    const windowInstances = BrowserWindow.mock.results.map(result => result.value);
    windowInstances.forEach(window => {
      expect(window.setAlwaysOnTop).toHaveBeenCalledWith(true);
    });

    // Toggle always-on-top globally
    postItApp.toggleAlwaysOnTopGlobal();

    // Verify all windows were updated
    windowInstances.forEach(window => {
      expect(window.setAlwaysOnTop).toHaveBeenCalledWith(false);
    });
  });

  /**
   * Test window focus coordination
   */
  it('handles window focus and bring-to-front correctly', async () => {
    const notes = [
      createMockNote({ id: 'note1' }),
      createMockNote({ id: 'note2' }),
      createMockNote({ id: 'note3' }),
    ];
    mockDatabase.getAllNotes.mockReturnValue(notes);
    mockDatabase.getNote.mockImplementation(id => 
      notes.find(note => note.id === id)
    );

    postItApp = new PostItApp();
    const readyCallback = app.whenReady.mock.calls[0][0];
    await readyCallback();

    // Focus different notes
    const focused1 = postItApp.focusNote('note2');
    expect(focused1).toBe(true);

    const focused2 = postItApp.focusNote('note3');
    expect(focused2).toBe(true);

    // Verify focus and show were called
    const windowInstances = BrowserWindow.mock.results.map(result => result.value);
    windowInstances.forEach(window => {
      expect(window.focus).toHaveBeenCalled();
      expect(window.show).toHaveBeenCalled();
    });

    // Test focusing non-existent note
    const focused3 = postItApp.focusNote('non-existent');
    expect(focused3).toBe(false);
  });

  /**
   * Test resource cleanup on app shutdown
   */
  it('properly cleans up all resources on shutdown', async () => {
    postItApp = new PostItApp();
    const readyCallback = app.whenReady.mock.calls[0][0];
    await readyCallback();

    // Create multiple notes
    postItApp.createNote();
    postItApp.createNote();
    postItApp.createNote();

    // Simulate app shutdown
    const beforeQuitHandler = app.on.mock.calls.find(
      call => call[0] === 'before-quit'
    )?.[1];

    if (beforeQuitHandler) {
      beforeQuitHandler();
    }

    // Verify cleanup
    expect(mockSystemTray.destroy).toHaveBeenCalled();

    // Verify all windows were closed
    const windowInstances = BrowserWindow.mock.results.map(result => result.value);
    windowInstances.forEach(window => {
      expect(window.close).toHaveBeenCalled();
    });
  });

  /**
   * Test error handling in multi-window scenarios
   */
  it('handles errors gracefully in multi-window environment', async () => {
    postItApp = new PostItApp();
    const readyCallback = app.whenReady.mock.calls[0][0];
    await readyCallback();

    // Mock database error during note creation
    mockDatabase.createNote.mockImplementation(() => {
      throw new Error('Database error');
    });

    // Should not crash when creating note fails
    expect(() => {
      postItApp.createNote();
    }).not.toThrow();

    // Mock window creation error
    BrowserWindow.mockImplementation(() => {
      throw new Error('Window creation failed');
    });

    // Should handle window creation errors gracefully
    expect(() => {
      postItApp.createNote();
    }).not.toThrow();
  });

  /**
   * Test concurrent operations on multiple windows
   */
  it('handles concurrent operations across multiple windows', async () => {
    const notes = [
      createMockNote({ id: 'note1' }),
      createMockNote({ id: 'note2' }),
      createMockNote({ id: 'note3' }),
    ];
    mockDatabase.getAllNotes.mockReturnValue(notes);

    postItApp = new PostItApp();
    const readyCallback = app.whenReady.mock.calls[0][0];
    await readyCallback();

    // Simulate concurrent operations
    const operations = [
      () => postItApp.createNote(),
      () => postItApp.focusNote('note2'),
      () => postItApp.toggleAlwaysOnTopGlobal(),
      () => postItApp.deleteNote('note3'),
    ];

    // Execute all operations concurrently
    const results = await Promise.allSettled(
      operations.map(op => Promise.resolve(op()))
    );

    // All operations should complete successfully
    results.forEach(result => {
      expect(result.status).toBe('fulfilled');
    });

    // Verify app state remains consistent
    expect(mockSystemTray.updateTrayTitle).toHaveBeenCalled();
  });
});