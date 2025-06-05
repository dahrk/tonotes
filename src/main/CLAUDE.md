# Main Process

## Purpose
The Electron main process manages the application lifecycle, creates and controls BrowserWindows for sticky notes, handles database operations, and provides comprehensive system integration features including search, settings, and theme management.

## Key Responsibilities
1. **Window Management**: Create/destroy note windows with always-on-top behavior
2. **Database Operations**: All SQLite operations happen in main process for thread safety
3. **System Integration**: System tray, global shortcuts, startup behavior, theme detection
4. **IPC Handling**: Bridge between renderer processes and core functionality
5. **Search Management**: Global search across all notes with real-time results
6. **Settings Management**: User preferences, theme control, and system integration options
7. **Theme Coordination**: Dynamic theme switching across all windows

## Key Files
- `main.ts`: Application entry point, lifecycle management, and theme coordination
- `system-tray.ts`: System tray integration with context menu and note count display
- `search-window.ts`: Global search interface with full-text search capabilities
- `settings-window.ts`: Settings management with validation and system integration
- `preload.ts`: Main note window IPC bridge
- `search-preload.ts`: Search window IPC bridge
- `settings-preload.ts`: Settings window IPC bridge

## Architecture Decisions
- Database operations centralized in main process to avoid concurrency issues
- Each note gets its own BrowserWindow for true always-on-top behavior
- Separate preload scripts for different window types to maintain security
- Global shortcuts registered at application level for system-wide access
- Theme system uses CSS variables for dynamic switching without page reloads
- Settings changes immediately propagate to all windows for real-time updates
- Search results limited and optimized for performance with large note collections

## System Integration Features
- **System Tray**: Always-visible with note count badge and context menu
- **Global Shortcuts**: System-wide keyboard shortcuts for common actions
- **Theme Detection**: Automatic system theme detection with manual override
- **Startup Integration**: Optional launch on system startup
- **Error Handling**: Graceful degradation with user-friendly error messages