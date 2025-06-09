import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import MentionSearch from './MentionSearch';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  placeholder?: string;
  onNoteLink?: (noteId: string) => void;
  onCreateNote?: () => void;
  onToggleAlwaysOnTop?: () => void;
  onOpenSearch?: () => void;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onChange,
  onSave,
  placeholder = 'Start typing...',
  onNoteLink,
  onCreateNote,
  onToggleAlwaysOnTop,
  onOpenSearch,
}) => {
  const [showMentionSearch, setShowMentionSearch] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [lastContent, setLastContent] = useState(content);
  const [isUpdating, setIsUpdating] = useState(false);

  // Helper function to handle content initialization
  const initializeContent = (content: string) => {
    // Try to parse as JSON first (new format)
    try {
      if (content.trim().startsWith('{')) {
        return JSON.parse(content);
      }
    } catch (e) {
      // Not JSON, continue with legacy markdown handling
    }

    // Legacy markdown content - convert to minimal HTML for backward compatibility
    if (!content.trim()) return '<p></p>';
    
    // Simple markdown-to-HTML conversion for legacy data
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        // Headers
        if (line.match(/^#+\s/)) {
          const level = line.match(/^(#+)/)?.[1].length || 1;
          const text = line.replace(/^#+\s*/, '');
          return `<h${level}>${text}</h${level}>`;
        }
        // Task lists
        if (line.match(/^\s*- \[[ x]\]/)) {
          const checked = line.includes('[x]');
          const text = line.replace(/^\s*- \[[ x]\]\s*/, '');
          return `<ul data-type="taskList"><li data-type="taskItem" data-checked="${checked}">${text}</li></ul>`;
        }
        // Regular lists
        if (line.match(/^\s*- /)) {
          const text = line.replace(/^\s*- /, '');
          return `<ul><li>${text}</li></ul>`;
        }
        // Numbered lists
        if (line.match(/^\s*\d+\. /)) {
          const text = line.replace(/^\s*\d+\. /, '');
          return `<ol><li>${text}</li></ol>`;
        }
        // Regular paragraphs
        return `<p>${line}</p>`;
      })
      .join('');
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'tiptap-bullet-list',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'tiptap-ordered-list',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'tiptap-list-item',
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: 'tiptap-paragraph',
          },
        },
        heading: {
          HTMLAttributes: {
            class: 'tiptap-heading',
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'tiptap-code-block',
          },
        },
        code: {
          HTMLAttributes: {
            class: 'tiptap-code-inline',
          },
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'tiptap-task-list',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'tiptap-task-item',
        },
        nested: true,
      }),
      Link.configure({
        HTMLAttributes: {
          class: 'tiptap-link',
        },
        protocols: ['note'],
        validate: url => {
          return url.startsWith('note://') || /^https?:\/\//.test(url);
        },
      }),
      Typography,
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
      }),
    ],
    content: initializeContent(content), // Handle both JSON and legacy markdown
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-sm max-w-none focus:outline-none',
        spellcheck: 'false',
      },
      handleClick: (_, __, event) => {
        // Handle note link clicks
        const target = event.target as HTMLElement;
        if (target.tagName === 'A') {
          const href = target.getAttribute('href');
          if (href?.startsWith('note://') && onNoteLink) {
            event.preventDefault();
            const noteId = href.replace('note://', '');
            onNoteLink(noteId);
            return true;
          }
        }
        return false;
      },
      handleKeyDown: (view, event) => {
        // Handle Tab for indentation
        if (event.key === 'Tab') {
          event.preventDefault();

          // Check if we're in a task item and use Tiptap's built-in commands
          if (editor && editor.isActive('taskItem')) {
            if (event.shiftKey) {
              // Shift+Tab: Outdent task item
              if (editor.can().liftListItem('taskItem')) {
                editor.commands.liftListItem('taskItem');
                return true;
              }
            } else {
              // Tab: Indent task item
              if (editor.can().sinkListItem('taskItem')) {
                editor.commands.sinkListItem('taskItem');
                return true;
              }
            }
          }
          // Check if we're in a regular list item
          else if (editor && editor.isActive('listItem')) {
            if (event.shiftKey) {
              // Shift+Tab: Outdent list item
              if (editor.can().liftListItem('listItem')) {
                editor.commands.liftListItem('listItem');
                return true;
              }
            } else {
              // Tab: Indent list item
              if (editor.can().sinkListItem('listItem')) {
                editor.commands.sinkListItem('listItem');
                return true;
              }
            }
          }
          // Fallback: use manual space insertion for other content
          else {
            const { state, dispatch } = view;
            const { selection } = state;
            const { from, to } = selection;

            if (event.shiftKey) {
              // Shift+Tab: Remove indentation (unindent)
              const tr = state.tr;
              const textBefore = state.doc.textBetween(
                Math.max(0, from - 10),
                from
              );

              // Check if we can remove indentation (look for 2 spaces at start of line)
              const lineStart = textBefore.lastIndexOf('\n') + 1;
              const beforeLineStart = from - (textBefore.length - lineStart);
              const lineText = state.doc.textBetween(beforeLineStart, to);

              if (lineText.startsWith('  ')) {
                // Remove 2 spaces
                tr.delete(beforeLineStart, beforeLineStart + 2);
                dispatch(tr);
                return true;
              }
            } else {
              // Tab: Add indentation (indent)
              const tr = state.tr.insertText('  ', from); // Insert 2 spaces
              dispatch(tr);
              return true;
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (isUpdating) return; // Prevent recursive updates

      // Use Tiptap's native JSON serialization (standard approach)
      const jsonContent = JSON.stringify(editor.getJSON());

      // Only trigger onChange if content actually changed
      if (jsonContent !== lastContent) {
        setLastContent(jsonContent);
        onChange(jsonContent);
      }
    },
    immediatelyRender: false,
  });


  // Update editor content when prop changes (standard Tiptap approach)
  useEffect(() => {
    if (editor && content !== lastContent && !isUpdating) {
      setIsUpdating(true);
      
      // Use Tiptap's standard content setting
      const parsedContent = initializeContent(content);
      editor.commands.setContent(parsedContent, false, { preserveWhitespace: 'full' });
      
      setLastContent(content);
      setIsUpdating(false);
    }
  }, [editor, content, lastContent, isUpdating]);

  // Ensure proper initialization when editor is created
  useEffect(() => {
    if (editor && content && content.trim()) {
      // Use standard Tiptap content initialization
      const parsedContent = initializeContent(content);
      editor.commands.setContent(parsedContent, false, { preserveWhitespace: 'full' });
      setLastContent(content);
      
      // Trigger overflow check after content is rendered
      setTimeout(() => {
        if (contentRef.current) {
          const container = contentRef.current;
          const hasVerticalOverflow = container.scrollHeight > container.clientHeight;
          const isAtBottom = Math.abs(
            container.scrollHeight - container.clientHeight - container.scrollTop
          ) < 5;
          setHasOverflow(hasVerticalOverflow);
          setIsScrolledToBottom(isAtBottom);
        }
      }, 100);
    }
  }, [editor]); // Only run when editor is created

  // Handle keyboard shortcuts (note-focused only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
        return;
      }

      // CMD+N or CMD+Shift+N to create new note
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        onCreateNote?.();
        return;
      }

      // CMD+Shift+F to open search
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        onOpenSearch?.();
        return;
      }

      // CMD+Shift+A to toggle always on top
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        onToggleAlwaysOnTop?.();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onCreateNote, onOpenSearch, onToggleAlwaysOnTop]);

  const handleMentionSelect = useCallback(
    (selectedNote: any) => {
      if (editor) {
        const mentionLink = `[@${selectedNote.title || 'note'}](note://${selectedNote.id})`;
        editor.commands.insertContent(mentionLink);
      }
      setShowMentionSearch(false);
      setMentionQuery('');
    },
    [editor]
  );

  const handleMentionClose = useCallback(() => {
    setShowMentionSearch(false);
    setMentionQuery('');
    editor?.commands.focus();
  }, [editor]);

  const [hasOverflow, setHasOverflow] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check for content overflow and scroll position
  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current) {
        const container = contentRef.current;
        const hasVerticalOverflow =
          container.scrollHeight > container.clientHeight;
        const isAtBottom =
          Math.abs(
            container.scrollHeight -
              container.clientHeight -
              container.scrollTop
          ) < 5;

        setHasOverflow(hasVerticalOverflow);
        setIsScrolledToBottom(isAtBottom);
      }
    };

    const container = contentRef.current;
    if (container) {
      checkOverflow();
      container.addEventListener('scroll', checkOverflow);
      return () => container.removeEventListener('scroll', checkOverflow);
    }
  }, [editor]);

  // Also check overflow when content changes
  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current) {
        const container = contentRef.current;
        const hasVerticalOverflow =
          container.scrollHeight > container.clientHeight;
        const isAtBottom =
          Math.abs(
            container.scrollHeight -
              container.clientHeight -
              container.scrollTop
          ) < 5;

        setHasOverflow(hasVerticalOverflow);
        setIsScrolledToBottom(isAtBottom);
      }
    };

    // Delay to allow content to render
    setTimeout(checkOverflow, 100);
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [content]);

  return (
    <div className="note-content relative h-full">
      <div
        ref={contentRef}
        className="h-full overflow-y-auto scrollable-content"
      >
        <EditorContent editor={editor} />
      </div>

      {/* Overflow indicator */}
      {hasOverflow && !isScrolledToBottom && (
        <div className="overflow-indicator">⋯</div>
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

export default TiptapEditor;
