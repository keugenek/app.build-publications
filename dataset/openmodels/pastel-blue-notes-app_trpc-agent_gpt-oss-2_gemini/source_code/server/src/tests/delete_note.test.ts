import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, notesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteByIdInput, type Note } from '../schema';
import { deleteNote } from '../handlers/delete_note';

let createdUserId: number;
let createdFolderId: number;
let createdNoteId: number;
let createdNote: Note;

beforeEach(async () => {
  await createDB();
  // Insert a user
  const users = await db
    .insert(usersTable)
    .values({ email: 'test@example.com', password_hash: 'hash' })
    .returning()
    .execute();
  createdUserId = users[0].id;

  // Insert a folder for the user
  const folders = await db
    .insert(foldersTable)
    .values({ name: 'Test Folder', user_id: createdUserId })
    .returning()
    .execute();
  createdFolderId = folders[0].id;

  // Insert a note
  const notes = await db
    .insert(notesTable)
    .values({
      title: 'Test Note',
      content: 'Content',
      folder_id: createdFolderId,
      user_id: createdUserId,
    })
    .returning()
    .execute();
  createdNoteId = notes[0].id;
  createdNote = notes[0] as Note;
});

afterEach(async () => {
  await resetDB();
});

describe('deleteNote handler', () => {
  it('should delete and return the note data', async () => {
    const input: DeleteByIdInput = { id: createdNoteId };
    const result = await deleteNote(input);

    // Returned data should match what was inserted
    expect(result.id).toBe(createdNote.id);
    expect(result.title).toBe(createdNote.title);
    expect(result.content).toBe(createdNote.content);
    expect(result.folder_id).toBe(createdNote.folder_id);
    expect(result.user_id).toBe(createdNote.user_id);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify note no longer exists in DB
    const remaining = await db
      .select()
      .from(notesTable)
      .where(eq(notesTable.id, createdNoteId))
      .execute();
    expect(remaining).toHaveLength(0);
  });

  it('should throw an error if note does not exist', async () => {
    const input: DeleteByIdInput = { id: 9999 };
    await expect(deleteNote(input)).rejects.toThrow(/not found/i);
  });
});
