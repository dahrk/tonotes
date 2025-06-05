# Components

## Purpose
Reusable React components providing a modular and feature-rich UI architecture for the PostIt application, with comprehensive theme support and enhanced user experience features.

## Implemented Components

### Core Note Components

#### NoteEditor.tsx
Advanced dual-mode editor with comprehensive editing features:
- **Editing Modes**: Plain text editing and live markdown preview with seamless switching
- **Keyboard Shortcuts**: Tab/Shift+Tab indentation, CMD+E preview toggle, CMD+S save
- **Auto-save**: Configurable auto-save intervals with visual feedback indicators
- **Progress Tracking**: Real-time task completion progress with visual indicators
- **Theme Support**: Dynamic theme switching with CSS variables
- **Accessibility**: Full keyboard navigation and screen reader support

#### MarkdownRenderer.tsx
Custom React Markdown renderer with enhanced task list support:
- **Interactive Tasks**: Checkbox todo items with click-to-toggle functionality
- **Nested Tasks**: Multi-level task lists with proper visual indentation
- **Task States**: Visual styling for completed tasks with strikethrough
- **Note Linking**: @-mention support with click-to-navigate functionality
- **Rich Formatting**: Support for headers, code blocks, links, and text formatting
- **Theme Aware**: Proper contrast ratios and theme-appropriate styling

#### TagInput.tsx
Sophisticated tag management interface:
- **Tag Creation**: Real-time tag creation with validation and deduplication
- **Autocomplete**: Intelligent suggestions from existing tags with fuzzy matching
- **Visual Design**: Color-coded tag pills with hover states and removal buttons
- **Keyboard Navigation**: Full keyboard support for tag operations
- **Integration**: Seamless integration with global tag database

#### MentionSearch.tsx
Advanced @-mention search functionality:
- **Real-time Search**: Instant search results as user types with debouncing
- **Rich Results**: Note previews with titles, content snippets, and tag information
- **Keyboard Navigation**: Arrow keys, enter, escape, and tab support
- **Performance**: Optimized for large note collections with result limiting
- **Context Awareness**: Smart result prioritization based on usage patterns

## Advanced Features

### Theme Integration
- **CSS Variables**: All components use CSS custom properties for consistent theming
- **Dynamic Switching**: Real-time theme changes without component remounting
- **Accessibility**: High contrast mode support and WCAG 2.1 AA compliance
- **Cross-Platform**: Consistent appearance across different operating systems

### Performance Optimizations
- **Smart Rendering**: React.memo and useMemo for expensive operations
- **Debounced Operations**: Intelligent debouncing for search and auto-save
- **Efficient Updates**: Minimal re-renders through proper state management
- **Memory Management**: Proper cleanup of event listeners and timers

### User Experience Enhancements
- **Visual Feedback**: Loading states, progress indicators, and status messages
- **Error Handling**: Graceful error handling with user-friendly messages
- **Responsive Design**: Adaptive layouts for different screen sizes
- **Smooth Animations**: CSS transitions for state changes and interactions

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