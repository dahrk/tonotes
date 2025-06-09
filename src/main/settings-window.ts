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

    const settingsHTML = this.createSettingsHTML();
    this.window.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(settingsHTML)}`
    );

    this.window.on('closed', () => {
      this.window = null;
    });
  }

  private createSettingsHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Settings</title>
        <style>
          :root {
            --bg-primary: #f5f5f5;
            --bg-secondary: white;
            --text-primary: #333;
            --text-secondary: #666;
            --border-color: #e0e0e0;
            --input-border: #ccc;
            --hover-bg: #e0e0e0;
            --focus-color: #007AFF;
            --button-bg: #f0f0f0;
            --button-primary: #007AFF;
            --button-primary-hover: #0056CC;
          }

          [data-theme="dark"] {
            --bg-primary: #1e1e1e;
            --bg-secondary: #2d2d2d;
            --text-primary: #ffffff;
            --text-secondary: #cccccc;
            --border-color: #404040;
            --input-border: #555555;
            --hover-bg: #3d3d3d;
            --focus-color: #64a0ff;
            --button-bg: #404040;
            --button-primary: #64a0ff;
            --button-primary-hover: #5090ff;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 20px;
            background: var(--bg-primary);
            color: var(--text-primary);
          }
          
          .settings-container {
            background: var(--bg-secondary);
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          .settings-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
            color: var(--text-primary);
            text-align: center;
          }
          
          .setting-group {
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--border-color);
          }
          
          .setting-group:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          
          .setting-label {
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--text-primary);
          }
          
          .setting-description {
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 12px;
            line-height: 1.4;
          }
          
          .checkbox-container {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .checkbox {
            width: 16px;
            height: 16px;
            accent-color: #007AFF;
          }
          
          .select-container {
            position: relative;
          }
          
          .select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--input-border);
            border-radius: 6px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            font-size: 14px;
            outline: none;
          }
          
          .select:focus {
            border-color: var(--focus-color);
          }
          
          .number-input {
            width: 80px;
            padding: 8px 12px;
            border: 1px solid var(--input-border);
            border-radius: 6px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            font-size: 14px;
            outline: none;
          }
          
          .number-input:focus {
            border-color: var(--focus-color);
          }
          
          .buttons-container {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid var(--border-color);
          }
          
          .button {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: background-color 0.2s ease;
          }
          
          .button-cancel {
            background: var(--button-bg);
            color: var(--text-primary);
          }
          
          .button-cancel:hover {
            background: var(--hover-bg);
          }
          
          .button-save {
            background: var(--button-primary);
            color: white;
          }
          
          .button-save:hover {
            background: var(--button-primary-hover);
          }
          
          .inline-setting {
            display: flex;
            align-items: center;
            gap: 8px;
          }
        </style>
      </head>
      <body data-theme="light">
        <div class="settings-container">
          <div class="settings-title">⚙️ Settings</div>
          
          <div class="setting-group">
            <div class="setting-label">Startup</div>
            <div class="setting-description">
              Configure how PostIt behaves when your computer starts
            </div>
            <div class="checkbox-container">
              <input 
                type="checkbox" 
                id="launchOnStartup" 
                class="checkbox"
                ${this.settings.launchOnStartup ? 'checked' : ''}
              />
              <label for="launchOnStartup">Launch PostIt when computer starts</label>
            </div>
          </div>
          
          <div class="setting-group">
            <div class="setting-label">Appearance</div>
            <div class="setting-description">
              Choose how PostIt looks on your system
            </div>
            <div class="select-container">
              <select id="theme" class="select">
                <option value="system" ${this.settings.theme === 'system' ? 'selected' : ''}>System (Auto)</option>
                <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>Light</option>
                <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
              </select>
            </div>
          </div>
          
          <div class="setting-group">
            <div class="setting-label">Auto-save</div>
            <div class="setting-description">
              How often should notes be automatically saved (in seconds)
            </div>
            <div class="inline-setting">
              <input 
                type="number" 
                id="autoSaveInterval" 
                class="number-input"
                min="5"
                max="300"
                value="${this.settings.autoSaveInterval / 1000}"
              />
              <span>seconds</span>
            </div>
          </div>
          
          <div class="setting-group">
            <div class="setting-label">Window Behavior</div>
            <div class="setting-description">
              Configure how note windows behave on your desktop
            </div>
            <div class="checkbox-container">
              <input 
                type="checkbox" 
                id="alwaysOnTop" 
                class="checkbox"
                ${this.settings.alwaysOnTop ? 'checked' : ''}
              />
              <label for="alwaysOnTop">Keep notes always on top of other windows</label>
            </div>
          </div>
          
          <div class="buttons-container">
            <button class="button button-cancel" onclick="window.electronAPI.closeSettings()">
              Cancel
            </button>
            <button class="button button-save" onclick="saveSettings()">
              Save Changes
            </button>
          </div>
        </div>

        <script>
          function saveSettings() {
            const settings = {
              launchOnStartup: document.getElementById('launchOnStartup').checked,
              theme: document.getElementById('theme').value,
              autoSaveInterval: parseInt(document.getElementById('autoSaveInterval').value) * 1000,
              alwaysOnTop: document.getElementById('alwaysOnTop').checked
            };
            
            window.electronAPI.saveSettings(settings);
          }
          
          // Handle keyboard shortcuts
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              window.electronAPI.closeSettings();
            } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
              e.preventDefault();
              saveSettings();
            }
          });
        </script>
      </body>
      </html>
    `;
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
  }

  public getSettings(): AppSettings {
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
      `);
    }
  }

  public destroy() {
    this.close();
  }
}
