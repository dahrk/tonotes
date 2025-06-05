import React, { useState, useEffect, useCallback } from 'react';
import type { Note } from '../types';

const App: React.FC = () => {
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const loadNote = useCallback(async (noteId: string) => {
    try {
      const loadedNote = await window.electronAPI.getNote(noteId);
      if (loadedNote) {
        setNote(loadedNote);
      }
    } catch (error) {
      console.error('Failed to load note:', error);
    }
  }, []);

  const saveNote = useCallback(async () => {
    if (!note || !hasUnsavedChanges) return;
    
    try {
      await window.electronAPI.updateNote({
        id: note.id,
        content: note.content
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  }, [note, hasUnsavedChanges]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get('noteId');
    
    if (noteId) {
      loadNote(noteId);
    }
    setIsLoading(false);
  }, [loadNote]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-600">Note not found</div>
      </div>
    );
  }

  const backgroundClass = `note-${note.color}`;

  return (
    <div className={`w-full h-full ${backgroundClass} shadow-lg border border-gray-300`}>
      {/* Header */}
      <div className="h-8 bg-black bg-opacity-10 flex items-center justify-between px-2 cursor-move">
        <div className="flex items-center space-x-1">
          {/* Tags placeholder */}
          <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full">
            sample-tag
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {/* Save button */}
          {hasUnsavedChanges && (
            <button 
              onClick={saveNote}
              className="w-4 h-4 bg-white bg-opacity-50 rounded text-xs flex items-center justify-center hover:bg-opacity-75"
            >
              💾
            </button>
          )}
          {/* Close button */}
          <button 
            onClick={() => window.electronAPI.closeWindow()}
            className="w-4 h-4 bg-red-500 bg-opacity-50 rounded text-xs flex items-center justify-center hover:bg-opacity-75"
          >
            ×
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3 h-full">
        <textarea
          className="w-full h-full bg-transparent border-none outline-none resize-none text-sm"
          value={note.content}
          onChange={(e) => {
            setNote({ ...note, content: e.target.value });
            setHasUnsavedChanges(true);
          }}
          placeholder="Start typing..."
        />
      </div>
      
      {/* Resize handle */}
      <div className="absolute bottom-0 left-0 w-4 h-4 cursor-nw-resize bg-gray-400 bg-opacity-50 hover:bg-opacity-75"></div>
    </div>
  );
};

export default App;