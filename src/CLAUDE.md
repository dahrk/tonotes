# Source Directory

## Architecture
The source code is organized into distinct layers following Electron's process separation:

### Directory Structure
- **main/**: Electron main process - manages app lifecycle, creates windows, handles system tray
- **renderer/**: React app - UI components and client-side logic
- **components/**: Reusable React components for notes, search, settings
- **database/**: SQLite abstraction layer and database operations
- **types/**: Shared TypeScript interfaces and type definitions

### Process Communication
- Main process handles window creation, database operations, and system integration
- Renderer processes handle UI and user interactions
- IPC (Inter-Process Communication) bridges the two for data exchange

### Data Flow
1. User interactions in renderer trigger IPC calls to main process
2. Main process performs database operations
3. Results sent back to renderer for UI updates
4. All note state managed centrally in main process