import React, { useCallback, useRef, useEffect } from 'react';
import { Editor, rootCtx, defaultValueCtx, editorViewOptionsCtx } from '@milkdown/core';
import { Milkdown, useEditor, MilkdownProvider } from '@milkdown/react';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { history } from '@milkdown/plugin-history';
import { indent } from '@milkdown/plugin-indent';
import { trailing } from '@milkdown/plugin-trailing';
import { cursor } from '@milkdown/plugin-cursor';
import { block } from '@milkdown/plugin-block';
import { nord } from '@milkdown/theme-nord';
import MentionSearch from './MentionSearch';

interface MilkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  placeholder?: string;
  onNoteLink?: (noteId: string) => void;
}

const MilkdownEditor: React.FC<MilkdownEditorProps> = ({
  content,
  onChange,
  onSave,
  placeholder = "Start typing...",
  onNoteLink
}) => {
  const [showMentionSearch, setShowMentionSearch] = React.useState(false);
  const [mentionQuery, setMentionQuery] = React.useState('');
  const [mentionPosition, setMentionPosition] = React.useState({ top: 0, left: 0 });
  const [mentionStartPos, setMentionStartPos] = React.useState(0);
  const editorRef = useRef<Editor | null>(null);

  const { get } = useEditor((root) => {
    const editor = Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, content);
        ctx.set(editorViewOptionsCtx, {
          attributes: {
            class: 'milkdown-editor prose prose-sm max-w-none',
            spellcheck: 'false'
          }
        });
      })
      .config(nord)
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(indent)
      .use(trailing)
      .use(cursor)
      .use(block);

    editorRef.current = editor;
    return editor;
  }, []);

  // Handle content changes
  useEffect(() => {
    if (!get()) return;

    const listener = (ctx: any) => {
      const editorView = ctx.get(editorViewOptionsCtx);
      if (editorView) {
        const markdown = editorView.state.doc.textContent;
        if (markdown !== content) {
          onChange(markdown);
        }
      }
    };

    // Set up content change listener
    get()?.action((ctx) => {
      ctx.set(defaultValueCtx, content);
    });

  }, [get, content, onChange]);

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

  // Handle mention detection (will implement after basic editor works)
  const detectMention = useCallback((text: string, cursorPosition: number) => {
    const beforeCursor = text.substring(0, cursorPosition);
    const atMatch = beforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      const query = atMatch[1];
      const mentionStart = cursorPosition - atMatch[0].length;
      
      // Get cursor position from editor for dropdown placement
      setMentionStartPos(mentionStart);
      setMentionQuery(query);
      setShowMentionSearch(true);
      
      // Position dropdown near cursor (simplified for now)
      setMentionPosition({ top: 100, left: 100 });
    } else {
      setShowMentionSearch(false);
      setMentionQuery('');
    }
  }, []);

  const handleMentionSelect = useCallback((selectedNote: any) => {
    // Will implement mention insertion after basic editor works
    setShowMentionSearch(false);
    setMentionQuery('');
  }, []);

  const handleMentionClose = useCallback(() => {
    setShowMentionSearch(false);
    setMentionQuery('');
  }, []);

  return (
    <div className="note-content relative h-full">
      <div className="h-full overflow-hidden">
        <Milkdown />
      </div>
      
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

// Wrapper component to provide Milkdown context
const MilkdownEditorWrapper: React.FC<MilkdownEditorProps> = (props) => {
  return (
    <MilkdownProvider>
      <MilkdownEditor {...props} />
    </MilkdownProvider>
  );
};

export default MilkdownEditorWrapper;