# ToNotes - Desktop Sticky Notes App

A modern macOS desktop application for creating persistent sticky notes that float on your desktop. Built with Electron, React, and TypeScript, ToNotes provides a seamless note-taking experience with rich text support and organizational features.

## Features

- 🎯 **Always-on-Top Notes**: Notes stay visible above all other windows
- 💾 **Persistent Storage**: Notes are automatically saved and survive app restarts
- 📝 **Rich Text Support**: Markdown formatting with todo lists and subtasks
- 🔗 **Note Linking**: Link between notes using @-mentions
- 🏷️ **Tag System**: Organize notes with color-coded tags
- 💾 **Auto-save**: Automatic saving 30 seconds after edits
- 🎨 **Modern UI**: Clean and intuitive interface built with Tailwind CSS

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

## Project Structure

```
src/
  main/           # Electron main process code
  renderer/       # React renderer process code  
  components/     # Reusable React components
  database/       # SQLite database layer
  types/          # TypeScript type definitions
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