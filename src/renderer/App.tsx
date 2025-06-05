import React, { useState, useEffect, useCallback, useRef } from 'react';
import NoteEditor from '../components/NoteEditor';
import type { Note } from '../types';

const App: React.FC = () => {
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      
      // Clear auto-save timeout since we just saved
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  }, [note, hasUnsavedChanges]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveNote();
    }, 30000); // 30 seconds
  }, [saveNote]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get('noteId');
    
    if (noteId) {
      loadNote(noteId);
    }
    setIsLoading(false);
  }, [loadNote]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

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
    <div className={`note-window ${backgroundClass}`}>
      {/* Header */}
      <div className="note-header">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {/* Tags placeholder */}
          <span className="text-xs bg-white bg-opacity-60 px-2 py-1 rounded-full whitespace-nowrap">
            sample-tag
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {/* Save button */}
          {hasUnsavedChanges && (
            <button 
              onClick={saveNote}
              className="header-button"
              title="Save note"
            >
              💾
            </button>
          )}
          {/* Close button */}
          <button 
            onClick={() => window.electronAPI.closeWindow()}
            className="header-button close-button"
            title="Close note"
          >
            ×
          </button>
        </div>
      </div>
      
      {/* Content */}
      <NoteEditor
        content={note.content}
        onChange={(content) => {
          setNote({ ...note, content });
          setHasUnsavedChanges(true);
          scheduleAutoSave();
        }}
        onSave={saveNote}
        placeholder="Start typing..."
      />
      
      {/* Resize handle */}
      <div className="resize-handle" title="Resize note"></div>
    </div>
  );
};

export default App;