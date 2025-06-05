import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Note, Tag } from '../types';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  tags: Tag[];
  updated_at: string;
}

interface MentionSearchProps {
  position: { top: number; left: number };
  query: string;
  onSelect: (note: SearchResult) => void;
  onClose: () => void;
  isVisible: boolean;
}

const MentionSearch: React.FC<MentionSearchProps> = ({
  position,
  query,
  onSelect,
  onClose,
  isVisible
}) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search for notes based on query
  const searchNotes = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Get all notes first
      const allNotes = await window.electronAPI.getAllNotes();
      
      // Score and filter notes
      const scoredResults = await Promise.all(
        allNotes.map(async (note) => {
          const noteTags = await window.electronAPI.getNoteTags(note.id);
          
          // Calculate relevance score
          let score = 0;
          const titlePreview = note.content.split('\n')[0] || 'Untitled';
          
          // Content match (higher score for earlier matches)
          const contentLower = note.content.toLowerCase();
          const queryLower = searchQuery.toLowerCase();
          
          if (contentLower.includes(queryLower)) {
            const index = contentLower.indexOf(queryLower);
            score += Math.max(100 - index, 10); // Earlier matches score higher
          }
          
          // Title match (highest score)
          if (titlePreview.toLowerCase().includes(queryLower)) {
            score += 200;
          }
          
          // Tag match
          const tagMatches = noteTags.filter(tag => 
            tag.name.toLowerCase().includes(queryLower)
          );
          score += tagMatches.length * 50;
          
          // Recency bonus (more recent = higher score)
          const daysSinceUpdate = (Date.now() - new Date(note.updated_at).getTime()) / (1000 * 60 * 60 * 24);
          score += Math.max(50 - daysSinceUpdate, 0);
          
          return {
            id: note.id,
            title: titlePreview.substring(0, 50),
            content: note.content.substring(0, 100),
            tags: noteTags,
            updated_at: note.updated_at,
            score
          };
        })
      );
      
      // Filter notes with score > 0, sort by score, take top 3
      const filteredResults = scoredResults
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ score, ...result }) => result); // Remove score from final result
      
      setResults(filteredResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Failed to search notes:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search when query changes
  useEffect(() => {
    if (isVisible && query) {
      searchNotes(query);
    } else {
      setResults([]);
    }
  }, [query, isVisible, searchNotes]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % results.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            onSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, results, selectedIndex, onSelect, onClose]);

  // Auto-focus on mount
  useEffect(() => {
    if (isVisible && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isVisible]);

  if (!isVisible || query.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="mention-search-dropdown"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 1000
      }}
      tabIndex={-1}
    >
      {isLoading ? (
        <div className="mention-search-loading">
          Searching...
        </div>
      ) : results.length > 0 ? (
        <div className="mention-search-results">
          {results.map((result, index) => (
            <button
              key={result.id}
              className={`mention-search-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => onSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="mention-search-title">
                {result.title || 'Untitled'}
              </div>
              <div className="mention-search-content">
                {result.content}...
              </div>
              {result.tags.length > 0 && (
                <div className="mention-search-tags">
                  {result.tags.slice(0, 2).map(tag => (
                    <span key={tag.id} className="mention-search-tag">
                      {tag.name}
                    </span>
                  ))}
                  {result.tags.length > 2 && (
                    <span className="mention-search-tag">+{result.tags.length - 2}</span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="mention-search-empty">
          No notes found for "{query}"
        </div>
      )}
    </div>
  );
};

export default MentionSearch;