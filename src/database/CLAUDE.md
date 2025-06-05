# Database Layer

## Purpose
SQLite database abstraction layer providing type-safe operations for notes, tags, and relationships. All database operations are synchronous and run in the main process.

## Key Responsibilities
1. **Schema Management**: Database initialization and migrations
2. **CRUD Operations**: Create, read, update, delete operations for all entities
3. **Query Interface**: Type-safe query methods with proper error handling
4. **Data Integrity**: Foreign key constraints and transaction support

## Key Files
- `database.ts`: Main database class and connection management
- `schema.sql`: Database schema definitions
- `migrations.ts`: Database version management and migrations
- `queries.ts`: Prepared statement definitions and query methods

## Schema Design
```sql
notes: id, content, color, position_x, position_y, width, height, created_at, updated_at
tags: id, name (normalized)
note_tags: note_id, tag_id (junction table)
```

## Architecture Decisions
- Using better-sqlite3 for synchronous operations (simpler than async in main process)
- Prepared statements for performance and security
- Foreign key constraints enabled for data integrity
- UUID primary keys for notes to avoid collisions