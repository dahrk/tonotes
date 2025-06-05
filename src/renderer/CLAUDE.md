# Renderer Process

## Purpose
React-based UI layer that runs in each note window. Handles user interactions, renders note content with rich markdown support, manages themes dynamically, and communicates with main process via IPC.

## Key Responsibilities
1. **Note Rendering**: Display note content with advanced markdown support and live preview
2. **User Input**: Handle text editing, resizing, positioning, and keyboard shortcuts
3. **UI Components**: Render headers, tags, buttons, and interactive elements with theme support
4. **IPC Communication**: Send user actions to main process and receive updates
5. **Theme Management**: Dynamic theme switching with CSS variables
6. **Accessibility**: Keyboard navigation and screen reader support

## Key Files
- `App.tsx`: Root component for note windows with theme management
- `main.tsx`: React entry point with theme initialization
- `styles.css`: Global styles with comprehensive CSS variable system for theming

## Component Architecture
- `NoteEditor.tsx`: Main note editing interface with markdown preview toggle
- `MarkdownRenderer.tsx`: Custom markdown rendering with todo support and note linking
- `TagInput.tsx`: Tag management with autocomplete and color coding
- `MentionSearch.tsx`: @-mention search interface with real-time results

## Theme System
- **CSS Variables**: Dynamic theming using custom properties for all colors
- **Theme Detection**: Automatic theme application based on system/user preferences
- **Real-time Switching**: Theme changes applied instantly without page reloads
- **Accessibility**: High contrast support and proper color combinations

## Architecture Decisions
- Each note window runs its own renderer process for isolation and performance
- State managed locally with IPC for persistence and cross-window coordination
- Real-time editing with configurable auto-save intervals
- Custom markdown renderer optimized for todo lists and note linking
- Theme system uses CSS variables for performance and maintainability
- Component isolation for better testing and maintainability