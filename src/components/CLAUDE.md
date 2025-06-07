# Components

## Purpose
Advanced React components providing a sophisticated and feature-rich UI architecture for the PostIt application, featuring dual-mode editing, drag & drop functionality, and comprehensive theme support.

## Implemented Components

### Core Editor Components

#### NoteEditor.tsx
Main editor component with mode switching functionality:
- **Dual-Mode Toggle**: Switch between rich WYSIWYG editing and drag & drop line mode
- **Mode Toggle Button**: Intuitive ⋮⋮ / 📝 button with theme-aware styling
- **Seamless Transitions**: Smooth switching between editing modes
- **Auto-save Integration**: Consistent auto-save across both editing modes
- **Theme Integration**: Mode toggle respects light/dark theme preferences

#### TiptapEditor.tsx
Professional WYSIWYG editor with rich text capabilities:
- **Tiptap Integration**: Full-featured rich text editor with markdown support
- **Real-time Rendering**: Live HTML ↔ Markdown conversion and display
- **Interactive Elements**: Click-to-toggle checkboxes and interactive task lists
- **Note Linking**: @-mention system with search dropdown integration
- **Text Wrapping**: Comprehensive word wrapping for all content types
- **Keyboard Shortcuts**: CMD+S save, full keyboard navigation support

#### DraggableLineEditor.tsx
Advanced line-based editor with drag & drop functionality:
- **Line-by-Line Editing**: Individual line editing with auto-resizing textareas
- **Drag & Drop**: @dnd-kit powered line reordering with hover handles
- **Visual Feedback**: Drag overlay showing actual content being moved
- **Click-to-Edit**: Inline editing for individual lines with auto-focus
- **Markdown Rendering**: Basic markdown display for headers, tasks, and lists
- **Hover Handles**: Drag handles visible only on hover for clean interface

#### MarkdownRenderer.tsx
Custom React Markdown renderer with enhanced task list support:
- **Interactive Tasks**: Checkbox todo items with click-to-toggle functionality
- **Nested Tasks**: Multi-level task lists with proper visual indentation
- **Task States**: Visual styling for completed tasks with strikethrough
- **Note Linking**: @-mention support with click-to-navigate functionality
- **Rich Formatting**: Support for headers, code blocks, links, and text formatting
- **Theme Aware**: Proper contrast ratios and theme-appropriate styling

### UI Enhancement Components

#### TagInput.tsx
Advanced tag management interface with scrolling and overflow handling:
- **Scrollable Tags**: Horizontal scrolling with hidden scrollbars for clean appearance
- **Overflow Indicators**: Dynamic fade gradients that match note color themes
- **Smart Layout**: Fixed add button outside scroll area for persistent access
- **Tag Creation**: Real-time tag creation with validation and deduplication
- **Autocomplete**: Intelligent suggestions from existing tags with fuzzy matching
- **Visual Design**: Color-coded tag pills with hover states and removal buttons
- **Theme Integration**: Fade gradients dynamically match yellow/pink/blue note themes

#### MentionSearch.tsx
Advanced @-mention search functionality:
- **Real-time Search**: Instant search results as user types with debouncing
- **Rich Results**: Note previews with titles, content snippets, and tag information
- **Keyboard Navigation**: Arrow keys, enter, escape, and tab support
- **Performance**: Optimized for large note collections with result limiting
- **Context Awareness**: Smart result prioritization based on usage patterns

## Advanced Features

### Drag & Drop System
- **@dnd-kit Integration**: Professional drag and drop with accessibility support
- **Sortable Contexts**: Proper sortable list implementation with visual feedback
- **Activation Constraints**: 8px movement threshold to prevent accidental drags
- **Keyboard Support**: Full keyboard navigation for drag operations
- **Visual Feedback**: Real-time drag overlay with content preview
- **Smooth Animations**: CSS transforms for smooth drag transitions

### Theme Integration
- **CSS Variables**: All components use CSS custom properties for consistent theming
- **Dynamic Switching**: Real-time theme changes without component remounting
- **Color-Aware Elements**: Fade gradients and UI elements adapt to note colors
- **Accessibility**: High contrast mode support and WCAG 2.1 AA compliance
- **Cross-Platform**: Consistent appearance across different operating systems

### Performance Optimizations
- **Smart Rendering**: React.memo and useMemo for expensive operations
- **Debounced Operations**: Intelligent debouncing for search and auto-save
- **Efficient Updates**: Minimal re-renders through proper state management
- **Memory Management**: Proper cleanup of event listeners and timers
- **Auto-Resizing**: Dynamic textarea height adjustment without layout shifts

### User Experience Enhancements
- **Visual Feedback**: Loading states, progress indicators, and drag overlays
- **Error Handling**: Graceful error handling with user-friendly messages
- **Responsive Design**: Adaptive layouts with minimum size constraints
- **Smooth Animations**: CSS transitions for all state changes and interactions
- **Hidden Scrollbars**: Clean interface while maintaining full scroll functionality
- **Overflow Indicators**: Visual cues when content extends beyond visible area
- **Auto-Focus**: Intelligent focus management for editing workflows

## Component Architecture

### Design Patterns
- **Functional Components**: Modern React function components with hooks
- **TypeScript Integration**: Comprehensive type safety with explicit interfaces
- **Composition**: Component composition over inheritance for flexibility
- **Separation of Concerns**: Clear separation between UI logic and business logic

### State Management
- **Local State**: Component-level state for UI interactions
- **Props Interface**: Well-defined props interfaces for component communication
- **Event Handling**: Proper event delegation and cleanup
- **Side Effects**: Careful management of side effects with useEffect

### Accessibility Standards
- **Semantic HTML**: Proper use of semantic elements for screen readers
- **ARIA Labels**: Comprehensive ARIA labeling for interactive elements
- **Keyboard Navigation**: Logical tab order and keyboard shortcuts
- **Focus Management**: Visible focus indicators and proper focus trapping

## Design Principles
- **Type Safety**: Full TypeScript coverage with strict type checking
- **Performance**: Optimized rendering and minimal unnecessary re-renders
- **Accessibility**: WCAG 2.1 AA compliance for inclusive design
- **Maintainability**: Clear code structure with comprehensive documentation
- **Reusability**: Components designed for use across different contexts
- **Consistency**: Unified design language and interaction patterns