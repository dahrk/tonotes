import { contextBridge, ipcRenderer } from 'electron';

const searchAPI = {
  searchAllNotes: (query: string) => ipcRenderer.invoke('search-all-notes', query),
  selectSearchResult: (noteId: string) => ipcRenderer.invoke('select-search-result', noteId),
  closeSearchWindow: () => ipcRenderer.invoke('close-search-window')
};

contextBridge.exposeInMainWorld('electronAPI', searchAPI);

export type SearchAPI = typeof searchAPI;