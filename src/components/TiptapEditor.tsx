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
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable default task list from starter kit
        taskList: false,
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
        validate: (url) => {
          return url.startsWith('note://') || /^https?:\/\//.test(url);
        },
      }),
      Typography,
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-sm max-w-none focus:outline-none',
        spellcheck: 'false',
      },
      handleClick: (view, pos, event) => {
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
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown?.getMarkdown() || editor.getText();
      // For now, use HTML as Tiptap doesn't have built-in markdown export
      // We'll convert the content to markdown format manually
      const html = editor.getHTML();
      const markdownContent = htmlToMarkdown(html);
      onChange(markdownContent);
    },
    immediatelyRender: false,
  });

  // Convert HTML to markdown (basic implementation)
  const htmlToMarkdown = (html: string): string => {
    // This is a basic conversion - for production you'd want a proper HTML to markdown converter
    let markdown = html
      // Headers
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      // Bold and italic
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      // Code
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '```\n$1\n```')
      // Links
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      // Task lists
      .replace(/<li[^>]*data-checked="true"[^>]*>(.*?)<\/li>/gi, '- [x] $1')
      .replace(/<li[^>]*data-checked="false"[^>]*>(.*?)<\/li>/gi, '- [ ] $1')
      // Regular lists
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1')
      // Remove remaining HTML tags
      .replace(/<[^>]*>/g, '')
      // Clean up whitespace
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    return markdown;
  };

  // Convert markdown to HTML for initial content
  const markdownToHtml = (markdown: string): string => {
    // Basic markdown to HTML conversion
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2">$1</a>')
      // Task lists
      .replace(/^- \[x\] (.*$)/gim, '<ul data-type="taskList"><li data-checked="true">$1</li></ul>')
      .replace(/^- \[ \] (.*$)/gim, '<ul data-type="taskList"><li data-checked="false">$1</li></ul>')
      // Regular lists
      .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.*)$/gm, '<p>$1</p>')
      // Clean up
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/g, '$1')
      .replace(/<p>(<ul.*<\/ul>)<\/p>/g, '$1');

    return html;
  };

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== htmlToMarkdown(editor.getHTML())) {
      const html = markdownToHtml(content);
      editor.commands.setContent(html);
    }
  }, [editor, content]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

  // Handle mention detection
  const detectMention = useCallback((text: string, cursorPosition: number) => {
    const beforeCursor = text.substring(0, cursorPosition);
    const atMatch = beforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      const query = atMatch[1];
      const mentionStart = cursorPosition - atMatch[0].length;
      
      setMentionStartPos(mentionStart);
      setMentionQuery(query);
      setShowMentionSearch(true);
      
      // Position dropdown near cursor (simplified)
      setMentionPosition({ top: 100, left: 100 });
    } else {
      setShowMentionSearch(false);
      setMentionQuery('');
    }
  }, []);

  const handleMentionSelect = useCallback((selectedNote: any) => {
    if (editor) {
      const mentionLink = `[@${selectedNote.title || 'note'}](note://${selectedNote.id})`;
      editor.commands.insertContent(mentionLink);
    }
    setShowMentionSearch(false);
    setMentionQuery('');
  }, [editor]);

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
        const hasVerticalOverflow = container.scrollHeight > container.clientHeight;
        const isAtBottom = Math.abs(container.scrollHeight - container.clientHeight - container.scrollTop) < 5;
        
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
        const hasVerticalOverflow = container.scrollHeight > container.clientHeight;
        const isAtBottom = Math.abs(container.scrollHeight - container.clientHeight - container.scrollTop) < 5;
        
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
        <div className="overflow-indicator">
          ⋯
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

export default TiptapEditor;