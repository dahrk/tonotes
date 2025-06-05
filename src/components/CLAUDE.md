# Components

## Purpose
Reusable React components that can be used across different parts of the application (note windows, search windows, settings).

## Component Categories
1. **Note Components**: Core note editing and display functionality
2. **UI Components**: Buttons, inputs, modals, and other interface elements
3. **Search Components**: @-mention search and global search interfaces
4. **Settings Components**: Configuration and preferences UI

## Key Files
- `NoteWindow.tsx`: Complete note window component
- `TagInput.tsx`: Tag management interface
- `SearchResults.tsx`: Search result display
- `ThemeProvider.tsx`: Theme context and dark mode support
- `ConfirmDialog.tsx`: Confirmation dialog for destructive actions

## Design Principles
- Components are fully typed with TypeScript
- Use Tailwind CSS for styling with CSS variables for theming
- Props interface clearly defined for each component
- Accessibility considerations built-in (ARIA labels, keyboard navigation)