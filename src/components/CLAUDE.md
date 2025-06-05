# Components

## Purpose
Reusable React components that can be used across different parts of the application (note windows, search windows, settings).

## Implemented Components

### Core Note Components
- **NoteEditor.tsx**: Dual-mode editor supporting both plain text editing and markdown preview
  - Features: Tab/Shift+Tab indentation, CMD+E preview toggle, CMD+S save
  - Progress indicator for todo tasks
  - Real-time task completion tracking
  
- **MarkdownRenderer.tsx**: Custom React Markdown renderer with task list support
  - Checkbox todo items with click-to-toggle functionality
  - Strikethrough styling for completed tasks
  - Nested task list support with proper indentation
  - Custom styling for headings, code blocks, and text formatting

## Planned Components
- `TagInput.tsx`: Tag management interface
- `SearchResults.tsx`: Search result display and @-mention functionality
- `ThemeProvider.tsx`: Theme context and dark mode support
- `ConfirmDialog.tsx`: Confirmation dialog for destructive actions

## Component Architecture
- **Functional components with TypeScript**: All components use React function components with full TypeScript typing
- **Props interfaces**: Explicit interfaces for all component props ensuring type safety
- **Keyboard shortcuts**: Integrated keyboard navigation and shortcuts (CMD+E, CMD+S, Tab indentation)
- **Task management**: Built-in progress tracking and task completion handling
- **Accessibility**: Screen reader friendly with proper ARIA labels and semantic HTML

## Design Principles
- Components are fully typed with TypeScript
- Use Tailwind CSS for styling with CSS variables for theming and custom task-specific classes
- Props interface clearly defined for each component
- Accessibility considerations built-in (ARIA labels, keyboard navigation)
- Minimal external dependencies (react-markdown only)