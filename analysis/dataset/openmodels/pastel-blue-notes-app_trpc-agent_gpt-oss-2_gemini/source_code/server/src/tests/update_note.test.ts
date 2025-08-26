import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, notesTable } from '../db/schema';
import { type UpdateNoteInput, type Note } from '../schema';
import { updateNote } from '../handlers/update_note';
import { eq } from 'drizzle-orm';

/** Helper to create a user in the DB */
const createTestUser = async () => {
  const [user] = await db
    .insert(usersTable)
    .values({
      email: 'user@example.com',
      password_hash: 'hashed',
    })
    .returning()
    .execute();
  return user;
};

/** Helper to create a folder for a given user */
const createTestFolder = async (userId: number) => {
  const [folder] = await db
    .insert(foldersTable)
    .values({
      name: 'Test Folder',
      user_id: userId,
    })
    .returning()
    .execute();
  return folder;
};

/** Helper to create a note in the DB */
const createTestNote = async (userId: number, folderId: number | null) => {
  const [note] = await db
    .insert(notesTable)
    .values({
      title: 'Original Title',
      content: 'Original Content',
      folder_id: folderId,
      user_id: userId,
    })
    .returning()
    .execute();
  return note;
};

describe('updateNote handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates provided fields and leaves others unchanged', async () => {
    const user = await createTestUser();
    const folder = await createTestFolder(user.id);
    const note = await createTestNote(user.id, folder.id);

    const input: UpdateNoteInput = {
      id: note.id,
      title: 'Updated Title', // change title
      // content omitted -> should stay original
      folder_id: null, // move note out of folder
    };

    const updated: Note = await updateNote(input);

    // Title should be updated
    expect(updated.title).toBe('Updated Title');
    // Content should remain unchanged
    expect(updated.content).toBe('Original Content');
    // Folder should be null now
    expect(updated.folder_id).toBeNull();
    // User and timestamps should be present
    expect(updated.user_id).toBe(user.id);
    expect(updated.updated_at).toBeInstanceOf(Date);
    // created_at should remain the same as original
    expect(updated.created_at.getTime()).toBe(note.created_at.getTime());
  });

  it('throws an error when note does not exist', async () => {
    const input: UpdateNoteInput = {
      id: 9999, // unlikely to exist
      title: 'Does not matter',
    };

    await expect(updateNote(input)).rejects.toThrow(/not found/i);
  });
});
