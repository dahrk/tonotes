import React, { useState, useEffect } from 'react';

export interface AppSettings {
  launchOnStartup: boolean;
  theme: 'system' | 'light' | 'dark';
  autoSaveInterval: number;
  alwaysOnTop: boolean;
}

interface SettingsWindowProps {
  theme?: 'light' | 'dark';
}

const SettingsWindow: React.FC<SettingsWindowProps> = ({ theme = 'light' }) => {
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [settings, setSettings] = useState<AppSettings>({
    launchOnStartup: false,
    theme: 'system',
    autoSaveInterval: 30000,
    alwaysOnTop: true,
  });

  useEffect(() => {
    // Load current settings when component mounts
    loadSettings();

    // Expose theme update function to global scope for Electron IPC
    (window as any).updateTheme = (newTheme: 'light' | 'dark') => {
      setCurrentTheme(newTheme);
    };

    return () => {
      // Cleanup
      delete (window as any).updateTheme;
    };
  }, []);

  useEffect(() => {
    // Apply theme to document body
    document.body.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const loadSettings = async () => {
    try {
      if (window.electronAPI?.getSettings) {
        const currentSettings = await window.electronAPI.getSettings();
        setSettings(currentSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleInputChange = (field: keyof AppSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveSettings = async () => {
    try {
      await window.electronAPI?.saveSettings(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const deleteAllNotes = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete ALL notes? This action cannot be undone.'
      )
    ) {
      try {
        await window.electronAPI?.deleteAllNotes();
      } catch (error) {
        console.error('Failed to delete notes:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      window.electronAPI?.closeSettings();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      saveSettings();
    }
  };

  const closeSettings = () => {
    window.electronAPI?.closeSettings();
  };

  return (
    <div className="settings-app" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="settings-container">
        <div className="settings-title">⚙️ Settings</div>

        <div className="setting-group">
          <div className="setting-label">Startup</div>
          <div className="setting-description">
            Configure how PostIt behaves when your computer starts
          </div>
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="launchOnStartup"
              className="checkbox"
              checked={settings.launchOnStartup}
              onChange={e =>
                handleInputChange('launchOnStartup', e.target.checked)
              }
            />
            <label htmlFor="launchOnStartup">
              Launch PostIt when computer starts
            </label>
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-label">Appearance</div>
          <div className="setting-description">
            Choose how PostIt looks on your system
          </div>
          <div className="select-container">
            <select
              id="theme"
              className="select"
              value={settings.theme}
              onChange={e =>
                handleInputChange(
                  'theme',
                  e.target.value as 'system' | 'light' | 'dark'
                )
              }
            >
              <option value="system">System (Auto)</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-label">Auto-save</div>
          <div className="setting-description">
            How often should notes be automatically saved (in seconds)
          </div>
          <div className="inline-setting">
            <input
              type="number"
              id="autoSaveInterval"
              className="number-input"
              min="5"
              max="300"
              value={settings.autoSaveInterval / 1000}
              onChange={e =>
                handleInputChange(
                  'autoSaveInterval',
                  parseInt(e.target.value) * 1000
                )
              }
            />
            <span>seconds</span>
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-label">Window Behavior</div>
          <div className="setting-description">
            Configure how note windows behave on your desktop
          </div>
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="alwaysOnTop"
              className="checkbox"
              checked={settings.alwaysOnTop}
              onChange={e => handleInputChange('alwaysOnTop', e.target.checked)}
            />
            <label htmlFor="alwaysOnTop">
              Keep notes always on top of other windows
            </label>
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-label">Danger Zone</div>
          <div className="setting-description">
            Careful! These actions cannot be undone
          </div>
          <button className="button button-danger" onClick={deleteAllNotes}>
            🗑️ Delete All Notes
          </button>
        </div>

        <div className="buttons-container">
          <button className="button button-cancel" onClick={closeSettings}>
            Cancel
          </button>
          <button className="button button-save" onClick={saveSettings}>
            Save Changes
          </button>
        </div>
      </div>

      <style>{`
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

        .settings-app {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          outline: none;
        }
        
        .settings-container {
          background: var(--bg-secondary);
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 410px;
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
        
        .button-danger {
          background: #dc3545;
          color: white;
          width: 100%;
        }
        
        .button-danger:hover {
          background: #c82333;
        }
        
        .inline-setting {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        label {
          cursor: pointer;
          user-select: none;
        }
      `}</style>
    </div>
  );
};

export default SettingsWindow;
