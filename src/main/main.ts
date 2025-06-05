import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database/database';
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '../types';

class PostItApp {
  private database: Database;
  private noteWindows: Map<string, BrowserWindow> = new Map();

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
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createNote();
      }
    });
  }

  private async initialize() {
    await this.database.initialize();
    
    // Load existing notes
    const existingNotes = this.database.getAllNotes();
    for (const note of existingNotes) {
      this.createNoteWindow(note);
    }

    // Create first note if none exist
    if (existingNotes.length === 0) {
      this.createNote();
    }
  }

  public createNote(request: CreateNoteRequest = {}): string {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    
    const noteId = uuidv4();
    const colors: Array<'yellow' | 'pink' | 'blue'> = ['yellow', 'pink', 'blue'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const note: Note = {
      id: noteId,
      content: request.content || '',
      color: request.color || randomColor,
      position_x: request.position_x || Math.floor(screenWidth / 2 - 150),
      position_y: request.position_y || Math.floor(screenHeight / 2 - 150),
      width: 300,
      height: 300,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.database.createNote(note);
    this.createNoteWindow(note);
    
    return noteId;
  }

  private createNoteWindow(note: Note) {
    const noteWindow = new BrowserWindow({
      x: note.position_x,
      y: note.position_y,
      width: note.width,
      height: note.height,
      frame: false,
      transparent: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: true,
      minimizable: false,
      maximizable: false,
      closable: true,
      hasShadow: true,
      titleBarStyle: 'hidden',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    // Set window level for true always-on-top behavior on macOS
    if (process.platform === 'darwin') {
      noteWindow.setAlwaysOnTop(true, 'floating', 1);
      noteWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    }

    // Load the renderer
    if (process.env.NODE_ENV === 'development') {
      noteWindow.loadURL(`http://localhost:3000?noteId=${note.id}`);
      noteWindow.webContents.openDevTools();
    } else {
      noteWindow.loadFile(path.join(__dirname, '../index.html'), {
        query: { noteId: note.id }
      });
    }

    // Handle window events
    noteWindow.on('moved', () => {
      const [x, y] = noteWindow.getPosition();
      this.database.updateNote({
        id: note.id,
        position_x: x,
        position_y: y
      });
    });

    noteWindow.on('resized', () => {
      const [width, height] = noteWindow.getSize();
      this.database.updateNote({
        id: note.id,
        width,
        height
      });
    });

    noteWindow.on('closed', () => {
      this.noteWindows.delete(note.id);
    });

    this.noteWindows.set(note.id, noteWindow);
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

    ipcMain.handle('remove-tag-from-note', (_, noteId: string, tagId: number) => {
      this.database.removeTagFromNote(noteId, tagId);
    });

    ipcMain.handle('get-note-tags', (_, noteId: string) => {
      return this.database.getNoteTags(noteId);
    });

    ipcMain.handle('close-window', (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.close();
      }
    });
  }
}

// Create the application instance
new PostItApp();