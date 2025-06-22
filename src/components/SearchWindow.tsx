import React, { useState, useEffect, useRef } from 'react';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  tags: { name: string }[];
  updated_at: string;
}

interface SearchWindowProps {
  theme?: 'light' | 'dark';
}

const SearchWindow: React.FC<SearchWindowProps> = ({ theme = 'light' }) => {
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Focus on the search input when component mounts
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    // Expose theme update function to global scope for Electron IPC
    (window as any).updateTheme = (newTheme: 'light' | 'dark') => {
      setCurrentTheme(newTheme);
    };

    return () => {
      // Cleanup
      delete (window as any).updateTheme;
    };
  }, []);

  useEffect(() => {
    // Apply theme to document body
    document.body.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const performSearch = async (searchQuery: string) => {
    if (!window.electronAPI) return;

    setIsLoading(true);
    setShowInstructions(false);

    try {
      const searchResults =
        await window.electronAPI.searchAllNotes(searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setQuery(value);

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (value.length === 0) {
      setShowInstructions(true);
      setResults([]);
      return;
    }

    if (value.length < 2) {
      setShowInstructions(false);
      setResults([]);
      return;
    }

    // Debounce search
    searchTimeout.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      window.electronAPI?.closeSearchWindow();
    } else if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      selectNote(results[0].id);
    }
  };

  const selectNote = (noteId: string) => {
    window.electronAPI?.selectSearchResult(noteId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderContent = () => {
    if (showInstructions) {
      return (
        <div className="instructions">
          Start typing to search through your notes...
        </div>
      );
    }

    if (query.length > 0 && query.length < 2) {
      return (
        <div className="instructions">
          Type at least 2 characters to search...
        </div>
      );
    }

    if (isLoading) {
      return <div className="loading">Searching...</div>;
    }

    if (results.length === 0 && query.length >= 2) {
      return <div className="no-results">No notes found for "{query}"</div>;
    }

    return results.map(result => (
      <div
        key={result.id}
        className="result-item"
        onClick={() => selectNote(result.id)}
      >
        <div className="result-title">{result.title}</div>
        <div className="result-content">
          {result.content.substring(0, 100)}...
        </div>
        <div className="result-meta">
          <div className="result-tags">
            {result.tags.map((tag, index) => (
              <span key={index} className="result-tag">
                {tag.name}
              </span>
            ))}
          </div>
          <div className="result-date">{formatDate(result.updated_at)}</div>
        </div>
      </div>
    ));
  };

  return (
    <div className="search-app">
      <div className="search-container">
        <input
          ref={searchInputRef}
          type="text"
          id="searchInput"
          className="search-input"
          placeholder="Search notes by content or tags..."
          autoComplete="off"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div id="resultsContainer" className="results-container">
        {renderContent()}
      </div>

      <style>{`
        :root {
          --bg-primary: #f5f5f5;
          --bg-secondary: white;
          --text-primary: #333;
          --text-secondary: #666;
          --text-tertiary: #999;
          --border-color: #e0e0e0;
          --hover-bg: #f0f0f0;
          --focus-color: #007AFF;
        }

        [data-theme="dark"] {
          --bg-primary: #1e1e1e;
          --bg-secondary: #2d2d2d;
          --text-primary: #ffffff;
          --text-secondary: #cccccc;
          --text-tertiary: #888888;
          --border-color: #404040;
          --hover-bg: #3d3d3d;
          --focus-color: #64a0ff;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 0;
          padding: 0;
          background: var(--bg-primary);
          color: var(--text-primary);
          overflow: hidden;
        }

        .search-app {
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .search-container {
          padding: 20px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
        }
        
        .search-input {
          width: 100%;
          padding: 12px 16px;
          font-size: 16px;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          outline: none;
          transition: border-color 0.2s ease;
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
        
        .search-input:focus {
          border-color: var(--focus-color);
        }
        
        .results-container {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }
        
        .result-item {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          transition: background-color 0.2s ease;
          background: var(--bg-secondary);
        }
        
        .result-item:hover {
          background: var(--hover-bg);
        }
        
        .result-item:last-child {
          border-bottom: none;
        }
        
        .result-title {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary);
          margin-bottom: 4px;
          line-height: 1.3;
        }
        
        .result-content {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .result-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: var(--text-tertiary);
        }
        
        .result-tags {
          display: flex;
          gap: 4px;
        }
        
        .result-tag {
          background: var(--border-color);
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 9px;
          color: var(--text-secondary);
        }
        
        .result-date {
          font-style: italic;
        }
        
        .no-results, .loading, .instructions {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-tertiary);
        }

        .loading {
          color: var(--text-secondary);
        }
        
        .instructions {
          font-size: 14px;
        }

        .no-results {
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default SearchWindow;
