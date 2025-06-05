import React, { useState, useCallback, useRef, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface NoteEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  placeholder?: string;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  content,
  onChange,
  onSave,
  placeholder = "Start typing..."
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
      
      // CMD+E to toggle preview
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        setIsPreviewMode(prev => !prev);
      }

      // Enter key handling for task lists
      if (!isPreviewMode && textareaRef.current && e.key === 'Enter') {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const lines = content.split('\n');
        
        // Find current line
        let currentPos = 0;
        let currentLineIndex = 0;
        
        for (let i = 0; i < lines.length; i++) {
          if (currentPos <= start && start <= currentPos + lines[i].length) {
            currentLineIndex = i;
            break;
          }
          currentPos += lines[i].length + 1;
        }
        
        const currentLine = lines[currentLineIndex];
        const taskMatch = currentLine.match(/^(\s*)([-*+])\s+(\[[ x]\])?\s*(.*)/);
        
        if (taskMatch) {
          const [, indentation, marker, checkbox, content] = taskMatch;
          
          // If the task content is empty, remove the task marker
          if (!content.trim()) {
            e.preventDefault();
            const newLines = [...lines];
            newLines[currentLineIndex] = indentation; // Just keep indentation
            
            const newContent = newLines.join('\n');
            onChange(newContent);
            
            // Position cursor at end of line
            setTimeout(() => {
              if (textarea) {
                const newPos = lines.slice(0, currentLineIndex).join('\n').length + 
                             (currentLineIndex > 0 ? 1 : 0) + indentation.length;
                textarea.selectionStart = newPos;
                textarea.selectionEnd = newPos;
                textarea.focus();
              }
            }, 0);
            return;
          }
          
          // Create new task item with same indentation and checkbox
          e.preventDefault();
          const newTaskLine = `${indentation}${marker} ${checkbox || '[ ]'} `;
          const beforeCursor = content.substring(0, start);
          const afterCursor = content.substring(start);
          
          const newContent = beforeCursor + '\n' + newTaskLine + afterCursor;
          onChange(newContent);
          
          // Position cursor after the new task marker
          setTimeout(() => {
            if (textarea) {
              const newPos = start + 1 + newTaskLine.length;
              textarea.selectionStart = newPos;
              textarea.selectionEnd = newPos;
              textarea.focus();
            }
          }, 0);
        }
      }

      // Tab and Shift+Tab for indentation (when in edit mode)
      if (!isPreviewMode && textareaRef.current && (e.key === 'Tab')) {
        e.preventDefault();
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const lines = content.split('\n');
        
        // Find which line(s) are selected
        let currentPos = 0;
        let startLine = 0;
        let endLine = 0;
        
        for (let i = 0; i < lines.length; i++) {
          if (currentPos <= start && start <= currentPos + lines[i].length) {
            startLine = i;
          }
          if (currentPos <= end && end <= currentPos + lines[i].length) {
            endLine = i;
            break;
          }
          currentPos += lines[i].length + 1; // +1 for newline
        }

        // Modify the selected lines
        const newLines = [...lines];
        let selectionOffset = 0;

        for (let i = startLine; i <= endLine; i++) {
          const line = newLines[i];
          const isTaskLine = line.trim().match(/^[-*+]\s+(\[[ x]\])?\s*/);
          
          if (e.shiftKey) {
            // Remove indentation (Shift+Tab)
            if (isTaskLine) {
              // For task lines, remove 2 spaces but keep the list marker
              if (line.startsWith('  ')) {
                newLines[i] = line.substring(2);
                if (i === startLine) selectionOffset -= 2;
              }
            } else {
              // For regular lines, remove 2 spaces
              if (line.startsWith('  ')) {
                newLines[i] = line.substring(2);
                if (i === startLine) selectionOffset -= 2;
              }
            }
          } else {
            // Add indentation (Tab)
            if (isTaskLine) {
              // Check current indentation level
              const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
              
              // Limit to 2 levels of indentation (0, 2, 4 spaces)
              if (leadingSpaces < 4) {
                newLines[i] = '  ' + line;
                if (i === startLine) selectionOffset += 2;
              }
            } else {
              // For regular lines, add 2 spaces
              newLines[i] = '  ' + line;
              if (i === startLine) selectionOffset += 2;
            }
          }
        }

        const newContent = newLines.join('\n');
        onChange(newContent);

        // Restore cursor position
        setTimeout(() => {
          if (textarea) {
            textarea.selectionStart = start + selectionOffset;
            textarea.selectionEnd = end + selectionOffset;
            textarea.focus();
          }
        }, 0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [content, isPreviewMode, onChange, onSave]);

  // Handle task toggle from markdown renderer
  const handleTaskToggle = useCallback((lineIndex: number, completed: boolean) => {
    const lines = content.split('\n');
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      
      // Toggle checkbox in markdown
      if (completed) {
        lines[lineIndex] = line.replace(/- \[ \]/, '- [x]');
      } else {
        lines[lineIndex] = line.replace(/- \[x\]/, '- [ ]');
      }
      
      onChange(lines.join('\n'));
    }
  }, [content, onChange]);

  // Calculate task progress
  const getTaskProgress = useCallback(() => {
    const taskLines = content.split('\n').filter(line => 
      line.trim().match(/^[-*+]\s+\[[ x]\]/)
    );
    const completedTasks = taskLines.filter(line => 
      line.includes('[x]')
    ).length;
    
    return taskLines.length > 0 ? { completed: completedTasks, total: taskLines.length } : null;
  }, [content]);

  const taskProgress = getTaskProgress();

  if (isPreviewMode) {
    return (
      <div className="note-content relative">
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => setIsPreviewMode(false)}
            className="preview-toggle-button"
            title="Edit mode (CMD+E)"
          >
            ✏️
          </button>
        </div>
        <div className="h-full overflow-y-auto pr-8">
          <MarkdownRenderer 
            content={content} 
            onTaskToggle={handleTaskToggle}
          />
        </div>
        {taskProgress && (
          <div className="absolute bottom-2 right-2 text-xs bg-black bg-opacity-20 px-2 py-1 rounded">
            {taskProgress.completed}/{taskProgress.total}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="note-content relative">
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={() => setIsPreviewMode(true)}
          className="preview-toggle-button"
          title="Preview mode (CMD+E)"
        >
          👁️
        </button>
      </div>
      <textarea
        ref={textareaRef}
        className="note-textarea"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {taskProgress && (
        <div className="absolute bottom-2 right-2 text-xs bg-black bg-opacity-20 px-2 py-1 rounded">
          {taskProgress.completed}/{taskProgress.total}
        </div>
      )}
    </div>
  );
};

export default NoteEditor;