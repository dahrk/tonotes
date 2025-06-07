import React, { useState } from 'react';
import TiptapEditor from './TiptapEditor';
import DraggableLineEditor from './DraggableLineEditor';

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
  const [isDragMode, setIsDragMode] = useState(false);

  return (
    <div className="relative h-full">
      {/* Mode toggle button */}
      <button
        onClick={() => setIsDragMode(!isDragMode)}
        className="absolute top-2 right-2 z-10 mode-toggle rounded-full p-2 shadow-sm text-xs"
        title={isDragMode ? "Switch to rich editor" : "Switch to drag mode"}
      >
        {isDragMode ? "📝" : "⋮⋮"}
      </button>

      {isDragMode ? (
        <DraggableLineEditor
          content={content}
          onChange={onChange}
          onSave={onSave}
          placeholder={placeholder}
          onNoteLink={onNoteLink}
        />
      ) : (
        <TiptapEditor
          content={content}
          onChange={onChange}
          onSave={onSave}
          placeholder={placeholder}
          onNoteLink={onNoteLink}
        />
      )}
    </div>
  );
};

export default NoteEditor;