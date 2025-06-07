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
  const [showMentionSearch, setShowMentionSearch] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }

      // Enter key handling for automatic indentation and task lists
      if (textareaRef.current && e.key === 'Enter') {
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
        
        // Check if it's a task line
        const taskMatch = currentLine.match(/^(\s*)([-*+])\s+(\[[ x]\])?\s*(.*)/);
        
        if (taskMatch) {
          const [, indentation, marker, checkbox, taskContent] = taskMatch;
          
          // If the task content is empty, remove the task marker and just maintain indentation
          if (!taskContent.trim()) {
            e.preventDefault();
            const newLines = [...lines];
            newLines[currentLineIndex] = indentation;
            
            const newContent = newLines.join('\n');
            onChange(newContent);
            
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
          
          setTimeout(() => {
            if (textarea) {
              const newPos = start + 1 + newTaskLine.length;
              textarea.selectionStart = newPos;
              textarea.selectionEnd = newPos;
              textarea.focus();
            }
          }, 0);
        } else {
          // Regular line - maintain indentation
          const indentMatch = currentLine.match(/^(\s*)/);
          const indentation = indentMatch ? indentMatch[1] : '';
          
          if (indentation) {
            e.preventDefault();
            const beforeCursor = content.substring(0, start);
            const afterCursor = content.substring(start);
            
            const newContent = beforeCursor + '\n' + indentation + afterCursor;
            onChange(newContent);
            
            setTimeout(() => {
              if (textarea) {
                const newPos = start + 1 + indentation.length;
                textarea.selectionStart = newPos;
                textarea.selectionEnd = newPos;
                textarea.focus();
              }
            }, 0);
          }
        }
      }

      // Tab and Shift+Tab for indentation
      if (textareaRef.current && e.key === 'Tab') {
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
          currentPos += lines[i].length + 1;
        }

        const newLines = [...lines];
        let selectionOffset = 0;

        for (let i = startLine; i <= endLine; i++) {
          const line = newLines[i];
          
          if (e.shiftKey) {
            // Remove indentation (Shift+Tab)
            if (line.startsWith('  ')) {
              newLines[i] = line.substring(2);
              if (i === startLine) selectionOffset -= 2;
            }
          } else {
            // Add indentation (Tab)
            newLines[i] = '  ' + line;
            if (i === startLine) selectionOffset += 2;
          }
        }

        const newContent = newLines.join('\n');
        onChange(newContent);

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
  }, [content, onChange, onSave]);

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
        const textarea = textareaRef.current;
        const rect = textarea.getBoundingClientRect();
        const lineHeight = 20;
        const lines = beforeCursor.split('\n');
        const currentLine = lines.length - 1;
        const currentColumn = lines[lines.length - 1].length;
        
        setMentionPosition({
          top: rect.top + (currentLine * lineHeight) + lineHeight,
          left: rect.left + (currentColumn * 8)
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
    
    const mentionLink = `[@${selectedNote.title || 'note'}](note://${selectedNote.id})`;
    const newContent = beforeMention + mentionLink + afterCursor;
    onChange(newContent);
    
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

  const handleMentionClose = useCallback(() => {
    setShowMentionSearch(false);
    setMentionQuery('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleContentChange = useCallback((newContent: string) => {
    onChange(newContent);
    
    if (textareaRef.current) {
      const cursorPosition = textareaRef.current.selectionStart;
      detectMention(newContent, cursorPosition);
    }
  }, [onChange, detectMention]);

  const taskProgress = getTaskProgress();

  return (
    <div ref={containerRef} className="note-content relative">
      {/* Split view: textarea on left, markdown on right */}
      <div className="h-full flex">
        {/* Textarea for editing */}
        <div className="w-1/2 h-full relative">
          <textarea
            ref={textareaRef}
            className="note-textarea border-r border-black border-opacity-10"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={placeholder}
            style={{ resize: 'none' }}
          />
        </div>
        
        {/* Markdown preview */}
        <div className="w-1/2 h-full overflow-y-auto pl-3">
          <MarkdownRenderer 
            content={content} 
            onTaskToggle={handleTaskToggle}
            onNoteLink={onNoteLink}
          />
        </div>
      </div>
      
      {/* Task progress indicator */}
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