import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import Dropcursor from '@tiptap/extension-dropcursor';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MentionSearch from './MentionSearch';

interface DraggableTiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  placeholder?: string;
  onNoteLink?: (noteId: string) => void;
}

interface SortableLineProps {
  id: string;
  children: React.ReactNode;
  isDragging?: boolean;
}

const SortableLine: React.FC<SortableLineProps> = ({ id, children, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="line-wrapper group relative flex items-start"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="drag-handle opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex-shrink-0 text-gray-400 hover:text-gray-600 mr-2 mt-1 select-none"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        ⋮⋮
      </div>
      
      {/* Line content */}
      <div className="line-content flex-1 min-w-0">
        {children}
      </div>
      
      {/* Drop indicator */}
      {isOver && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded"></div>
      )}
    </div>
  );
};

const DraggableTiptapEditor: React.FC<DraggableTiptapEditorProps> = ({
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
  const [lines, setLines] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Split content into lines for drag and drop
  useEffect(() => {
    const contentLines = content.split('\n').map((line, index) => line || ' ');
    setLines(contentLines);
  }, [content]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
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
      Dropcursor.configure({
        color: '#3b82f6',
        width: 2,
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-sm max-w-none focus:outline-none',
        spellcheck: 'false',
      },
      handleClick: (view, pos, event) => {
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
      const markdown = htmlToMarkdown(editor.getHTML());
      onChange(markdown);
    },
    immediatelyRender: false,
  });

  // Convert HTML to markdown (basic implementation)
  const htmlToMarkdown = (html: string): string => {
    let markdown = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '```\n$1\n```')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<li[^>]*data-checked="true"[^>]*>(.*?)<\/li>/gi, '- [x] $1')
      .replace(/<li[^>]*data-checked="false"[^>]*>(.*?)<\/li>/gi, '- [ ] $1')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1')
      .replace(/<[^>]*>/g, '')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    return markdown;
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      setLines((items) => {
        const oldIndex = items.findIndex((_, index) => `line-${index}` === active.id);
        const newIndex = items.findIndex((_, index) => `line-${index}` === over?.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        const newContent = newItems.join('\n');
        onChange(newContent);
        
        return newItems;
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== htmlToMarkdown(editor.getHTML())) {
      const html = markdownToHtml(content);
      editor.commands.setContent(html);
    }
  }, [editor, content]);

  // Convert markdown to HTML for initial content
  const markdownToHtml = (markdown: string): string => {
    let html = markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2">$1</a>')
      .replace(/^- \[x\] (.*$)/gim, '<ul data-type="taskList"><li data-checked="true">$1</li></ul>')
      .replace(/^- \[ \] (.*$)/gim, '<ul data-type="taskList"><li data-checked="false">$1</li></ul>')
      .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.*)$/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/g, '$1')
      .replace(/<p>(<ul.*<\/ul>)<\/p>/g, '$1');

    return html;
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

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

  // Handle mention functions (simplified for now)
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

  return (
    <div className="note-content relative h-full">
      <div 
        ref={contentRef}
        className="h-full overflow-y-auto overflow-x-hidden scrollable-content"
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
          <SortableContext items={lines.map((_, index) => `line-${index}`)} strategy={verticalListSortingStrategy}>
            <EditorContent editor={editor} />
          </SortableContext>
          
          <DragOverlay>
            {activeId ? (
              <div className="line-wrapper opacity-50 bg-white rounded shadow-lg p-2">
                Dragging line...
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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

export default DraggableTiptapEditor;