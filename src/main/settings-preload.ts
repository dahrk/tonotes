import { contextBridge, ipcRenderer } from 'electron';
import type { AppSettings } from './settings-window';

const settingsAPI = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: AppSettings) =>
    ipcRenderer.invoke('save-settings', settings),
  closeSettings: () => ipcRenderer.invoke('close-settings'),
  deleteAllNotes: () => ipcRenderer.invoke('delete-all-notes'),
};

contextBridge.exposeInMainWorld('electronAPI', settingsAPI);

export type SettingsAPI = typeof settingsAPI;
