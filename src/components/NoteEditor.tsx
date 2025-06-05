import React, { useState, useCallback, useRef, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import MentionSearch from './MentionSearch';

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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showMentionSearch, setShowMentionSearch] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionStartPos, setMentionStartPos] = useState(0);
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

  // Handle @ symbol detection and mention search
  const detectMention = useCallback((text: string, cursorPosition: number) => {
    const beforeCursor = text.substring(0, cursorPosition);
    const atMatch = beforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      const query = atMatch[1];
      const mentionStart = cursorPosition - atMatch[0].length;
      
      if (textareaRef.current) {
        // Calculate position for dropdown
        const textarea = textareaRef.current;
        const rect = textarea.getBoundingClientRect();
        const lineHeight = 20; // Approximate line height
        const lines = beforeCursor.split('\n');
        const currentLine = lines.length - 1;
        const currentColumn = lines[lines.length - 1].length;
        
        setMentionPosition({
          top: rect.top + (currentLine * lineHeight) + lineHeight,
          left: rect.left + (currentColumn * 8) // Approximate character width
        });
        setMentionStartPos(mentionStart);
        setMentionQuery(query);
        setShowMentionSearch(true);
      }
    } else {
      setShowMentionSearch(false);
      setMentionQuery('');
    }
  }, []);

  // Handle mention selection
  const handleMentionSelect = useCallback((selectedNote: any) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const beforeMention = content.substring(0, mentionStartPos);
    const afterCursor = content.substring(textarea.selectionStart);
    
    // Create the mention link
    const mentionText = `@${selectedNote.title || 'note'}`;
    const mentionLink = `[@${selectedNote.title || 'note'}](note://${selectedNote.id})`;
    
    const newContent = beforeMention + mentionLink + afterCursor;
    onChange(newContent);
    
    // Position cursor after the mention
    setTimeout(() => {
      if (textarea) {
        const newPosition = beforeMention.length + mentionLink.length;
        textarea.selectionStart = newPosition;
        textarea.selectionEnd = newPosition;
        textarea.focus();
      }
    }, 0);
    
    setShowMentionSearch(false);
    setMentionQuery('');
  }, [content, mentionStartPos, onChange]);

  // Handle mention search close
  const handleMentionClose = useCallback(() => {
    setShowMentionSearch(false);
    setMentionQuery('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Handle content change with mention detection
  const handleContentChange = useCallback((newContent: string) => {
    onChange(newContent);
    
    if (textareaRef.current && !isPreviewMode) {
      const cursorPosition = textareaRef.current.selectionStart;
      detectMention(newContent, cursorPosition);
    }
  }, [onChange, isPreviewMode, detectMention]);

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
            onNoteLink={onNoteLink}
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
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder={placeholder}
      />
      {taskProgress && (
        <div className="absolute bottom-2 right-2 text-xs bg-black bg-opacity-20 px-2 py-1 rounded">
          {taskProgress.completed}/{taskProgress.total}
        </div>
      )}
      
      {/* Mention search dropdown */}
      <MentionSearch
        position={mentionPosition}
        query={mentionQuery}
        onSelect={handleMentionSelect}
        onClose={handleMentionClose}
        isVisible={showMentionSearch}
      />
    </div>
  );
};

export default NoteEditor;