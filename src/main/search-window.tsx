import { BrowserWindow, ipcMain, screen } from 'electron';
import * as path from 'path';
import type { Database } from '../database/database';

export class SearchWindow {
  private window: BrowserWindow | null = null;
  private database: Database;
  private onNoteSelect: (noteId: string) => void;

  constructor(database: Database, onNoteSelect: (noteId: string) => void) {
    this.database = database;
    this.onNoteSelect = onNoteSelect;
    this.setupIPCHandlers();
  }

  public show() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.focus();
      this.window.show();
      return;
    }

    this.createWindow();
  }

  private createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } =
      primaryDisplay.workAreaSize;

    this.window = new BrowserWindow({
      width: 500,
      height: 400,
      x: Math.floor((screenWidth - 500) / 2),
      y: Math.floor((screenHeight - 400) / 2),
      resizable: true,
      minimizable: false,
      maximizable: false,
      alwaysOnTop: true,
      titleBarStyle: 'hiddenInset',
      title: 'Search Notes',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'search-preload.js'),
      },
    });

    // Load search interface
    if (process.env.NODE_ENV === 'development') {
      this.window.loadURL('http://localhost:5173/search.html');
    } else {
      this.window.loadFile(path.join(__dirname, '../../search.html'));
    }

    this.window.on('closed', () => {
      this.window = null;
    });

    // Focus on the search input when window is shown
    this.window.webContents.once('dom-ready', () => {
      this.window?.webContents.executeJavaScript(`
        document.getElementById('searchInput').focus();
      `);
    });
  }


  private setupIPCHandlers() {
    ipcMain.handle('search-all-notes', async (_, query: string) => {
      try {
        // Validate input
        if (!query || typeof query !== 'string') {
          return [];
        }

        const notes = this.database.searchNotes(query.trim());

        // Get tags for each note and format results
        const results = await Promise.all(
          notes.map(async note => {
            const tags = this.database.getNoteTags(note.id);
            const title = note.content.split('\n')[0] || 'Untitled';

            return {
              id: note.id,
              title: title.substring(0, 50),
              content: note.content.substring(0, 200), // Limit content length for performance
              tags,
              updated_at: note.updated_at,
            };
          })
        );

        return results;
      } catch (error) {
        console.error('Search error:', error);
        return [];
      }
    });

    ipcMain.handle('select-search-result', (_, noteId: string) => {
      this.onNoteSelect(noteId);
      this.close();
    });

    ipcMain.handle('close-search-window', () => {
      this.close();
    });
  }

  public close() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
    }
  }

  public applyTheme(theme: 'light' | 'dark') {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.executeJavaScript(`
        document.body.setAttribute('data-theme', '${theme}');
        // Also update React component if it's mounted
        if (window.updateTheme) {
          window.updateTheme('${theme}');
        }
      `);
    }
  }

  public destroy() {
    this.close();
  }
}
