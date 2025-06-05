# Renderer Process

## Purpose
React-based UI layer that runs in each note window. Handles user interactions, renders note content, and communicates with main process via IPC.

## Key Responsibilities
1. **Note Rendering**: Display note content with markdown support
2. **User Input**: Handle text editing, resizing, and positioning
3. **UI Components**: Render headers, tags, buttons, and interactive elements
4. **IPC Communication**: Send user actions to main process and receive updates

## Key Files
- `App.tsx`: Root component for note windows
- `NoteEditor.tsx`: Main note editing interface
- `NoteHeader.tsx`: Header with tags, save button, close button
- `MarkdownRenderer.tsx`: Custom markdown rendering with todo support
- `SearchDropdown.tsx`: @-mention search interface

## Architecture Decisions
- Each note window runs its own renderer process for isolation
- State managed locally with IPC for persistence
- Real-time editing with debounced auto-save
- Custom markdown renderer for todo lists and note linking