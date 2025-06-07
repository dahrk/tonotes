import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Tag } from '../types';

interface TagInputProps {
  noteId: string;
  tags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

const TagInput: React.FC<TagInputProps> = ({ noteId, tags, onTagsChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [hasOverflow, setHasOverflow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load all available tags for suggestions
  useEffect(() => {
    const loadAllTags = async () => {
      try {
        const allAvailableTags = await window.electronAPI.getAllTags();
        setAllTags(allAvailableTags);
      } catch (error) {
        console.error('Failed to load all tags:', error);
        setAllTags(tags); // Fallback to current tags
      }
    };
    
    loadAllTags();
  }, [tags]);

  // Check for overflow when tags change
  useEffect(() => {
    const checkOverflow = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const isOverflowing = container.scrollWidth > container.clientWidth;
        setHasOverflow(isOverflowing);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [tags]);

  const handleTagAdd = useCallback(async (tagName: string) => {
    if (!tagName.trim()) return;

    try {
      // Create or get existing tag
      const tagId = await window.electronAPI.createTag(tagName.trim());
      
      // Add tag to note
      await window.electronAPI.addTagToNote(noteId, tagId);
      
      // Update local tags
      const newTag = { id: tagId, name: tagName.trim().toLowerCase().replace(/\s+/g, '-') };
      const updatedTags = [...tags, newTag];
      onTagsChange(updatedTags);
      
      setInputValue('');
      setIsEditing(false);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  }, [noteId, tags, onTagsChange]);

  const handleTagRemove = useCallback(async (tagId: number) => {
    try {
      await window.electronAPI.removeTagFromNote(noteId, tagId);
      const updatedTags = tags.filter(tag => tag.id !== tagId);
      onTagsChange(updatedTags);
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  }, [noteId, tags, onTagsChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        handleTagAdd(inputValue);
      }
    } else if (e.key === 'Escape') {
      setInputValue('');
      setIsEditing(false);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(value.length > 0);
  };

  const filteredSuggestions = allTags.filter(tag => 
    !tags.some(t => t.id === tag.id) &&
    tag.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="flex items-center flex-1 min-w-0">
      {/* Scrollable tags container */}
      <div 
        ref={scrollContainerRef}
        className="tag-scrollable-container flex items-center space-x-1 overflow-x-auto flex-1 min-w-0"
        data-overflow={hasOverflow}
      >
        {/* Existing tags */}
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="tag-pill group flex items-center space-x-1"
          >
            <span className="tag-text">{tag.name}</span>
            <button
              onClick={() => handleTagRemove(tag.id)}
              className="tag-remove-button opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove tag"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Fixed add button outside scroll area */}
      <div className="flex-shrink-0 ml-1">
        {isEditing ? (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                // Delay hiding to allow for suggestion clicks
                setTimeout(() => {
                  setIsEditing(false);
                  setShowSuggestions(false);
                  setInputValue('');
                }, 150);
              }}
              placeholder="Add tag..."
              className="tag-input"
              autoFocus
            />
            
            {/* Tag suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="tag-suggestions">
                {filteredSuggestions.slice(0, 5).map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagAdd(tag.name)}
                    className="tag-suggestion"
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="tag-add-button"
            title="Add tag"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
};

export default TagInput;