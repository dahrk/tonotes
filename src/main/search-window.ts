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
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

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
        preload: path.join(__dirname, 'search-preload.js')
      }
    });

    // Load search interface
    const searchHTML = this.createSearchHTML();
    this.window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(searchHTML)}`);

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

  private createSearchHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Search Notes</title>
        <style>
          :root {
            --bg-primary: #f5f5f5;
            --bg-secondary: white;
            --text-primary: #333;
            --text-secondary: #666;
            --text-tertiary: #999;
            --border-color: #e0e0e0;
            --hover-bg: #f0f0f0;
            --focus-color: #007AFF;
          }

          [data-theme="dark"] {
            --bg-primary: #1e1e1e;
            --bg-secondary: #2d2d2d;
            --text-primary: #ffffff;
            --text-secondary: #cccccc;
            --text-tertiary: #888888;
            --border-color: #404040;
            --hover-bg: #3d3d3d;
            --focus-color: #64a0ff;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 0;
            background: var(--bg-primary);
            color: var(--text-primary);
            overflow: hidden;
          }
          
          .search-container {
            padding: 20px;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border-color);
          }
          
          .search-input {
            width: 100%;
            padding: 12px 16px;
            font-size: 16px;
            border: 2px solid var(--border-color);
            border-radius: 8px;
            outline: none;
            transition: border-color 0.2s ease;
          }
          
          .search-input:focus {
            border-color: var(--focus-color);
          }
          
          .results-container {
            height: calc(100vh - 100px);
            overflow-y: auto;
            padding: 0;
          }
          
          .result-item {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-color);
            cursor: pointer;
            transition: background-color 0.2s ease;
            background: var(--bg-secondary);
          }
          
          .result-item:hover {
            background: var(--hover-bg);
          }
          
          .result-item:last-child {
            border-bottom: none;
          }
          
          .result-title {
            font-weight: 600;
            font-size: 14px;
            color: var(--text-primary);
            margin-bottom: 4px;
            line-height: 1.3;
          }
          
          .result-content {
            font-size: 12px;
            color: var(--text-secondary);
            line-height: 1.4;
            margin-bottom: 8px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .result-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: var(--text-tertiary);
          }
          
          .result-tags {
            display: flex;
            gap: 4px;
          }
          
          .result-tag {
            background: var(--border-color);
            padding: 2px 6px;
            border-radius: 6px;
            font-size: 9px;
            color: var(--text-secondary);
          }
          
          .result-date {
            font-style: italic;
          }
          
          .no-results {
            text-align: center;
            padding: 40px 20px;
            color: var(--text-tertiary);
            font-style: italic;
          }
          
          .loading {
            text-align: center;
            padding: 40px 20px;
            color: var(--text-secondary);
          }
          
          .instructions {
            text-align: center;
            padding: 40px 20px;
            color: var(--text-tertiary);
            font-size: 14px;
          }
        </style>
      </head>
      <body data-theme="light">
        <div class="search-container">
          <input 
            type="text" 
            id="searchInput" 
            class="search-input" 
            placeholder="Search notes by content or tags..."
            autocomplete="off"
          />
        </div>
        
        <div id="resultsContainer" class="results-container">
          <div class="instructions">
            Start typing to search through your notes...
          </div>
        </div>

        <script>
          const searchInput = document.getElementById('searchInput');
          const resultsContainer = document.getElementById('resultsContainer');
          let searchTimeout;

          searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Clear previous timeout
            if (searchTimeout) {
              clearTimeout(searchTimeout);
            }
            
            if (query.length === 0) {
              resultsContainer.innerHTML = '<div class="instructions">Start typing to search through your notes...</div>';
              return;
            }
            
            if (query.length < 2) {
              resultsContainer.innerHTML = '<div class="instructions">Type at least 2 characters to search...</div>';
              return;
            }
            
            // Debounce search
            searchTimeout = setTimeout(() => {
              performSearch(query);
            }, 300);
          });

          searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              window.electronAPI.closeSearchWindow();
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              const firstResult = document.querySelector('.result-item');
              if (firstResult) {
                firstResult.click();
              }
            }
          });

          async function performSearch(query) {
            resultsContainer.innerHTML = '<div class="loading">Searching...</div>';
            
            try {
              const results = await window.electronAPI.searchAllNotes(query);
              displayResults(results, query);
            } catch (error) {
              console.error('Search error:', error);
              resultsContainer.innerHTML = '<div class="no-results">Search failed. Please try again.</div>';
            }
          }

          function displayResults(results, query) {
            if (results.length === 0) {
              resultsContainer.innerHTML = \`<div class="no-results">No notes found for "\${query}"</div>\`;
              return;
            }

            const resultsHTML = results.map(result => {
              const title = result.title || 'Untitled';
              const content = result.content.substring(0, 100);
              const date = new Date(result.updated_at).toLocaleDateString();
              const tagsHTML = result.tags.map(tag => 
                \`<span class="result-tag">\${tag.name}</span>\`
              ).join('');

              return \`
                <div class="result-item" onclick="selectNote('\${result.id}')">
                  <div class="result-title">\${title}</div>
                  <div class="result-content">\${content}...</div>
                  <div class="result-meta">
                    <div class="result-tags">\${tagsHTML}</div>
                    <div class="result-date">\${date}</div>
                  </div>
                </div>
              \`;
            }).join('');

            resultsContainer.innerHTML = resultsHTML;
          }

          function selectNote(noteId) {
            window.electronAPI.selectSearchResult(noteId);
          }
        </script>
      </body>
      </html>
    `;
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
          notes.map(async (note) => {
            const tags = this.database.getNoteTags(note.id);
            const title = note.content.split('\n')[0] || 'Untitled';
            
            return {
              id: note.id,
              title: title.substring(0, 50),
              content: note.content.substring(0, 200), // Limit content length for performance
              tags,
              updated_at: note.updated_at
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
      `);
    }
  }

  public destroy() {
    this.close();
  }
}