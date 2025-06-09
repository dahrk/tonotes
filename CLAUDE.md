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
- `Cmd/Ctrl+Shift+A`: Toggle always-on-top for all notes
- `Cmd/Ctrl+S`: Save current note
- Context menu shortcuts for common actions

### Advanced Editor Architecture
- **Dual-Mode System**: TiptapEditor for rich text, DraggableLineEditor for drag operations
- **Real-Time Markdown**: Bidirectional HTML ↔ Markdown conversion with Tiptap
- **Enhanced Initialization**: Improved markdown-to-HTML conversion for proper rendering on note reopen
- **Robust Task Lists**: Line-by-line processing ensures checkboxes and formatting display correctly
- **Drag & Drop Integration**: @dnd-kit with sortable contexts and visual feedback
- **Auto-Resizing Textareas**: Dynamic height adjustment during inline editing
- **Interactive Elements**: Click-to-toggle checkboxes in both editing modes
- **Theme-Aware Styling**: CSS variables for consistent appearance across modes

### Build & Distribution
- **Electron Builder**: Complete macOS app packaging with DMG and ZIP targets
- **Universal Binaries**: Support for both Intel (x64) and Apple Silicon (arm64)
- **Development Build**: Fast development iteration with Vite + Electron
- **Production Optimization**: Minified bundles with tree-shaking and code splitting

### Recent Bug Fixes & Improvements

#### Markdown Rendering Issues (December 2024)
- **Problem**: Excessive whitespace in markdown conversion causing bullets and checkboxes to appear separated from their text
- **Root Cause**: Previous fix only addressed `htmlToMarkdown` but not `markdownToHtml`, plus empty lines were creating excessive `<br>` tags
- **Solution**: 
  - Improved `htmlToMarkdown` function with proper list item formatting using arrays and join operations
  - Fixed `markdownToHtml` to skip empty lines preventing excess `<br>` tag generation
  - Enhanced list formatting to preserve proper spacing without excess newlines
- **Files Modified**: `src/components/TiptapEditor.tsx`

#### System Tray Visibility Issues (December 2024)
- **Problem**: System tray icon appearing to disappear when no notes exist (noteCount = 0)
- **Root Cause**: Setting tray title to empty string (`''`) on macOS made icon less visible or appear hidden
- **Solution**:
  - Show bullet character (`●`) instead of empty string when noteCount is 0
  - Improved fallback SVG icon with higher contrast colors and removed problematic `currentColor`
  - Enhanced icon visibility with thicker strokes and better color contrast
- **Files Modified**: `src/main/system-tray.ts`

### Error Handling
- Input validation for all user inputs
- Graceful degradation for system integration failures
- Console logging for debugging without user interruption
- Build process safety with proper main/renderer separation

## Database Schema
- `notes`: Core note data with content, position, size, and timestamps
- `tags`: Tag definitions with normalized names and metadata
- `note_tags`: Many-to-many relationship between notes and tags with referential integrity

## Recent Enhancements

### Critical Markdown Rendering Fix
- **Problem Solved**: Notes now properly display formatted markdown when reopened (checkboxes, headers, lists)
- **Root Cause**: Timing issues in editor initialization and inadequate markdown-to-HTML conversion
- **Solution**: Complete rewrite of markdownToHtml function with line-by-line processing
- **Impact**: Seamless editing experience with consistent formatting across sessions

### Always-on-Top Keyboard Toggle
- **New Feature**: CMD+Shift+A global shortcut to toggle always-on-top for all notes
- **System Integration**: Desktop notifications, system tray updates, and settings persistence
- **User Experience**: Instant feedback with visual indicators in tray menu
- **Implementation**: Robust settings management with programmatic updates

## Critical Bug Fixes

### Issue 1: Markdown Element Separation on Reload
- **Problem**: Bullet points, checkboxes, and numbered lists broke formatting when notes were reopened
- **Root Cause**: 
  - Ordered lists showed "$1" due to incorrect regex replacement not capturing content
  - Excessive newlines from aggressive whitespace normalization in htmlToMarkdown
  - Bullet points and checkboxes separated due to incorrect newline insertion
- **Solution**: 
  - Fixed ordered list regex to properly capture and use list content
  - Reduced excessive whitespace normalization while preserving structure
  - Removed leading newlines from list item generation
  - Improved paragraph handling to prevent extra spacing
- **Result**: All markdown elements now render exactly as saved, no visual differences on reopen

### Issue 2: Tab Behavior in Todo Lists  
- **Problem**: Tab key only indented text, not the entire todo item with checkbox
- **Root Cause**: Manual space insertion instead of using Tiptap's built-in list commands
- **Solution**:
  - Replaced manual Tab handling with Tiptap's `sinkListItem()` and `liftListItem()` commands
  - Added proper detection for `taskItem` vs `listItem` context using `editor.isActive()`
  - Implemented conditional command execution with `editor.can()` checks
  - Maintained fallback space insertion for non-list content
- **Result**: Tab now properly indents entire todo items (checkbox + text) maintaining list structure