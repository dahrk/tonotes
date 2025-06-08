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
  const [lastContent, setLastContent] = useState(content);
  const [isUpdating, setIsUpdating] = useState(false);

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
      handleKeyDown: (view, event) => {
        // Handle Tab for indentation
        if (event.key === 'Tab') {
          event.preventDefault();
          const { state, dispatch } = view;
          const { selection } = state;
          const { from, to } = selection;
          
          if (event.shiftKey) {
            // Shift+Tab: Remove indentation (unindent)
            const tr = state.tr;
            const textBefore = state.doc.textBetween(Math.max(0, from - 10), from);
            
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
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (isUpdating) return; // Prevent recursive updates
      
      const html = editor.getHTML();
      const markdownContent = htmlToMarkdown(html);
      
      // Only trigger onChange if content actually changed
      if (markdownContent !== lastContent) {
        setLastContent(markdownContent);
        onChange(markdownContent);
      }
    },
    immediatelyRender: false,
  });

  // Convert HTML to markdown (improved implementation)
  const htmlToMarkdown = (html: string): string => {
    if (!html || html === '<p></p>') return '';
    
    let markdown = html
      // Normalize whitespace first
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      
      // Headers
      .replace(/<h1[^>]*>\s*(.*?)\s*<\/h1>/gi, '\n# $1\n\n')
      .replace(/<h2[^>]*>\s*(.*?)\s*<\/h2>/gi, '\n## $1\n\n')
      .replace(/<h3[^>]*>\s*(.*?)\s*<\/h3>/gi, '\n### $1\n\n')
      .replace(/<h4[^>]*>\s*(.*?)\s*<\/h4>/gi, '\n#### $1\n\n')
      .replace(/<h5[^>]*>\s*(.*?)\s*<\/h5>/gi, '\n##### $1\n\n')
      .replace(/<h6[^>]*>\s*(.*?)\s*<\/h6>/gi, '\n###### $1\n\n')
      
      // Code blocks before inline code
      .replace(/<pre[^>]*><code[^>]*>\s*(.*?)\s*<\/code><\/pre>/gis, '\n```\n$1\n```\n\n')
      
      // Bold and italic (nested support)
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      
      // Inline code
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      
      // Links (preserve note:// protocol)
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      
      // Task lists (handle nested structure)
      .replace(/<ul[^>]*data-type="taskList"[^>]*>(.*?)<\/ul>/gis, (match, content) => {
        return content
          .replace(/<li[^>]*data-checked="true"[^>]*>\s*(.*?)\s*<\/li>/gi, '\n- [x] $1')
          .replace(/<li[^>]*data-checked="false"[^>]*>\s*(.*?)\s*<\/li>/gi, '\n- [ ] $1');
      })
      
      // Regular unordered lists
      .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
        return content.replace(/<li[^>]*>\s*(.*?)\s*<\/li>/gi, '\n- $1');
      })
      
      // Ordered lists
      .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
        let counter = 1;
        return content.replace(/<li[^>]*>\s*(.*?)\s*<\/li>/gi, () => `\n${counter++}. $1`);
      })
      
      // Line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      
      // Paragraphs
      .replace(/<p[^>]*>\s*(.*?)\s*<\/p>/gi, '\n$1\n')
      
      // Remove any remaining HTML tags
      .replace(/<[^>]*>/g, '')
      
      // Clean up whitespace
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+/, '')
      .replace(/\n+$/, '')
      .trim();

    return markdown;
  };

  // Convert markdown to HTML for initial content
  const markdownToHtml = (markdown: string): string => {
    if (!markdown.trim()) return '<p></p>';
    
    let html = markdown
      // Escape existing HTML first
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      
      // Code blocks (must be before other processing)
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      
      // Headers (from h6 to h1 to avoid conflicts)
      .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
      .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
      .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      
      // Bold and italic (order matters)
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // Inline code (after bold/italic to avoid conflicts)
      .replace(/`(.*?)`/g, '<code>$1</code>')
      
      // Links (with proper escaping)
      .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2">$1</a>')
      
      // Task lists (group consecutive items)
      .replace(/^- \[[x ]\] .*$/gim, (match) => {
        if (match.includes('[x]')) {
          return match.replace(/^- \[x\] (.*)$/gim, '<li data-type="taskItem" data-checked="true">$1</li>');
        } else {
          return match.replace(/^- \[ \] (.*)$/gim, '<li data-type="taskItem" data-checked="false">$1</li>');
        }
      })
      
      // Wrap consecutive task items in task list
      .replace(/(<li data-type="taskItem"[^>]*>.*<\/li>\s*)+/gm, '<ul data-type="taskList">$&</ul>')
      
      // Regular unordered lists
      .replace(/^- (?!\[[x ]\]) (.*)$/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\s*)+/gm, '<ul>$&</ul>')
      
      // Ordered lists
      .replace(/^\d+\. (.*)$/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\s*)+/gm, (match) => {
        // Only wrap if not already wrapped and not task items
        if (!match.includes('data-type="taskList"') && !match.includes('<ul>')) {
          return '<ol>' + match + '</ol>';
        }
        return match;
      })
      
      // Line breaks
      .replace(/\n/g, '<br>')
      
      // Paragraphs (split by double line breaks)
      .split(/<br><br>/)
      .map(paragraph => {
        if (paragraph.trim() && 
            !paragraph.includes('<h') && 
            !paragraph.includes('<ul') && 
            !paragraph.includes('<ol') && 
            !paragraph.includes('<pre>')) {
          return '<p>' + paragraph + '</p>';
        }
        return paragraph;
      })
      .join('');

    // Clean up
    html = html
      .replace(/<br>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();

    return html || '<p></p>';
  };

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== lastContent && !isUpdating) {
      setIsUpdating(true);
      const html = markdownToHtml(content);
      editor.commands.setContent(html);
      setLastContent(content);
      // Allow other updates after a brief delay
      setTimeout(() => setIsUpdating(false), 100);
    }
  }, [editor, content, lastContent, isUpdating]);

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