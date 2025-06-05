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
1. **Persistent Sticky Notes**: SQLite-backed notes that survive app restarts
2. **Always-on-Top**: Notes stay visible above all other windows
3. **No Main Window**: Only floating notes and system tray interaction
4. **Rich Text**: Markdown support with todo lists and subtasks
5. **Note Linking**: @-mention system for linking between notes
6. **Tag System**: Organize notes with color-coded tags
7. **Auto-save**: Automatic saving 30 seconds after edits

## Development Scripts
- `npm run dev`: Start development with hot reload
- `npm run build:all`: Build both main and renderer processes
- `npm run electron`: Run the built application

## Database Schema
- `notes`: Core note data with content, position, size
- `tags`: Tag definitions with normalized names
- `note_tags`: Many-to-many relationship between notes and tags