import { BrowserWindow, ipcMain, screen, app } from 'electron';
import * as path from 'path';

export interface AppSettings {
  launchOnStartup: boolean;
  theme: 'system' | 'light' | 'dark';
  autoSaveInterval: number;
  alwaysOnTop: boolean;
}

export class SettingsWindow {
  private window: BrowserWindow | null = null;
  private settings: AppSettings;

  constructor() {
    // Default settings
    this.settings = {
      launchOnStartup: false,
      theme: 'system',
      autoSaveInterval: 30000, // 30 seconds
      alwaysOnTop: true,
    };

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
      width: 450,
      height: 350,
      x: Math.floor((screenWidth - 450) / 2),
      y: Math.floor((screenHeight - 350) / 2),
      resizable: false,
      minimizable: false,
      maximizable: false,
      alwaysOnTop: true,
      titleBarStyle: 'hiddenInset',
      title: 'PostIt Settings',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'settings-preload.js'),
      },
    });

    // Load settings interface
    if (process.env.NODE_ENV === 'development') {
      this.window.loadURL('http://localhost:5173/settings.html');
    } else {
      this.window.loadFile(path.join(__dirname, '../../settings.html'));
    }

    this.window.on('closed', () => {
      this.window = null;
    });
  }


  private setupIPCHandlers() {
    ipcMain.handle('get-settings', () => {
      return this.settings;
    });

    ipcMain.handle('save-settings', (_, newSettings: AppSettings) => {
      try {
        // Validate settings
        if (!newSettings || typeof newSettings !== 'object') {
          throw new Error('Invalid settings object');
        }

        // Validate theme setting
        if (
          newSettings.theme &&
          !['system', 'light', 'dark'].includes(newSettings.theme)
        ) {
          newSettings.theme = 'system';
        }

        // Validate auto-save interval (minimum 5 seconds, maximum 5 minutes)
        if (newSettings.autoSaveInterval) {
          newSettings.autoSaveInterval = Math.max(
            5000,
            Math.min(300000, newSettings.autoSaveInterval)
          );
        }

        this.settings = { ...this.settings, ...newSettings };

        // Handle launch on startup setting
        if (process.platform === 'darwin' || process.platform === 'win32') {
          try {
            app.setLoginItemSettings({
              openAtLogin: this.settings.launchOnStartup,
              name: 'PostIt',
            });
          } catch (error) {
            console.warn('Failed to set login item settings:', error);
          }
        }

        // Notify main process of theme change
        if ((global as any).postItApp) {
          (global as any).postItApp.handleSettingsChange(this.settings);
        }

        this.close();
        return this.settings;
      } catch (error) {
        console.error('Settings save error:', error);
        return this.settings;
      }
    });

    ipcMain.handle('close-settings', () => {
      this.close();
    });

    ipcMain.handle('delete-all-notes', () => {
      // Call the main app's delete all notes function
      if ((global as any).postItApp) {
        (global as any).postItApp.deleteAllNotes();
      }
    });
  }

  public getSettings(): AppSettings {
    return this.settings;
  }

  public updateSettings(newSettings: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...newSettings };

    // Handle launch on startup setting
    if (newSettings.launchOnStartup !== undefined) {
      if (process.platform === 'darwin' || process.platform === 'win32') {
        try {
          app.setLoginItemSettings({
            openAtLogin: this.settings.launchOnStartup,
            name: 'PostIt',
          });
        } catch (error) {
          console.warn('Failed to set login item settings:', error);
        }
      }
    }

    // Notify main process of changes
    if ((global as any).postItApp) {
      (global as any).postItApp.handleSettingsChange(this.settings);
    }

    return this.settings;
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

  public refreshSettings() {
    // If the settings window is open, refresh it to reflect current settings
    if (this.window && !this.window.isDestroyed()) {
      // With React, we can just trigger a reload of the page
      this.window.webContents.reload();
    }
  }

  public destroy() {
    this.close();
  }
}
