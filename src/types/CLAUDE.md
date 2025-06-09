# Type Definitions

## Purpose

Shared TypeScript interfaces and types used across the application. Ensures type safety between main and renderer processes.

## Key Type Categories

1. **Data Models**: Note, Tag, NoteTag interfaces matching database schema
2. **IPC Types**: Request/response interfaces for inter-process communication
3. **UI Types**: Component props, state interfaces, and event handlers
4. **Configuration Types**: Settings, preferences, and application config

## Key Files

- `index.ts`: Main type exports and re-exports
- `database.ts`: Database entity interfaces
- `ipc.ts`: IPC message type definitions
- `ui.ts`: UI component and state types

## Design Principles

- Strict typing with no `any` types allowed
- Interfaces over type aliases for extensibility
- Consistent naming conventions (PascalCase for interfaces)
- Comprehensive JSDoc comments for complex types
