# PostIt App

## Project Overview
A macOS desktop application built with Electron + React + TypeScript for creating persistent sticky notes that float on the desktop. The app displays notes as always-on-top windows without a main dashboard interface.

## Architecture Decisions

### Technology Stack
- **Electron**: Desktop app framework for cross-platform compatibility
- **React + TypeScript**: Modern UI framework with type safety
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **SQLite (better-sqlite3)**: Local database for note persistence
- **react-markdown**: Markdown rendering for rich text support

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

### Note Management
1. **Persistent Sticky Notes**: SQLite-backed notes that survive app restarts
2. **Always-on-Top**: Notes stay visible above all other windows
3. **Rich Text**: Markdown support with todo lists and nested subtasks
4. **Note Linking**: @-mention system for linking between notes
5. **Tag System**: Organize notes with color-coded tags
6. **Auto-save**: Configurable automatic saving (5-300 seconds)
7. **Color Themes**: Yellow, pink, and blue note color options

### System Integration
8. **System Tray**: Always-accessible tray icon with context menu and note count
9. **Global Search**: Fast full-text search across all notes with real-time results
10. **Settings Management**: Comprehensive settings window with theme and startup controls
11. **Global Shortcuts**: System-wide keyboard shortcuts for common actions
12. **Launch on Startup**: Optional automatic startup with system boot
13. **Theme Support**: Complete light/dark/system theme support across all windows

### User Experience
14. **No Main Window**: Clean interface with only floating notes and system tray
15. **Keyboard Navigation**: Full keyboard accessibility and shortcuts
16. **Error Handling**: Graceful error handling with user feedback
17. **Performance**: Optimized search and rendering for large note collections

## Development Scripts
- `npm run dev`: Start development with hot reload
- `npm run build:all`: Build both main and renderer processes
- `npm run electron`: Run the built application

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
- `Cmd/Ctrl+Shift+N`: Create new note
- `Cmd/Ctrl+Shift+F`: Open global search
- Context menu shortcuts for common actions

### Error Handling
- Input validation for all user inputs
- Graceful degradation for system integration failures
- Console logging for debugging without user interruption

## Database Schema
- `notes`: Core note data with content, position, size
- `tags`: Tag definitions with normalized names
- `note_tags`: Many-to-many relationship between notes and tags