# PostIt App

## Project Overview
A production-ready macOS desktop application built with Electron + React + TypeScript for creating persistent sticky notes that float on the desktop. The app displays notes as always-on-top windows without a main dashboard interface, featuring advanced inline editing, drag & drop reordering, and comprehensive system integration.

## Architecture Decisions

### Technology Stack
- **Electron**: Desktop app framework for cross-platform compatibility
- **React + TypeScript**: Modern UI framework with type safety
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **SQLite (better-sqlite3)**: Local database for note persistence
- **Tiptap**: Rich text WYSIWYG editor with markdown support
- **@dnd-kit**: Modern drag and drop for React
- **@tiptap/starter-kit**: Core Tiptap extensions for rich text editing

### Project Structure
```
src/
  main/           # Electron main process code
  renderer/       # React renderer process code  
  components/     # Reusable React components
  database/       # SQLite database layer
  types/          # TypeScript type definitions
```

## Core Features

### Advanced Editing Features
1. **Dual-Mode Editor**: Toggle between rich WYSIWYG editing and drag & drop line mode
2. **Inline WYSIWYG Editing**: Tiptap-powered rich text editor with real-time markdown rendering
3. **Drag & Drop Reordering**: Line-by-line drag and drop with hover-visible handles
4. **Interactive Checkboxes**: Click-to-toggle task completion in both editing modes
5. **Auto-Resizing Content**: Dynamic text wrapping and overflow management
6. **Click-to-Edit Lines**: Individual line editing with auto-sizing textareas

### Note Management
7. **Persistent Sticky Notes**: SQLite-backed notes that survive app restarts
8. **Always-on-Top Toggle**: Configurable option to keep notes above all windows (default: enabled)
9. **Note Linking**: @-mention system for linking between notes with search dropdown
10. **Tag System**: Organize notes with scrollable, color-coded tags positioned below header
11. **Auto-save**: Configurable automatic saving with visual feedback (30 seconds default)
12. **Color Themes**: Yellow, pink, and blue note color options with dynamic fade gradients
13. **Window Controls**: Delete confirmation dialog with trash icon and minimize functionality
14. **Enhanced Markdown Persistence**: Improved formatting preservation across edit sessions

### System Integration
15. **Enhanced System Tray**: Context menu showing all notes with open/closed status indicators
16. **Global Search**: Fast full-text search across all notes with real-time results
17. **Settings Management**: Comprehensive settings with theme, startup, and window behavior controls
18. **Global Shortcuts**: System-wide keyboard shortcuts (CMD+N, CMD+Shift+F)
19. **Launch on Startup**: Optional automatic startup with system boot
20. **Theme Support**: Complete light/dark/system theme support with CSS variables
21. **macOS Distribution**: Complete electron-builder configuration for app packaging

### User Experience & Polish
22. **No Main Window**: Clean interface with only floating notes and system tray
23. **Text Wrapping**: Comprehensive word wrapping for all content types and long URLs
24. **Hidden Scrollbars**: Clean interface with scroll functionality maintained
25. **Overflow Indicators**: Visual feedback when content extends beyond visible area
26. **Smooth Animations**: Polished transitions for all UI interactions
27. **Window Positioning**: Smart cascading positioning for new notes
28. **Improved Dark Mode**: Enhanced visibility for tag inputs and UI elements in dark theme

## Development Scripts
- `npm run dev`: Start development with hot reload
- `npm run build:all`: Build both main and renderer processes
- `npm run build:main`: Build only the main Electron process
- `npm run build:renderer`: Build only the React renderer
- `npm run electron`: Run the built application
- `npm run pack`: Create unpacked development build
- `npm run dist`: Create distributable packages
- `npm run dist:mac`: Build macOS-specific distribution (DMG + ZIP)
- `npm run dist:all`: Build for all platforms (macOS, Windows, Linux)
- `npm run lint`: Run ESLint to check code quality
- `npm run lint:fix`: Run ESLint and automatically fix issues
- `npm run format`: Format code with Prettier
- `npm run format:check`: Check if code is properly formatted
- `npm run typecheck`: Run TypeScript type checking for both main and renderer

## Architecture Details

### Main Process Components
- **main.ts**: Core application lifecycle, window management, and theme coordination
- **system-tray.ts**: System tray integration with context menu and notifications
- **search-window.ts**: Global search interface with real-time results
- **settings-window.ts**: Settings management with validation and persistence
- **preload.ts**: Secure IPC bridge for note windows

### Theme System
- **CSS Variables**: Dynamic theming using CSS custom properties
- **System Integration**: Automatic dark mode detection via `nativeTheme`
- **Theme Persistence**: Settings-based theme preferences with real-time switching
- **Cross-Window**: Consistent theming across notes, search, and settings

### Global Shortcuts
- `Cmd/Ctrl+N`: Create new note (primary shortcut)
- `Cmd/Ctrl+Shift+N`: Create new note (backup shortcut)
- `Cmd/Ctrl+Shift+F`: Open global search
- `Cmd/Ctrl+S`: Save current note
- Context menu shortcuts for common actions

### Advanced Editor Architecture
- **Dual-Mode System**: TiptapEditor for rich text, DraggableLineEditor for drag operations
- **Real-Time Markdown**: Bidirectional HTML ↔ Markdown conversion with Tiptap
- **Drag & Drop Integration**: @dnd-kit with sortable contexts and visual feedback
- **Auto-Resizing Textareas**: Dynamic height adjustment during inline editing
- **Interactive Elements**: Click-to-toggle checkboxes in both editing modes
- **Theme-Aware Styling**: CSS variables for consistent appearance across modes

### Build & Distribution
- **Electron Builder**: Complete macOS app packaging with DMG and ZIP targets
- **Universal Binaries**: Support for both Intel (x64) and Apple Silicon (arm64)
- **Development Build**: Fast development iteration with Vite + Electron
- **Production Optimization**: Minified bundles with tree-shaking and code splitting

### Error Handling
- Input validation for all user inputs
- Graceful degradation for system integration failures
- Console logging for debugging without user interruption
- Build process safety with proper main/renderer separation

## Database Schema
- `notes`: Core note data with content, position, size, and timestamps
- `tags`: Tag definitions with normalized names and metadata
- `note_tags`: Many-to-many relationship between notes and tags with referential integrity