# PostIt - Desktop Sticky Notes App

A modern macOS desktop application for creating persistent sticky notes that float on your desktop. Built with Electron, React, and TypeScript, PostIt provides a seamless note-taking experience with rich text support, organizational features, and system integration.

## Features

### Core Note Features
- 🎯 **Always-on-Top Notes**: Notes stay visible above all other windows
- 💾 **Persistent Storage**: Notes are automatically saved and survive app restarts
- 📝 **Rich Text Support**: Markdown formatting with todo lists and nested subtasks
- 🔗 **Note Linking**: Link between notes using @-mentions
- 🏷️ **Tag System**: Organize notes with color-coded tags
- 💾 **Auto-save**: Automatic saving with configurable intervals (5-300 seconds)
- 🎨 **Color-coded Notes**: Yellow, pink, and blue note themes

### System Integration
- 🖥️ **System Tray**: Quick access with note count display and context menu
- 🔍 **Global Search**: Fast full-text search across all notes with instant results
- ⚙️ **Settings Management**: Comprehensive settings with theme control and startup options
- ⌨️ **Global Shortcuts**: 
  - `Cmd/Ctrl+Shift+N`: Create new note
  - `Cmd/Ctrl+Shift+F`: Open search window
- 🚀 **Launch on Startup**: Optional automatic startup with system

### Modern UI & Themes
- 🌙 **Dark Mode Support**: Complete light/dark/system theme support
- 🎨 **Modern Interface**: Clean and intuitive UI built with Tailwind CSS
- 📱 **Responsive Design**: Optimized for different screen sizes
- ♿ **Accessibility**: Keyboard navigation and screen reader support

## Tech Stack

- **Electron**: Cross-platform desktop application framework
- **React**: Modern UI library with TypeScript support
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **SQLite**: Local database for note persistence
- **react-markdown**: Markdown rendering support

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

- `npm run dev`: Start development with hot reload
- `npm run build:all`: Build both main and renderer processes
- `npm run electron`: Run the built application
- `npm run pack`: Create an unpacked build
- `npm run dist`: Create a distributable package

## User Guide

### Getting Started
1. **First Run**: On first launch, PostIt creates a sample note to get you started
2. **System Tray**: Look for the PostIt icon in your system tray for quick access
3. **Creating Notes**: Right-click the tray icon and select "New Note" or use `Cmd/Ctrl+Shift+N`

### Using Notes
- **Moving**: Drag notes by their header to reposition
- **Resizing**: Use the resize handle in the bottom-left corner
- **Markdown**: Type markdown syntax for rich formatting
- **Todo Lists**: Use `- [ ]` for checkboxes and `- [x]` for completed items
- **Linking**: Type `@` to search and link to other notes
- **Tags**: Click the "+" button in the header to add organizational tags

### Search & Organization
- **Global Search**: Use `Cmd/Ctrl+Shift+F` or tray menu to search all notes
- **Tag Filtering**: Search includes tag names for easy filtering
- **Quick Access**: Click any search result to instantly focus that note

### Customization
- **Themes**: Access Settings to choose Light, Dark, or System theme
- **Auto-save**: Configure save intervals from 5 seconds to 5 minutes
- **Startup**: Enable launch on system startup for convenience

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
    NoteEditor.tsx    # Main note editing interface
    MarkdownRenderer.tsx # Custom markdown with todo support
    TagInput.tsx      # Tag management component
    MentionSearch.tsx # @-mention search dropdown
  database/       # SQLite database layer
    database.ts     # Database operations and schema
  types/          # TypeScript type definitions
    index.ts        # Shared type definitions
```

## Database Schema

The application uses SQLite for data persistence with the following structure:

- `notes`: Core note data (content, position, size)
- `tags`: Tag definitions with normalized names
- `note_tags`: Many-to-many relationship between notes and tags

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

2. Create a distributable package:
   ```bash
   npm run dist
   ```

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
- Markdown support via [react-markdown](https://github.com/remarkjs/react-markdown) 