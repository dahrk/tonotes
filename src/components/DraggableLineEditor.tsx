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

interface DraggableLineEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  placeholder?: string;
  onNoteLink?: (noteId: string) => void;
}

interface LineItemProps {
  id: string;
  content: string;
  index: number;
  isDragging?: boolean;
  onEdit: (index: number, content: string) => void;
}

const LineItem: React.FC<LineItemProps> = ({ id, content, index, isDragging, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
  } = useSortable({ id });

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(content);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Auto-resize textarea
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
      }
    }, 0);
  };

  const handleSave = () => {
    onEdit(index, editContent);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditContent(content);
      setIsEditing(false);
    }
  };

  const renderContent = () => {
    if (!content.trim()) return <span className="text-gray-400 italic">Empty line</span>;
    
    // Basic markdown rendering
    if (content.startsWith('# ')) {
      return <h1 className="tiptap-heading text-lg font-bold">{content.slice(2)}</h1>;
    } else if (content.startsWith('## ')) {
      return <h2 className="tiptap-heading text-base font-bold">{content.slice(3)}</h2>;
    } else if (content.startsWith('### ')) {
      return <h3 className="tiptap-heading text-sm font-bold">{content.slice(4)}</h3>;
    } else if (content.startsWith('- [x] ')) {
      return (
        <div className="flex items-center space-x-2">
          <input type="checkbox" checked readOnly className="text-xs" />
          <span className="line-through text-gray-600">{content.slice(6)}</span>
        </div>
      );
    } else if (content.startsWith('- [ ] ')) {
      return (
        <div className="flex items-center space-x-2">
          <input type="checkbox" readOnly className="text-xs" />
          <span>{content.slice(6)}</span>
        </div>
      );
    } else if (content.startsWith('- ')) {
      return <span>• {content.slice(2)}</span>;
    }
    
    return <span>{content}</span>;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="line-wrapper group relative flex items-start py-1 min-h-[28px]"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="drag-handle opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex-shrink-0 text-gray-400 hover:text-gray-600 mr-2 mt-1 select-none text-xs"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        ⋮⋮
      </div>
      
      {/* Line content */}
      <div className="line-content flex-1 min-w-0" onClick={handleEdit}>
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value);
              // Auto-resize on change
              if (inputRef.current) {
                inputRef.current.style.height = 'auto';
                inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
              }
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="w-full bg-transparent border-none outline-none resize-none font-inherit text-inherit leading-inherit min-h-[20px]"
            style={{ height: 'auto' }}
            rows={1}
          />
        ) : (
          <div className="cursor-text hover:bg-black hover:bg-opacity-5 dark:hover:bg-white dark:hover:bg-opacity-5 rounded px-1 py-0.5 transition-colors">
            {renderContent()}
          </div>
        )}
      </div>
      
      {/* Drop indicator */}
      {isOver && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded"></div>
      )}
    </div>
  );
};

const DraggableLineEditor: React.FC<DraggableLineEditorProps> = ({
  content,
  onChange,
  onSave,
  placeholder = "Start typing...",
  onNoteLink
}) => {
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

  // Split content into lines
  useEffect(() => {
    const contentLines = content.split('\n');
    setLines(contentLines);
  }, [content]);

  // Handle line edit
  const handleLineEdit = useCallback((index: number, newContent: string) => {
    const newLines = [...lines];
    newLines[index] = newContent;
    const newContent_ = newLines.join('\n');
    setLines(newLines);
    onChange(newContent_);
  }, [lines, onChange]);

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
  }, [lines]);

  // Add new line at the end if needed
  const handleAddLine = () => {
    const newLines = [...lines, ''];
    setLines(newLines);
    onChange(newLines.join('\n'));
  };

  return (
    <div className="note-content relative h-full">
      <div 
        ref={contentRef}
        className="h-full overflow-y-auto overflow-x-hidden scrollable-content p-3"
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
          <SortableContext items={lines.map((_, index) => `line-${index}`)} strategy={verticalListSortingStrategy}>
            {lines.length === 0 ? (
              <div className="text-gray-400 italic cursor-pointer" onClick={handleAddLine}>
                {placeholder}
              </div>
            ) : (
              lines.map((line, index) => (
                <LineItem
                  key={`line-${index}`}
                  id={`line-${index}`}
                  content={line}
                  index={index}
                  isDragging={activeId === `line-${index}`}
                  onEdit={handleLineEdit}
                />
              ))
            )}
          </SortableContext>
          
          <DragOverlay>
            {activeId ? (
              <div className="line-wrapper opacity-75 bg-white dark:bg-gray-800 rounded shadow-lg p-2 border">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-xs">⋮⋮</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                    {lines[parseInt(activeId.split('-')[1])] || 'Dragging line...'}
                  </span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        
        {/* Add line button */}
        <button
          onClick={handleAddLine}
          className="mt-2 text-gray-400 hover:text-gray-600 text-sm italic transition-colors"
        >
          + Add line
        </button>
      </div>
      
      {/* Overflow indicator */}
      {hasOverflow && !isScrolledToBottom && (
        <div className="overflow-indicator">
          ⋯
        </div>
      )}
    </div>
  );
};

export default DraggableLineEditor;