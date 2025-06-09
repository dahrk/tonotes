import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import NoteEditor from '../components/NoteEditor';
import TagInput from '../components/TagInput';
import type { Note, Tag } from '../types';

const App: React.FC = () => {
  const [note, setNote] = useState<Note | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadNote = useCallback(async (noteId: string) => {
    try {
      const loadedNote = await window.electronAPI.getNote(noteId);
      if (loadedNote) {
        setNote(loadedNote);

        // Load tags for this note
        const noteTags = await window.electronAPI.getNoteTags(noteId);
        setTags(noteTags);
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
        content: note.content,
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

  const handleNoteLink = useCallback(async (noteId: string) => {
    try {
      const success = await window.electronAPI.focusNote(noteId);
      if (!success) {
        // Note window doesn't exist, show alert
        alert(`Note not found or not currently open: ${noteId}`);
      }
    } catch (error) {
      console.error('Failed to focus note:', error);
      alert('Failed to open linked note');
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!note) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this note? This action cannot be undone.'
    );
    if (confirmed) {
      try {
        await window.electronAPI.deleteNote(note.id);
      } catch (error) {
        console.error('Failed to delete note:', error);
        alert('Failed to delete note');
      }
    }
  }, [note]);

  const handleCreateNote = useCallback(async () => {
    try {
      await window.electronAPI.createNote({});
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  }, []);

  const handleToggleAlwaysOnTop = useCallback(async () => {
    try {
      // This will be handled by the main process via IPC
      // We'll need to add this IPC method if it doesn't exist
      if (window.electronAPI.toggleAlwaysOnTop) {
        await window.electronAPI.toggleAlwaysOnTop();
      }
    } catch (error) {
      console.error('Failed to toggle always on top:', error);
    }
  }, []);

  const handleOpenSearch = useCallback(async () => {
    try {
      if (window.electronAPI.openSearch) {
        await window.electronAPI.openSearch();
      }
    } catch (error) {
      console.error('Failed to open search:', error);
    }
  }, []);

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
      {/* Header with proper spacing for macOS traffic lights */}
      <div className="note-header">
        {/* Left side with space for traffic lights */}
        <div className="flex items-center" style={{ marginLeft: '70px' }}>
          {/* Empty space where tags used to be */}
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          {/* Save button */}
          {hasUnsavedChanges && (
            <button
              onClick={saveNote}
              className="header-button"
              title="Save note (Cmd+S)"
            >
              💾
            </button>
          )}
          {/* Delete button */}
          <button
            onClick={handleDelete}
            className="header-button delete-button"
            title="Delete note"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Tags section below header */}
      <div className="tags-section">
        <TagInput noteId={note.id} tags={tags} onTagsChange={setTags} />
      </div>

      {/* Content */}
      <NoteEditor
        content={note.content}
        onChange={content => {
          setNote({ ...note, content });
          setHasUnsavedChanges(true);
          scheduleAutoSave();
        }}
        onSave={saveNote}
        onNoteLink={handleNoteLink}
        onCreateNote={handleCreateNote}
        onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
        onOpenSearch={handleOpenSearch}
        placeholder="Start typing..."
      />
    </div>
  );
};

export default App;
