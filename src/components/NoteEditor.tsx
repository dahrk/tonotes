import React from 'react';
import MilkdownEditor from './MilkdownEditor';

interface NoteEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  placeholder?: string;
  onNoteLink?: (noteId: string) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  content,
  onChange,
  onSave,
  placeholder = "Start typing...",
  onNoteLink
}) => {
  return (
    <MilkdownEditor
      content={content}
      onChange={onChange}
      onSave={onSave}
      placeholder={placeholder}
      onNoteLink={onNoteLink}
    />
  );
};

export default NoteEditor;