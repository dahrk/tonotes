# Main Process

## Purpose
The Electron main process manages the application lifecycle, creates and controls BrowserWindows for sticky notes, handles database operations, and provides system integration features.

## Key Responsibilities
1. **Window Management**: Create/destroy note windows with always-on-top behavior
2. **Database Operations**: All SQLite operations happen in main process for thread safety
3. **System Integration**: System tray, global shortcuts, startup behavior
4. **IPC Handling**: Bridge between renderer processes and core functionality

## Key Files
- `main.ts`: Application entry point and lifecycle management
- `database.ts`: SQLite database initialization and operations
- `window-manager.ts`: BrowserWindow creation and management
- `ipc-handlers.ts`: IPC communication handlers
- `system-tray.ts`: System tray menu and functionality

## Architecture Decisions
- Database operations centralized in main process to avoid concurrency issues
- Each note gets its own BrowserWindow for true always-on-top behavior
- IPC used for all data exchange between main and renderer processes
- Window state (position, size) persisted to database for restoration