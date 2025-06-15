# PostIt - Advanced Desktop Sticky Notes

A production-ready macOS desktop application for creating persistent sticky notes that float on your desktop. Built with Electron, React, and TypeScript, PostIt provides a sophisticated note-taking experience with dual-mode editing, drag & drop reordering, rich text support, and comprehensive system integration.

## Features

### Advanced Editing Features
- ✨ **Dual-Mode Editor**: Toggle between rich WYSIWYG editing and drag & drop line mode
- 📝 **Inline WYSIWYG Editor**: Tiptap-powered rich text editing with real-time markdown rendering
- 🔄 **Drag & Drop Reordering**: Effortlessly reorder lines with hover-visible drag handles
- ☑️ **Interactive Checkboxes**: Click-to-toggle task completion in both editing modes
- 📏 **Auto-Resizing Content**: Smart text wrapping and dynamic height adjustment
- ✏️ **Click-to-Edit Lines**: Individual line editing with auto-sizing textareas

### Core Note Features
- 🎯 **Always-on-Top Toggle**: Configurable option to keep notes above all windows (default: enabled)
- 💾 **Persistent Storage**: SQLite-backed notes that survive app restarts and crashes
- 🔗 **Smart Note Linking**: Link between notes using @-mentions with search dropdown
- 🏷️ **Advanced Tag System**: Scrollable, color-coded tags positioned below header for better organization
- 💾 **Auto-save**: Intelligent auto-saving with visual feedback (30-second intervals)
- 🎨 **Themed Notes**: Yellow, pink, and blue themes with dynamic fade gradients
- 🗑️ **Safe Deletion**: Delete confirmation dialog with intuitive trash icon
- 📐 **Window Controls**: Minimize functionality and smart window constraints (320x200px minimum)
- 📝 **Enhanced Markdown**: Improved formatting preservation across edit sessions

### System Integration
- 🖥️ **Enhanced System Tray**: Context menu showing all notes with open/closed status indicators
- 🔍 **Lightning-Fast Search**: Full-text search across all notes with real-time results
- ⚙️ **Comprehensive Settings**: Theme control, startup options, and window behavior preferences
- ⌨️ **Note-Focused Shortcuts**: 
  - `Cmd/Ctrl+N`: Create new note (when note is focused)
  - `Cmd/Ctrl+Shift+N`: Create new note (backup shortcut)
  - `Cmd/Ctrl+Shift+F`: Open search window (when note is focused)
  - `Cmd/Ctrl+Shift+A`: Toggle always-on-top for all notes (when note is focused)
  - `Cmd/Ctrl+S`: Save current note (when note is focused)
  - **Note**: All shortcuts work only when a note window is focused. Use system tray to create notes when no notes are focused.
- 🚀 **Smart Startup**: Optional automatic launch with system boot
- 📦 **Easy Distribution**: Complete macOS app packaging with DMG and ZIP

### Polished UI & Experience
- 🌙 **Advanced Theming**: Complete light/dark/system theme support with CSS variables
- 🎨 **Modern Interface**: Clean, intuitive UI with smooth animations and transitions
- 📜 **Hidden Scrollbars**: Clean appearance while maintaining full scroll functionality
- 📊 **Overflow Indicators**: Visual feedback when content extends beyond visible area
- 🎯 **Smart Positioning**: Intelligent cascading window placement for new notes
- 🌊 **Smooth Interactions**: Polished animations for all UI elements
- 🌚 **Improved Dark Mode**: Enhanced visibility for tag inputs and UI elements in dark theme

## Tech Stack

- **Electron**: Cross-platform desktop application framework with native OS integration
- **React + TypeScript**: Modern UI framework with comprehensive type safety
- **Tiptap**: Professional WYSIWYG editor with markdown support and extensions
- **@dnd-kit**: Modern, accessible drag and drop library for React
- **Vite**: Lightning-fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework with custom theme system and composable styling utilities
- **SQLite (better-sqlite3)**: High-performance local database for note persistence
- **Electron Builder**: Complete application packaging and distribution solution

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tonotes.git
   cd tonotes
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev`: Start development with hot reload and debugging
- `npm run build:all`: Build both main and renderer processes
- `npm run build:main`: Build only the Electron main process
- `npm run build:renderer`: Build only the React renderer
- `npm run electron`: Run the built application
- `npm run pack`: Create an unpacked development build
- `npm run dist`: Create distributable packages for current platform
- `npm run dist:mac`: Build macOS-specific distribution (DMG + ZIP)
- `npm run dist:all`: Build for all platforms (macOS, Windows, Linux)

### Testing

- `npm test`: Run comprehensive test suite with Jest and React Testing Library
- `npm run test:watch`: Run tests in watch mode for development
- `npm run test:coverage`: Generate detailed coverage report (80%+ target)
- `npm run test:ci`: Run tests in CI/CD mode with coverage enforcement

**Testing Strategy**: The application maintains 80%+ test coverage with comprehensive unit, integration, and E2E tests covering critical user workflows including markdown preservation, window management, and settings persistence. See [Testing Guide](docs/TESTING.md) for detailed information.

## User Guide

### Getting Started
1. **First Run**: On first launch, PostIt creates a sample note to get you started
2. **System Tray**: Look for the PostIt icon in your system tray for quick access
3. **Creating Notes**: Right-click the tray icon and select "New Note" or use `Cmd/Ctrl+N`

### Using Notes
- **Dual Editing Modes**: Click the ⋮⋮ button to toggle between rich text and drag mode
- **Rich Text Mode**: Full WYSIWYG editing with real-time markdown rendering
- **Drag Mode**: Line-by-line editing with hover drag handles for reordering
- **Moving**: Drag notes by their header to reposition on screen
- **Window Controls**: Click trash icon to delete (with confirmation) or minimize notes
- **Resizing**: Notes resize automatically, with 320x200px minimum size
- **Interactive Checkboxes**: Click checkboxes to toggle completion in both modes
- **Markdown Support**: Type markdown syntax for headers, lists, and formatting
- **Smart Linking**: Type `@` to search and link to other notes with dropdown
- **Advanced Tags**: Scrollable tag system positioned below header with overflow indicators

### Search & Organization
- **Global Search**: Use `Cmd/Ctrl+Shift+F` or tray menu to search all notes
- **Tag Filtering**: Search includes tag names for easy filtering
- **Quick Access**: Click any search result to instantly focus that note

### Customization & Settings
- **Advanced Theming**: Choose Light, Dark, or System theme with real-time switching
- **Auto-save**: Intelligent 30-second auto-save with visual feedback
- **Startup Integration**: Enable launch on system startup for seamless workflow
- **Window Behavior**: Configure always-on-top behavior and smart cascading positioning
- **Enhanced System Tray**: Context menu shows all notes with open/closed indicators

## Project Structure

```
src/
  main/           # Electron main process code
    main.ts          # Application entry point and lifecycle
    system-tray.ts   # System tray integration
    search-window.ts # Global search functionality
    settings-window.ts # Settings management
    preload.ts       # Note window preload script
  renderer/       # React renderer process code  
    App.tsx         # Root component
    main.tsx        # React entry point
    styles.css      # Global styles with theme support
  components/     # Reusable React components
    NoteEditor.tsx       # Dual-mode editor with toggle functionality
    TiptapEditor.tsx     # Rich WYSIWYG editor with Tiptap
    DraggableLineEditor.tsx # Line-based editor with drag & drop
    MarkdownRenderer.tsx # Custom markdown with todo support
    TagInput.tsx         # Advanced tag management with scrolling
    MentionSearch.tsx    # @-mention search dropdown with real-time results
  database/       # SQLite database layer
    database.ts     # Database operations and schema
  types/          # TypeScript type definitions
    index.ts        # Shared type definitions
  utils/          # Utility functions and helpers
    styles.ts       # Composable styling system with cn() utility
```

## Database Schema

The application uses SQLite for robust data persistence with the following structure:

- `notes`: Core note data (content, position, size, timestamps, color themes)
- `tags`: Tag definitions with normalized names and metadata
- `note_tags`: Many-to-many relationship between notes and tags with referential integrity

## Development

### Code Style

- Follow TypeScript best practices
- Use functional React components
- Implement proper type definitions
- Follow the existing project structure

### Building for Production

1. Build the application:
   ```bash
   npm run build:all
   ```

2. Create macOS distributable packages:
   ```bash
   npm run dist:mac
   ```
   This creates both DMG and ZIP files for Intel and Apple Silicon Macs.

3. Create distributable packages for all platforms:
   ```bash
   npm run dist:all
   ```

## Troubleshooting

### Common Issues

**Notes not saving properly**
- Check that the app has write permissions to the user data directory
- Restart the application if auto-save appears stuck
- Manual save with `Cmd/Ctrl+S` should always work

**System tray icon not visible**
- On macOS, check System Preferences > Dock & Menu Bar > Clock
- If using dark mode, the icon may be less visible - look for the bullet (●) indicator
- Right-click in the system tray area to access the context menu

**Notes not staying on top**
- Use `Cmd/Ctrl+Shift+A` to toggle always-on-top behavior
- Check Settings window for always-on-top preferences
- On macOS, ensure the app has accessibility permissions if needed

**Performance issues with many notes**
- Consider archiving old notes by deleting unused ones
- Global search is optimized but may be slower with 100+ notes
- Close unused note windows to reduce memory usage

**Build or installation issues**
- Ensure Node.js version 16+ is installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- For macOS builds, ensure Xcode command line tools are installed

### System Requirements

- **macOS**: 10.14 Mojave or later (Intel and Apple Silicon supported)
- **Windows**: Windows 10 version 1809 or later
- **Linux**: Ubuntu 18.04, Fedora 28, or equivalent
- **Memory**: 200MB RAM minimum, 500MB recommended
- **Storage**: 150MB for application and user data

### Known Limitations

- Maximum of ~1000 notes for optimal performance
- Note content size limit of 1MB per note
- System tray behavior varies by operating system
- Shortcuts only work when note windows are focused (by design to prevent conflicts)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI powered by [React](https://reactjs.org/) and [Tailwind CSS](https://tailwindcss.com/)
- Rich text editing via [Tiptap](https://tiptap.dev/)
- Drag and drop with [@dnd-kit](https://github.com/clauderic/dnd-kit) 