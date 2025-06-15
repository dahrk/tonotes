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
  utils/          # Utility functions and helpers
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
- `npm run test`: Run comprehensive test suite with Jest and React Testing Library
- `npm run test:watch`: Run tests in watch mode for development
- `npm run test:coverage`: Generate detailed coverage report (80%+ target)
- `npm run test:ci`: Run tests in CI/CD mode with coverage enforcement

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

### Note-Focused Shortcuts
- `Cmd/Ctrl+N`: Create new note (when note window is focused)
- `Cmd/Ctrl+Shift+N`: Create new note (backup shortcut)
- `Cmd/Ctrl+Shift+F`: Open global search (when note window is focused)
- `Cmd/Ctrl+Shift+A`: Toggle always-on-top (when note window is focused)
- `Cmd/Ctrl+S`: Save current note (when note window is focused)
- **Architecture Change**: Global shortcuts removed to prevent conflicts with other applications
- **Alternative Access**: System tray remains available for creating notes when no notes are focused
- **User Experience**: Follows expected desktop app behavior where shortcuts are contextual to focused window

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

### Testing Infrastructure & Quality Assurance (December 2024)

#### Comprehensive Testing Framework
Implemented a robust testing strategy with 80%+ code coverage requirement:

- **Testing Stack**: Jest + React Testing Library + custom Electron mocks for complete coverage
- **Test Organization**: Unit, integration, and E2E tests with priority-based implementation
- **Coverage Requirements**: 80%+ overall, 100% for critical paths (markdown, database, window management)
- **Mock Strategy**: Comprehensive Electron API mocking for reliable, fast tests
- **CI Integration**: Automated testing with coverage enforcement and failure prevention

#### Test Categories & Priorities

**Priority 1: Markdown Save/Load Cycle Tests** (Critical)
- Complete content preservation through save/load cycles
- Bullet list formatting without line breaks
- Numbered list sequence maintenance (1, 2, 3 not all 1s)  
- Nested todo indentation and checkbox rendering
- Edge case handling (empty lines, special characters, long content)
- JSON format support with legacy markdown fallback

**Priority 2: Window Management Tests** (High)
- System tray persistence when all windows closed
- Window creation, positioning, and cascading
- Always-on-top setting coordination across all windows
- Window focus, recreation after destruction, and cleanup
- Multi-window theme application and state management

**Priority 3: User Settings Tests** (Medium)
- Settings persistence across app restarts and window recreation
- Theme propagation to all open windows (light/dark/system)
- Always-on-top toggle affecting all windows simultaneously
- Settings validation and error handling with graceful fallbacks

#### E2E Testing Coverage
- **Complete user journeys**: Note creation → editing → saving → reopening
- **Multi-window workflows**: Creating multiple notes, system tray interactions
- **Tag management**: Adding, removing, searching tags with autocomplete
- **Keyboard shortcuts**: All shortcuts working correctly in context
- **Error scenarios**: Graceful handling of API failures and edge cases

#### Testing Architecture Benefits
- **Reliability**: Catches regressions in critical user-facing functionality
- **Documentation**: Tests serve as living documentation of expected behavior
- **Refactoring Safety**: Enables confident code changes with regression protection
- **Quality Gates**: Prevents broken code from reaching production
- **Developer Experience**: Fast feedback loop with watch mode and targeted testing

### Standard Markdown Rendering Refactor (December 2024)

#### Research Findings
Based on comprehensive research of Tiptap best practices and standard approaches:

- **Tiptap is not markdown native** - It uses ProseMirror JSON internally, not markdown
- **Official approach**: Store content in Tiptap's native JSON format, not markdown
- **Standard pattern**: Use Tiptap's built-in serialization (getJSON/setContent) instead of custom conversion
- **Performance**: Tiptap's native serialization is faster and more reliable than regex-based parsing
- **Compatibility**: Official Tiptap conversion extensions handle import/export properly

#### Implementation Changes
- **Removed custom markdown parsing**: Eliminated 343 lines of complex HTML ↔ Markdown conversion
- **Native JSON storage**: Now store Tiptap's JSON format instead of markdown strings
- **Backward compatibility**: Added legacy markdown support for existing data
- **Standard Tiptap API**: Use editor.getJSON() and setContent() for serialization
- **Bundle optimization**: Reduced JavaScript bundle from 217.62 kB to 214.37 kB

#### Issues Resolved
- **Numbered lists**: Now use proper ProseMirror list structures with correct incrementing
- **Nested todos**: Work correctly with Tiptap's built-in list nesting capabilities
- **Formatting preservation**: All formatting preserved using ProseMirror's document model
- **Performance**: Eliminated regex-heavy conversions causing delays on save/load
- **Reliability**: Removed fragile custom parsing prone to edge case failures

### Composable Styling System (December 2024)

#### Design Philosophy
Implemented a comprehensive styling utility system to improve maintainability and reduce code duplication:

- **Central Style Management**: All reusable styles defined in `src/utils/styles.ts`
- **Type Safety**: Full TypeScript support for style constants and utilities
- **Conditional Classes**: Smart `cn()` utility for combining classes with conditional logic
- **Consistency**: Standardized patterns across all components
- **Performance**: Reduced CSS class string concatenation and duplication

#### Key Components

**cn() Utility Function**
```typescript
// Intelligently combines class names, filtering out undefined/false values
cn('base-class', isActive && 'active', error && 'error-state')
```

**Style Constants**
- `layoutStyles`: Common layout patterns (centerContent, macOSHeaderSpacing)
- `tagStyles`: Tag component patterns (pill, removeButton, addButton)  
- `buttonStyles`: Button patterns (base, delete)
- `editorStyles`: Editor component patterns (tiptap, content, scrollable)
- `positionStyles`: Positioning utilities (absolute, dropdown)

#### Implementation Impact
- **Maintainability**: Centralized style definitions eliminate duplication
- **Developer Experience**: IDE autocompletion and type checking for style constants
- **Consistency**: Unified styling patterns across components
- **Bundle Size**: Optimized class name generation and reduced redundancy
- **Refactoring**: Easier to update styles globally by changing constants

#### Migration Pattern
```typescript
// Before: Hardcoded className strings
<div className="w-full h-full flex items-center justify-center">

// After: Reusable style constants  
<div className={layoutStyles.centerContent}>

// Before: Template literal concatenation
className={`mention-search-item ${index === selectedIndex ? 'selected' : ''}`}

// After: cn() utility with conditional logic
className={cn('mention-search-item', index === selectedIndex && 'selected')}
```

### Previous Bug Fixes & Improvements

#### Markdown Rendering Issues (December 2024)
- **Problem**: Excessive whitespace in markdown conversion causing bullets and checkboxes to appear separated from their text
- **Root Cause**: Previous fix only addressed `htmlToMarkdown` but not `markdownToHtml`, plus empty lines were creating excessive `<br>` tags
- **Solution**: 
  - Improved `htmlToMarkdown` function with proper list item formatting using arrays and join operations
  - Fixed `markdownToHtml` to skip empty lines preventing excess `<br>` tag generation
  - Enhanced list formatting to preserve proper spacing without excess newlines
- **Files Modified**: `src/components/TiptapEditor.tsx`

#### Numbered List Sequencing and Indentation (December 2024)
- **Problem**: Numbered lists showing "1." for all items instead of incrementing, and indented todos/lists losing nesting after save/reload
- **Root Cause**: 
  - CSS `list-style-type` not set for Tiptap ordered lists, causing browser default reset
  - Indentation information was being ignored during markdown to HTML conversion
- **Solution**:
  - Added `list-style-type: decimal` for `.tiptap-ordered-list` in CSS
  - Added `list-style-type: disc` for `.tiptap-bullet-list` for consistency
  - Implemented indentation preservation using margin-left CSS styles (20px = 1 level)
  - Enhanced HTML to markdown conversion to restore indentation as proper 2-space formatting
- **Files Modified**: `src/components/TiptapEditor.tsx`, `src/renderer/styles.css`

#### System Tray Visibility Issues (December 2024)
- **Problem**: System tray icon appearing to disappear when no notes exist (noteCount = 0)
- **Root Cause**: Setting tray title to empty string (`''`) on macOS made icon less visible or appear hidden
- **Solution**:
  - Show bullet character (`●`) instead of empty string when noteCount is 0
  - Improved fallback SVG icon with higher contrast colors and removed problematic `currentColor`
  - Enhanced icon visibility with thicker strokes and better color contrast
- **Files Modified**: `src/main/system-tray.ts`

#### Code Quality Improvements (December 2024)
- **Cleanup**: Removed unused functions, variables, and parameters throughout codebase
- **Bundle Size**: Reduced JavaScript bundle from 217.80 kB to 217.62 kB
- **TypeScript**: Fixed all unused variable warnings and improved type safety
- **UI Polish**: Added proper spacing between save and delete buttons (4px → 12px)
- **Files Modified**: `src/components/TiptapEditor.tsx`, `src/renderer/App.tsx`

#### Comprehensive Code Cleanup & Standardization (December 2024)
- **Unused Dependencies**: Removed `electron-store` package that was never used
- **Legacy CSS**: Removed 112+ lines of unused task list styles from pre-Tiptap implementation
- **Code Comments**: Simplified `setupGlobalShortcuts()` method with clearer documentation
- **Standard Patterns**: Implemented composable styling system with `cn()` utility
- **Style Consolidation**: Centralized reusable styles in `src/utils/styles.ts`
- **Documentation**: Enhanced README.md and CLAUDE.md with accurate technical details
- **Bundle Optimization**: Further reduced CSS bundle from 16.88 kB to 15.84 kB
- **Files Modified**: `package.json`, `src/renderer/styles.css`, `src/main/main.ts`, multiple component files

### Error Handling
- Input validation for all user inputs
- Graceful degradation for system integration failures
- Console logging for debugging without user interruption
- Build process safety with proper main/renderer separation

## Database Schema

The application uses SQLite with better-sqlite3 for high-performance synchronous operations:

### Tables

```sql
-- Core note storage
notes (
  id TEXT PRIMARY KEY,           -- UUID v4 identifier
  content TEXT NOT NULL DEFAULT '', -- Markdown content
  color TEXT NOT NULL CHECK(color IN ('yellow', 'pink', 'blue')),
  position_x INTEGER NOT NULL,   -- Window X coordinate
  position_y INTEGER NOT NULL,   -- Window Y coordinate  
  width INTEGER NOT NULL DEFAULT 300,
  height INTEGER NOT NULL DEFAULT 300,
  created_at TEXT NOT NULL,      -- ISO timestamp
  updated_at TEXT NOT NULL       -- ISO timestamp
);

-- Tag definitions
tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL      -- Normalized tag name (lowercase, hyphenated)
);

-- Many-to-many note-tag relationships
note_tags (
  note_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

### Design Decisions
- **UUID Primary Keys**: Prevents collisions and enables distributed scenarios
- **Foreign Key Constraints**: Ensures referential integrity with automatic cleanup
- **Synchronous Operations**: Better-sqlite3 provides simpler API than async alternatives
- **Normalized Tags**: Tag names are stored once and referenced, preventing duplication
- **JSON-Free Design**: Simple relational model for better query performance

## Markdown Rendering Implementation

### Architecture Overview

The markdown system uses a bidirectional conversion approach between HTML (for Tiptap) and Markdown (for storage):

```
Storage (Markdown) ←→ Tiptap Editor (HTML) ←→ User Interface
```

### Key Components

1. **markdownToHtml()**: Converts stored markdown to HTML for Tiptap initialization
2. **htmlToMarkdown()**: Converts Tiptap HTML back to markdown for storage
3. **processInlineMarkdown()**: Handles inline formatting (bold, italic, links, code)

### List Handling Strategy

The implementation uses a line-by-line processing approach for better control:

```typescript
// Indentation preservation using CSS margins
const indentLevel = Math.floor(indent.length / 2); // 2 spaces = 1 level
const marginStyle = indentLevel > 0 ? ` style="margin-left: ${indentLevel * 20}px;"` : '';

// HTML output with preserved indentation
`<li${marginStyle}>${processInlineMarkdown(content)}</li>`

// Restoration during HTML to markdown conversion
const marginPx = marginStr ? parseInt(marginStr) : 0;
const indentLevel = Math.floor(marginPx / 20); // 20px = 1 level
const indent = '  '.repeat(indentLevel); // 2 spaces per level
```

### Supported Markdown Features

- **Headers**: `# ## ### ####` with proper hierarchy
- **Lists**: Unordered (`-`), ordered (`1.`), and task lists (`- [ ]` / `- [x]`)
- **Indentation**: 2-space indentation levels preserved via CSS margins
- **Inline Formatting**: Bold (`**`), italic (`*`), code (`` ` ``), links (`[text](url)`)
- **Note Links**: Special `note://` protocol for internal linking
- **Code Blocks**: Fenced code blocks with ``` syntax

### Technical Challenges Solved

1. **Bidirectional Conversion**: Ensuring markdown ↔ HTML conversion preserves all formatting
2. **Indentation Handling**: Using CSS margins to preserve list nesting without complex HTML nesting
3. **Empty Line Management**: Preventing excessive `<br>` tags while preserving intentional spacing
4. **List Style Reset**: Tailwind CSS resets required explicit `list-style-type` declaration
5. **Interactive Elements**: Making checkboxes clickable in both edit and view modes

## Future Improvement Ideas

### Performance Optimizations
- Implement virtual scrolling for large notes (>10,000 characters)
- Add database query optimization with indexes for search
- Consider note content chunking for very large documents
- Implement lazy loading for note windows

### Feature Enhancements
- Export functionality (PDF, HTML, plain text)
- Import from other note-taking apps
- Advanced search with regex and tag filtering
- Note templates and quick-insert snippets
- Collaborative editing with operational transforms
- Plugin system for custom extensions

### Technical Debt
- Migrate from CSS margins to proper HTML list nesting for indentation
- Implement proper undo/redo stack in Tiptap
- Add comprehensive error reporting and crash analytics
- Improve TypeScript coverage and strict mode compliance
- Add automated accessibility testing

### Architecture Improvements
- Consider moving to web workers for heavy operations
- Implement proper state management with Redux or Zustand
- Add comprehensive logging and debugging infrastructure
- Migrate to Electron's context isolation for better security