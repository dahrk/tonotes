import { contextBridge, ipcRenderer } from 'electron';
import type { Note, CreateNoteRequest, UpdateNoteRequest, Tag } from '../types';

const electronAPI = {
  // Note operations
  createNote: (request: CreateNoteRequest) =>
    ipcRenderer.invoke('create-note', request),
  updateNote: (request: UpdateNoteRequest) =>
    ipcRenderer.invoke('update-note', request),
  deleteNote: (noteId: string) => ipcRenderer.invoke('delete-note', noteId),
  getNote: (noteId: string) => ipcRenderer.invoke('get-note', noteId),
  getAllNotes: () => ipcRenderer.invoke('get-all-notes'),
  searchNotes: (query: string) => ipcRenderer.invoke('search-notes', query),

  // Tag operations
  createTag: (name: string) => ipcRenderer.invoke('create-tag', name),
  addTagToNote: (noteId: string, tagId: number) =>
    ipcRenderer.invoke('add-tag-to-note', noteId, tagId),
  removeTagFromNote: (noteId: string, tagId: number) =>
    ipcRenderer.invoke('remove-tag-from-note', noteId, tagId),
  getNoteTags: (noteId: string) => ipcRenderer.invoke('get-note-tags', noteId),
  getAllTags: () => ipcRenderer.invoke('get-all-tags'),

  // Window operations
  closeWindow: () => ipcRenderer.invoke('close-window'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  focusNote: (noteId: string) => ipcRenderer.invoke('focus-note', noteId),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
  openSearch: () => ipcRenderer.invoke('open-search'),

  // Event listeners
  onNoteUpdated: (callback: (note: Note) => void) => {
    ipcRenderer.on('note-updated', (_, note) => callback(note));
  },

  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('note-updated');
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
