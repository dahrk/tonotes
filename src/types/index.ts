export interface Note {
  id: string;
  content: string;
  color: 'yellow' | 'pink' | 'blue';
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface NoteTag {
  note_id: string;
  tag_id: number;
}

export interface NoteWithTags extends Note {
  tags: Tag[];
}

export interface CreateNoteRequest {
  content?: string;
  position_x?: number;
  position_y?: number;
  color?: Note['color'];
}

export interface UpdateNoteRequest {
  id: string;
  content?: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

export interface AppSettings {
  launchOnStartup: boolean;
  theme: 'system' | 'light' | 'dark';
}

export type NoteColor = Note['color'];
export type Theme = AppSettings['theme'];