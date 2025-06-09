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
  placeholder = 'Start typing...',
  onNoteLink,
}) => {
  const [showMentionSearch, setShowMentionSearch] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [lastContent, setLastContent] = useState(content);
  const [isUpdating, setIsUpdating] = useState(false);

  // Helper function to process inline markdown
  const processInlineMarkdown = (text: string): string => {
    return text
      // Bold and italic (order matters)
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2">$1</a>');
  };

  // Convert markdown to HTML for initial content
  const markdownToHtml = (markdown: string): string => {
    if (!markdown.trim()) return '<p></p>';

    // Split content into lines to process line by line for better task list handling
    const lines = markdown.split('\n');
    const processedLines: string[] = [];
    let inTaskList = false;
    let inRegularList = false;
    let inOrderedList = false;
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          processedLines.push('</code></pre>');
          inCodeBlock = false;
        } else {
          // Close any open lists
          if (inTaskList) {
            processedLines.push('</ul>');
            inTaskList = false;
          }
          if (inRegularList) {
            processedLines.push('</ul>');
            inRegularList = false;
          }
          if (inOrderedList) {
            processedLines.push('</ol>');
            inOrderedList = false;
          }
          processedLines.push('<pre><code>');
          inCodeBlock = true;
        }
        continue;
      }

      // Skip processing if in code block
      if (inCodeBlock) {
        processedLines.push(line);
        continue;
      }

      // Escape HTML in regular content
      line = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Handle task list items
      const taskMatch = line.match(/^(\s*)- \[([ x])\] (.*)$/);
      if (taskMatch) {
        const indent = taskMatch[1];
        const checked = taskMatch[2] === 'x';
        const content = taskMatch[3];
        
        if (!inTaskList) {
          // Close other lists
          if (inRegularList) {
            processedLines.push('</ul>');
            inRegularList = false;
          }
          if (inOrderedList) {
            processedLines.push('</ol>');
            inOrderedList = false;
          }
          processedLines.push('<ul data-type="taskList">');
          inTaskList = true;
        }
        
        processedLines.push(`<li data-type="taskItem" data-checked="${checked}">${processInlineMarkdown(content)}</li>`);
        continue;
      }

      // Handle regular list items
      const listMatch = line.match(/^(\s*)- (.*)$/);
      if (listMatch && !line.includes('[ ]') && !line.includes('[x]')) {
        const content = listMatch[2];
        
        if (!inRegularList) {
          // Close other lists
          if (inTaskList) {
            processedLines.push('</ul>');
            inTaskList = false;
          }
          if (inOrderedList) {
            processedLines.push('</ol>');
            inOrderedList = false;
          }
          processedLines.push('<ul>');
          inRegularList = true;
        }
        
        processedLines.push(`<li>${processInlineMarkdown(content)}</li>`);
        continue;
      }

      // Handle ordered list items
      const orderedMatch = line.match(/^(\s*)\d+\. (.*)$/);
      if (orderedMatch) {
        const content = orderedMatch[2];
        
        if (!inOrderedList) {
          // Close other lists
          if (inTaskList) {
            processedLines.push('</ul>');
            inTaskList = false;
          }
          if (inRegularList) {
            processedLines.push('</ul>');
            inRegularList = false;
          }
          processedLines.push('<ol>');
          inOrderedList = true;
        }
        
        processedLines.push(`<li>${processInlineMarkdown(content)}</li>`);
        continue;
      }

      // Close lists if we encounter non-list content
      if (inTaskList) {
        processedLines.push('</ul>');
        inTaskList = false;
      }
      if (inRegularList) {
        processedLines.push('</ul>');
        inRegularList = false;
      }
      if (inOrderedList) {
        processedLines.push('</ol>');
        inOrderedList = false;
      }

      // Handle headers
      const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const content = headerMatch[2];
        processedLines.push(`<h${level}>${processInlineMarkdown(content)}</h${level}>`);
        continue;
      }

      // Handle empty lines
      if (line.trim() === '') {
        processedLines.push('<br>');
        continue;
      }

      // Handle regular paragraphs
      processedLines.push(`<p>${processInlineMarkdown(line)}</p>`);
    }

    // Close any open lists
    if (inTaskList) {
      processedLines.push('</ul>');
    }
    if (inRegularList) {
      processedLines.push('</ul>');
    }
    if (inOrderedList) {
      processedLines.push('</ol>');
    }
    if (inCodeBlock) {
      processedLines.push('</code></pre>');
    }

    return processedLines.join('') || '<p></p>';
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
    content: markdownToHtml(content), // Always convert markdown to HTML on initialization
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
      // Don't normalize whitespace too aggressively - preserve structure
      .replace(/>\s+</g, '><')

      // Headers - remove extra newlines
      .replace(/<h1[^>]*>\s*(.*?)\s*<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>\s*(.*?)\s*<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>\s*(.*?)\s*<\/h3>/gi, '### $1\n')
      .replace(/<h4[^>]*>\s*(.*?)\s*<\/h4>/gi, '#### $1\n')
      .replace(/<h5[^>]*>\s*(.*?)\s*<\/h5>/gi, '##### $1\n')
      .replace(/<h6[^>]*>\s*(.*?)\s*<\/h6>/gi, '###### $1\n')

      // Code blocks before inline code
      .replace(
        /<pre[^>]*><code[^>]*>\s*(.*?)\s*<\/code><\/pre>/gis,
        '```\n$1\n```\n'
      )

      // Bold and italic (nested support)
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')

      // Inline code
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')

      // Links (preserve note:// protocol)
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')

      // Task lists (handle nested structure) - FIX: Remove leading newlines
      .replace(
        /<ul[^>]*data-type="taskList"[^>]*>(.*?)<\/ul>/gis,
        (match, content) => {
          return content
            .replace(
              /<li[^>]*data-checked="true"[^>]*>\s*(.*?)\s*<\/li>/gi,
              '- [x] $1\n'
            )
            .replace(
              /<li[^>]*data-checked="false"[^>]*>\s*(.*?)\s*<\/li>/gi,
              '- [ ] $1\n'
            );
        }
      )

      // Regular unordered lists - FIX: Remove leading newlines
      .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
        return content.replace(/<li[^>]*>\s*(.*?)\s*<\/li>/gi, '- $1\n');
      })

      // Ordered lists - FIX: Use proper replacement with captured group
      .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
        let counter = 1;
        return content.replace(
          /<li[^>]*>\s*(.*?)\s*<\/li>/gi,
          (_: string, listContent: string) => `${counter++}. ${listContent}\n`
        );
      })

      // Line breaks
      .replace(/<br\s*\/?>/gi, '\n')

      // Paragraphs - reduce spacing
      .replace(/<p[^>]*>\s*(.*?)\s*<\/p>/gi, '$1\n')

      // Remove any remaining HTML tags
      .replace(/<[^>]*>/g, '')

      // Clean up whitespace more carefully
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+/, '')
      .replace(/\n+$/, '')
      .trim();

    return markdown;
  };


  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== lastContent && !isUpdating) {
      setIsUpdating(true);
      const html = markdownToHtml(content);
      
      // Force content update with immediate render
      editor.commands.setContent(html, false, { preserveWhitespace: 'full' });
      
      // Ensure the editor renders the content properly
      setTimeout(() => {
        if (editor && !editor.isDestroyed) {
          // Force a re-render to ensure all markdown elements are properly displayed
          const currentContent = editor.getHTML();
          if (currentContent !== html) {
            editor.commands.setContent(html, false, { preserveWhitespace: 'full' });
          }
        }
        setLastContent(content);
        setIsUpdating(false);
      }, 50);
    }
  }, [editor, content, lastContent, isUpdating]);

  // Ensure proper initialization when editor is created
  useEffect(() => {
    if (editor && content && content.trim()) {
      // Ensure content is rendered immediately after editor creation
      const html = markdownToHtml(content);
      editor.commands.setContent(html, false, { preserveWhitespace: 'full' });
      setLastContent(content);
    }
  }, [editor]); // Only run when editor is created

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
