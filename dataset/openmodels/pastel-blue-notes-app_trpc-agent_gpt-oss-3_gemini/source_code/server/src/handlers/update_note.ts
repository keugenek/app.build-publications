import { type UpdateNoteInput, type Note } from '../schema';

/**
 * Dummy handler for updating a note.
 * Real implementation would locate the note by ID, apply changes, and persist.
 */
export const updateNote = async (input: UpdateNoteInput): Promise<Note> => {
  // Return a placeholder updated note
  const now = new Date();
  return {
    id: input.id,
    user_id: 0, // placeholder
    folder_id: input.folder_id ?? null,
    content: input.content ?? 'placeholder content',
    created_at: now,
    updated_at: now,
  } as Note;
};
