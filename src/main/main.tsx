import {
  app,
  BrowserWindow,
  screen,
  ipcMain,
  nativeTheme,
  globalShortcut,
} from 'electron';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database/database';
import { SystemTray } from './system-tray';
import { SearchWindow } from './search-window';
import { SettingsWindow } from './settings-window';
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '../types';

// Disable unused Electron features for smaller bundle
app.commandLine.appendSwitch(
  'disable-features',
  'SpellChecker,PrintPreview,MediaRouter'
);
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu-sandbox');

class PostItApp {
  private database: Database;
  private noteWindows: Map<string, BrowserWindow> = new Map();
  private systemTray: SystemTray | null = null;
  private searchWindow: SearchWindow | null = null;
  private settingsWindow: SettingsWindow | null = null;

  constructor() {
    this.database = new Database();
    this.setupEventHandlers();
    this.setupIPCHandlers();
  }

  private setupEventHandlers() {
    app.whenReady().then(() => {
      this.initialize();
    });

    app.on('window-all-closed', () => {
      // Don't quit on macOS when all windows are closed,
      // since we have a system tray that should keep the app running
    });

    app.on('before-quit', () => {
      this.cleanup();
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createNote();
      }
    });
  }

  private async initialize() {
    await this.database.initialize();

    // Initialize system tray, search, and settings windows
    this.initializeSystemComponents();

    // Load existing notes
    const existingNotes = this.database.getAllNotes();
    for (const note of existingNotes) {
      this.createNoteWindow(note);
    }

    // Create first note if none exist
    if (existingNotes.length === 0) {
      this.createNote();
    }

    // Update tray with note count
    this.updateTrayNoteCount();
  }

  private initializeSystemComponents() {
    // Initialize search window
    this.searchWindow = new SearchWindow(this.database, (noteId: string) => {
      this.focusNote(noteId);
    });

    // Initialize settings window
    this.settingsWindow = new SettingsWindow();

    // Initialize system tray
    this.systemTray = new SystemTray(
      () => this.createNote(),
      () => this.searchWindow?.show(),
      () => this.settingsWindow?.show(),
      () => this.database.getAllNotes(),
      (noteId: string) => this.focusNote(noteId),
      (noteId: string) => this.checkNoteWindowExists(noteId)
    );

    // Setup theme handling
    this.setupThemeHandling();

    // Setup global shortcuts
    this.setupGlobalShortcuts();
  }

  private setupThemeHandling() {
    // Get initial theme from settings
    const settings = this.settingsWindow?.getSettings();
    if (settings) {
      this.applyTheme(settings.theme);
    }

    // Listen for system theme changes
    nativeTheme.on('updated', () => {
      const settings = this.settingsWindow?.getSettings();
      if (settings?.theme === 'system') {
        this.notifyThemeChange();
      }
    });
  }

  private applyTheme(theme: 'system' | 'light' | 'dark') {
    let effectiveTheme: 'light' | 'dark';

    if (theme === 'system') {
      effectiveTheme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    } else {
      effectiveTheme = theme;
    }

    // Update all note windows
    this.noteWindows.forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.executeJavaScript(`
          document.documentElement.setAttribute('data-theme', '${effectiveTheme}');
        `);
      }
    });

    // Update search and settings windows
    this.searchWindow?.applyTheme?.(effectiveTheme);
    this.settingsWindow?.applyTheme?.(effectiveTheme);
  }

  private notifyThemeChange() {
    const settings = this.settingsWindow?.getSettings();
    if (settings) {
      this.applyTheme(settings.theme);
    }
  }

  public handleSettingsChange(settings: any) {
    this.applyTheme(settings.theme);
    this.updateAlwaysOnTop(settings.alwaysOnTop);
  }

  private updateAlwaysOnTop(alwaysOnTop: boolean) {
    this.noteWindows.forEach(window => {
      if (!window.isDestroyed()) {
        window.setAlwaysOnTop(alwaysOnTop);
        if (process.platform === 'darwin' && alwaysOnTop) {
          window.setAlwaysOnTop(true, 'floating', 1);
          window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        }
      }
    });
  }

  private setupGlobalShortcuts() {
    // Global shortcuts intentionally removed to prevent conflicts with other applications.
    // All shortcuts now only work when note windows are focused for better UX.
    // Users can create notes via system tray when no notes are focused.
  }

  private updateTrayNoteCount() {
    const noteCount = this.noteWindows.size;
    this.systemTray?.updateTrayTitle(noteCount);
  }

  public toggleAlwaysOnTopGlobal() {
    // Get current state from settings
    const currentSettings = this.settingsWindow?.getSettings();
    if (!currentSettings) return;

    const newAlwaysOnTop = !currentSettings.alwaysOnTop;

    // Update settings using the proper method
    if (this.settingsWindow) {
      this.settingsWindow.updateSettings({ alwaysOnTop: newAlwaysOnTop });

      // Refresh settings window if it's open to reflect the change
      this.settingsWindow.refreshSettings();

      // Update system tray to reflect new state
      this.systemTray?.updateTrayMenu();
    }

    // Show notification
    try {
      const { Notification } = require('electron');
      new Notification({
        title: 'Sticky Notes',
        body: `Always on top: ${newAlwaysOnTop ? 'Enabled' : 'Disabled'}`,
        silent: true, // Don't play sound
      }).show();
    } catch (error) {
      console.warn('Failed to show notification:', error);
    }
  }

  public createNote(request: CreateNoteRequest = {}): string {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } =
      primaryDisplay.workAreaSize;

    const noteId = uuidv4();
    const colors: Array<'yellow' | 'pink' | 'blue'> = [
      'yellow',
      'pink',
      'blue',
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // Center new notes on screen with slight offset for multiple notes
    const baseX = Math.floor(screenWidth / 2 - 200);
    const baseY = Math.floor(screenHeight / 2 - 200);
    const offset = this.noteWindows.size * 30; // Offset each new note by 30px

    const note: Note = {
      id: noteId,
      content: request.content || '',
      color: request.color || randomColor,
      position_x:
        request.position_x || Math.min(baseX + offset, screenWidth - 400),
      position_y:
        request.position_y || Math.min(baseY + offset, screenHeight - 400),
      width: 400,
      height: 400,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.database.createNote(note);
    this.createNoteWindow(note);
    this.updateTrayNoteCount();

    // Focus the new note window
    const newWindow = this.noteWindows.get(noteId);
    if (newWindow) {
      newWindow.focus();
      newWindow.show();
    }

    return noteId;
  }

  private createNoteWindow(note: Note) {
    const settings = this.settingsWindow?.getSettings();
    const alwaysOnTop = settings?.alwaysOnTop ?? true;

    const noteWindow = new BrowserWindow({
      x: note.position_x,
      y: note.position_y,
      width: note.width,
      height: note.height,
      minWidth: 320, // Enough for: tags + buttons + padding
      minHeight: 200, // Enough for: header + some content
      frame: false,
      transparent: false,
      alwaysOnTop: alwaysOnTop,
      skipTaskbar: true,
      resizable: true,
      minimizable: true,
      maximizable: false,
      closable: true,
      hasShadow: true,
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 8, y: 8 },
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        preload: path.join(__dirname, 'preload.js'),
        devTools: process.env.NODE_ENV === 'development',
        enableBlinkFeatures: '',
        disableBlinkFeatures: 'AutomationControlled',
      },
    });

    // Set window level for true always-on-top behavior on macOS
    if (process.platform === 'darwin' && alwaysOnTop) {
      noteWindow.setAlwaysOnTop(true, 'floating', 1);
      noteWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    }

    // Load the renderer
    if (process.env.NODE_ENV === 'development') {
      noteWindow.loadURL(`http://localhost:3000?noteId=${note.id}`);
      noteWindow.webContents.openDevTools();
    } else {
      noteWindow.loadFile(path.join(__dirname, '../../index.html'), {
        query: { noteId: note.id },
      });
    }

    // Handle window events
    noteWindow.on('moved', () => {
      const [x, y] = noteWindow.getPosition();
      this.database.updateNote({
        id: note.id,
        position_x: x,
        position_y: y,
      });
    });

    noteWindow.on('resized', () => {
      const [width, height] = noteWindow.getSize();
      this.database.updateNote({
        id: note.id,
        width,
        height,
      });
    });

    noteWindow.on('closed', () => {
      this.noteWindows.delete(note.id);
      this.updateTrayNoteCount();
    });

    this.noteWindows.set(note.id, noteWindow);

    // Apply current theme to new window
    noteWindow.webContents.once('dom-ready', () => {
      const settings = this.settingsWindow?.getSettings();
      if (settings) {
        this.applyTheme(settings.theme);
      }
    });
  }

  public closeNote(noteId: string) {
    const window = this.noteWindows.get(noteId);
    if (window) {
      window.close();
    }
  }

  public deleteNote(noteId: string) {
    this.database.deleteNote(noteId);
    this.closeNote(noteId);
    this.updateTrayNoteCount();
  }

  public deleteAllNotes() {
    // Get all note IDs before deletion
    const allNotes = this.database.getAllNotes();

    // Close all note windows
    this.noteWindows.forEach(window => {
      if (!window.isDestroyed()) {
        window.close();
      }
    });
    this.noteWindows.clear();

    // Delete all notes from database
    allNotes.forEach(note => {
      this.database.deleteNote(note.id);
    });

    // Update tray count
    this.updateTrayNoteCount();

    // Show notification
    try {
      const { Notification } = require('electron');
      new Notification({
        title: 'PostIt',
        body: `Deleted ${allNotes.length} note${allNotes.length !== 1 ? 's' : ''}`,
        silent: true,
      }).show();
    } catch (error) {
      console.warn('Failed to show notification:', error);
    }
  }

  public focusNote(noteId: string): boolean {
    const window = this.noteWindows.get(noteId);
    if (window && !window.isDestroyed()) {
      window.focus();
      window.show();
      return true;
    } else {
      // Window doesn't exist, try to recreate it from database
      const note = this.database.getNote(noteId);
      if (note) {
        this.createNoteWindow(note);
        const newWindow = this.noteWindows.get(noteId);
        if (newWindow) {
          newWindow.focus();
          newWindow.show();
          return true;
        }
      }
    }
    return false;
  }

  public checkNoteWindowExists(noteId: string): boolean {
    const window = this.noteWindows.get(noteId);
    return window !== undefined && !window.isDestroyed();
  }

  private setupIPCHandlers() {
    ipcMain.handle('create-note', (_, request: CreateNoteRequest) => {
      return this.createNote(request);
    });

    ipcMain.handle('update-note', (_, request: UpdateNoteRequest) => {
      this.database.updateNote(request);
      return this.database.getNote(request.id);
    });

    ipcMain.handle('delete-note', (_, noteId: string) => {
      this.deleteNote(noteId);
    });

    ipcMain.handle('get-note', (_, noteId: string) => {
      return this.database.getNote(noteId);
    });

    ipcMain.handle('get-all-notes', () => {
      return this.database.getAllNotes();
    });

    ipcMain.handle('search-notes', (_, query: string) => {
      return this.database.searchNotes(query);
    });

    ipcMain.handle('create-tag', (_, name: string) => {
      return this.database.createTag(name);
    });

    ipcMain.handle('add-tag-to-note', (_, noteId: string, tagId: number) => {
      this.database.addTagToNote(noteId, tagId);
    });

    ipcMain.handle(
      'remove-tag-from-note',
      (_, noteId: string, tagId: number) => {
        this.database.removeTagFromNote(noteId, tagId);
      }
    );

    ipcMain.handle('get-note-tags', (_, noteId: string) => {
      return this.database.getNoteTags(noteId);
    });

    ipcMain.handle('get-all-tags', () => {
      return this.database.getAllTags();
    });

    ipcMain.handle('close-window', event => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.close();
      }
    });

    ipcMain.handle('minimize-window', event => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.minimize();
      }
    });

    ipcMain.handle('focus-note', (_, noteId: string) => {
      return this.focusNote(noteId);
    });

    ipcMain.handle('toggle-always-on-top', () => {
      this.toggleAlwaysOnTopGlobal();
    });

    ipcMain.handle('open-search', () => {
      this.searchWindow?.show();
    });
  }

  private cleanup() {
    // Unregister global shortcuts
    globalShortcut.unregisterAll();

    // Clean up system tray
    this.systemTray?.destroy();

    // Clean up search and settings windows
    this.searchWindow?.destroy();
    this.settingsWindow?.destroy();

    // Close all note windows
    this.noteWindows.forEach(window => {
      if (!window.isDestroyed()) {
        window.close();
      }
    });
  }
}

// Create the application instance
const postItApp = new PostItApp();

// Make app instance globally available for settings window
(global as any).postItApp = postItApp;
