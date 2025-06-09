import BetterSqlite3 from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';
import type { Note, Tag, NoteTag, UpdateNoteRequest } from '../types';

export class Database {
  private db: BetterSqlite3.Database;

  constructor() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'notes.db');
    this.db = new BetterSqlite3(dbPath);
    this.db.pragma('foreign_keys = ON');
  }

  public async initialize(): Promise<void> {
    this.createTables();
  }

  private createTables(): void {
    // Create notes table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL DEFAULT '',
        color TEXT NOT NULL CHECK(color IN ('yellow', 'pink', 'blue')),
        position_x INTEGER NOT NULL,
        position_y INTEGER NOT NULL,
        width INTEGER NOT NULL DEFAULT 300,
        height INTEGER NOT NULL DEFAULT 300,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Create tags table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )
    `);

    // Create note_tags table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);
  }

  public createNote(note: Note): void {
    const stmt = this.db.prepare(`
      INSERT INTO notes (id, content, color, position_x, position_y, width, height, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      note.id,
      note.content,
      note.color,
      note.position_x,
      note.position_y,
      note.width,
      note.height,
      note.created_at,
      note.updated_at
    );
  }

  public updateNote(request: UpdateNoteRequest): void {
    const { id, ...updates } = request;
    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    if (setClause) {
      const stmt = this.db.prepare(`
        UPDATE notes 
        SET ${setClause}, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(...values, new Date().toISOString(), id);
    }
  }

  public deleteNote(noteId: string): void {
    const stmt = this.db.prepare('DELETE FROM notes WHERE id = ?');
    stmt.run(noteId);
  }

  public getNote(noteId: string): Note | undefined {
    const stmt = this.db.prepare('SELECT * FROM notes WHERE id = ?');
    return stmt.get(noteId) as Note | undefined;
  }

  public getAllNotes(): Note[] {
    const stmt = this.db.prepare(
      'SELECT * FROM notes ORDER BY updated_at DESC'
    );
    return stmt.all() as Note[];
  }

  public searchNotes(query: string): Note[] {
    const stmt = this.db.prepare(`
      SELECT * FROM notes 
      WHERE content LIKE ? 
      ORDER BY updated_at DESC
      LIMIT 10
    `);
    return stmt.all(`%${query}%`) as Note[];
  }

  public createTag(name: string): number {
    const normalizedName = name.toLowerCase().replace(/\s+/g, '-');
    const stmt = this.db.prepare(
      'INSERT OR IGNORE INTO tags (name) VALUES (?)'
    );
    const result = stmt.run(normalizedName);

    if (result.changes === 0) {
      // Tag already exists, get its ID
      const getStmt = this.db.prepare('SELECT id FROM tags WHERE name = ?');
      const tag = getStmt.get(normalizedName) as { id: number };
      return tag.id;
    }

    return result.lastInsertRowid as number;
  }

  public addTagToNote(noteId: string, tagId: number): void {
    const stmt = this.db.prepare(
      'INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)'
    );
    stmt.run(noteId, tagId);
  }

  public removeTagFromNote(noteId: string, tagId: number): void {
    const stmt = this.db.prepare(
      'DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?'
    );
    stmt.run(noteId, tagId);
  }

  public getNoteTags(noteId: string): Tag[] {
    const stmt = this.db.prepare(`
      SELECT t.id, t.name 
      FROM tags t
      JOIN note_tags nt ON t.id = nt.tag_id
      WHERE nt.note_id = ?
    `);
    return stmt.all(noteId) as Tag[];
  }

  public getAllTags(): Tag[] {
    const stmt = this.db.prepare('SELECT id, name FROM tags ORDER BY name');
    return stmt.all() as Tag[];
  }

  public close(): void {
    this.db.close();
  }
}
