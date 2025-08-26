// Stubbed type definitions matching server schema for client compilation
export interface Note {
  id: number;
  title: string;
  content: string;
  folder_id: number | null;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface Folder {
  id: number;
  name: string;
  user_id: number;
  created_at: Date;
}

export interface CreateNoteInput {
  title: string;
  content: string;
  folder_id?: number | null;
  user_id: number;
}

export interface CreateFolderInput {
  name: string;
  user_id: number;
}
