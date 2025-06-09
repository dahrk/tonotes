import React from 'react';
import TiptapEditor from './TiptapEditor';

interface NoteEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  placeholder?: string;
  onNoteLink?: (noteId: string) => void;
  onCreateNote?: () => void;
  onToggleAlwaysOnTop?: () => void;
  onOpenSearch?: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  content,
  onChange,
  onSave,
  placeholder = 'Start typing...',
  onNoteLink,
  onCreateNote,
  onToggleAlwaysOnTop,
  onOpenSearch,
}) => {
  return (
    <TiptapEditor
      content={content}
      onChange={onChange}
      onSave={onSave}
      placeholder={placeholder}
      onNoteLink={onNoteLink}
      onCreateNote={onCreateNote}
      onToggleAlwaysOnTop={onToggleAlwaysOnTop}
      onOpenSearch={onOpenSearch}
    />
  );
};

export default NoteEditor;
