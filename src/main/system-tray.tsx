import { Tray, Menu, app, nativeImage, BrowserWindow, screen } from 'electron';
import * as path from 'path';

export class SystemTray {
  private tray: Tray | null = null;
  private onCreateNote: () => string;
  private onShowSearch: () => void;
  private onShowSettings: () => void;
  private onGetAllNotes: () => any[];
  private onFocusNote: (noteId: string) => boolean;
  private onCheckWindowExists: (noteId: string) => boolean;

  constructor(
    onCreateNote: () => string,
    onShowSearch: () => void,
    onShowSettings: () => void,
    onGetAllNotes: () => any[],
    onFocusNote: (noteId: string) => boolean,
    onCheckWindowExists: (noteId: string) => boolean
  ) {
    this.onCreateNote = onCreateNote;
    this.onShowSearch = onShowSearch;
    this.onShowSettings = onShowSettings;
    this.onGetAllNotes = onGetAllNotes;
    this.onFocusNote = onFocusNote;
    this.onCheckWindowExists = onCheckWindowExists;
    this.createTray();
  }

  private createTray() {
    // Use the app icon for the system tray
    const iconPath = path.join(__dirname, '../../assets/icon.png');
    let icon;

    try {
      icon = nativeImage.createFromPath(iconPath);
      // Resize for tray if needed (typically 16x16 or 22x22)
      if (!icon.isEmpty()) {
        icon = icon.resize({ width: 16, height: 16 });
      } else {
        // Fallback to programmatic icon if file not found
        icon = nativeImage.createFromDataURL(this.createTrayIcon());
      }
    } catch (error) {
      // Fallback to programmatic icon on error
      icon = nativeImage.createFromDataURL(this.createTrayIcon());
    }

    this.tray = new Tray(icon);
    this.tray.setToolTip('PostIt - Sticky Notes');

    // Set up context menu
    this.updateContextMenu();

    // Handle tray click events
    this.tray.on('click', () => {
      // On macOS, clicking the tray icon should show the menu
      if (process.platform === 'darwin') {
        this.tray?.popUpContextMenu();
      } else {
        // On other platforms, create a new note
        this.onCreateNote();
      }
    });

    this.tray.on('right-click', () => {
      this.tray?.popUpContextMenu();
    });
  }

  private updateContextMenu() {
    const notes = this.onGetAllNotes();

    // Get current always-on-top setting
    const settings = (global as any).postItApp?.settingsWindow?.getSettings();
    const alwaysOnTop = settings?.alwaysOnTop ?? true;

    const menuTemplate: any[] = [
      {
        label: '📝 New Note',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: () => {
          this.onCreateNote();
        },
      },
      {
        type: 'separator',
      },
      {
        label: '🔍 Search Notes',
        accelerator: 'CmdOrCtrl+Shift+F',
        click: () => {
          this.onShowSearch();
        },
      },
      {
        type: 'separator',
      },
      {
        label: `${alwaysOnTop ? '✅' : '☐'} Always on Top`,
        accelerator: 'CmdOrCtrl+Shift+A',
        click: () => {
          (global as any).postItApp?.toggleAlwaysOnTopGlobal();
        },
      },
    ];

    // Add notes section if there are any notes
    if (notes.length > 0) {
      menuTemplate.push({
        type: 'separator',
      });

      menuTemplate.push({
        label: `📋 Notes (${notes.length})`,
        enabled: false,
      });

      // Add each note with status indicator
      notes.slice(0, 10).forEach(note => {
        // Limit to 10 notes to avoid menu overflow
        const noteTitle =
          this.getNoteTitle(note.content) || `Note ${note.id.slice(0, 8)}`;
        const isOpen = this.onCheckWindowExists(note.id);
        const statusIcon = isOpen ? '🟢' : '⚪';

        menuTemplate.push({
          label: `${statusIcon} ${noteTitle}`,
          click: () => {
            if (isOpen) {
              this.onFocusNote(note.id);
            } else {
              // Need to create note window if it doesn't exist
              this.onFocusNote(note.id);
            }
          },
        });
      });

      // Add "Show more..." if there are more than 10 notes
      if (notes.length > 10) {
        menuTemplate.push({
          label: `... and ${notes.length - 10} more`,
          click: () => {
            this.onShowSearch();
          },
        });
      }
    }

    menuTemplate.push(
      {
        type: 'separator',
      },
      {
        label: '⚙️ Settings',
        click: () => {
          this.onShowSettings();
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'About PostIt',
        click: () => {
          this.showAbout();
        },
      },
      {
        type: 'separator',
      },
      {
        label: '🚪 Quit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit();
        },
      }
    );

    const contextMenu = Menu.buildFromTemplate(menuTemplate);
    this.tray?.setContextMenu(contextMenu);
  }

  private getNoteTitle(content: string): string {
    if (!content) return '';

    // Extract first line as title, clean up markdown
    const firstLine = content.split('\n')[0].trim();
    return firstLine
      .replace(/^#+\s*/, '') // Remove markdown headers
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '') // Remove italic markdown
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with text
      .replace(/@\w+/g, '') // Remove mentions
      .substring(0, 50) // Limit length
      .trim();
  }

  private showAbout() {
    const aboutWindow = new BrowserWindow({
      width: 400,
      height: 300,
      resizable: false,
      minimizable: false,
      maximizable: false,
      alwaysOnTop: true,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Create simple about content
    const aboutHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>About PostIt</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            height: 100vh;
            box-sizing: border-box;
          }
          h1 { margin: 0 0 10px 0; font-size: 2em; }
          .version { opacity: 0.8; margin-bottom: 20px; }
          .description { line-height: 1.6; margin-bottom: 30px; }
          .features { text-align: left; margin: 0 auto; max-width: 280px; }
          .features li { margin: 5px 0; }
        </style>
      </head>
      <body>
        <h1>📝 PostIt</h1>
        <div class="version">Version 1.0.0</div>
        <div class="description">
          Beautiful sticky notes for your desktop with rich text support, 
          task management, and intelligent note linking.
        </div>
        <ul class="features">
          <li>✅ Markdown support with live preview</li>
          <li>📋 Todo lists with nested subtasks</li>
          <li>🏷️ Tag-based organization</li>
          <li>🔗 @-mention note linking</li>
          <li>💾 Auto-save functionality</li>
          <li>🎨 Color-coded notes</li>
        </ul>
      </body>
      </html>
    `;

    aboutWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(aboutHTML)}`
    );

    // Center the window
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } =
      primaryDisplay.workAreaSize;
    const x = Math.floor((screenWidth - 400) / 2);
    const y = Math.floor((screenHeight - 300) / 2);
    aboutWindow.setPosition(x, y);

    // Auto-close after 10 seconds
    setTimeout(() => {
      if (!aboutWindow.isDestroyed()) {
        aboutWindow.close();
      }
    }, 10000);
  }

  private createTrayIcon(): string {
    // Create a simple SVG icon for the system tray that works well in both light and dark modes
    // Use high contrast colors to ensure visibility in all system tray contexts
    const svg = `
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="11" height="9" rx="1" fill="#FFE066" stroke="#D4AF37" stroke-width="1"/>
        <line x1="4" y1="4" x2="11" y2="4" stroke="#8B7355" stroke-width="0.8"/>
        <line x1="4" y1="6" x2="9" y2="6" stroke="#8B7355" stroke-width="0.8"/>
        <line x1="4" y1="8" x2="10" y2="8" stroke="#8B7355" stroke-width="0.8"/>
        <circle cx="13" cy="3" r="1.5" fill="#007AFF" stroke="#FFFFFF" stroke-width="0.5"/>
      </svg>
    `;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  public updateTrayTitle(noteCount: number) {
    if (this.tray) {
      // Always show an icon character to ensure tray remains visible
      // Use a subtle dot when no notes, or the count when there are notes
      const title = noteCount > 0 ? `${noteCount}` : '●';
      this.tray.setTitle(title);
      this.tray.setToolTip(
        `PostIt - ${noteCount} note${noteCount !== 1 ? 's' : ''}`
      );
      // Update context menu with latest notes
      this.updateContextMenu();
    }
  }

  public updateTrayMenu() {
    this.updateContextMenu();
  }

  public destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
