import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, notesTable } from '../db/schema';
import { type CreateNoteInput, type Note } from '../schema';
import { createNote } from '../handlers/create_note';
import { eq } from 'drizzle-orm';

// Helper to create a user directly in the DB
const createTestUser = async () => {
  const result = await db
    .insert(usersTable)
    .values({
      email: 'user@example.com',
      password_hash: 'hashed',
    })
    .returning()
    .execute();
  return result[0];
};

// Helper to create a folder for a user
const createTestFolder = async (userId: number) => {
  const result = await db
    .insert(foldersTable)
    .values({
      name: 'Test Folder',
      user_id: userId,
    })
    .returning()
    .execute();
  return result[0];
};

describe('createNote handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a note without a folder', async () => {
    const user = await createTestUser();

    const input: CreateNoteInput = {
      title: 'Test Note',
      content: 'This is a test note.',
      user_id: user.id,
    };

    const note: Note = await createNote(input);

    // Verify returned fields
    expect(note.id).toBeDefined();
    expect(note.title).toBe(input.title);
    expect(note.content).toBe(input.content);
    expect(note.folder_id).toBeNull();
    expect(note.user_id).toBe(user.id);
    expect(note.created_at).toBeInstanceOf(Date);
    expect(note.updated_at).toBeInstanceOf(Date);

    // Verify persisted in DB
    const rows = await db.select().from(notesTable).where(eq(notesTable.id, note.id)).execute();
    expect(rows).toHaveLength(1);
    const dbNote = rows[0];
    expect(dbNote.title).toBe(input.title);
    expect(dbNote.content).toBe(input.content);
    expect(dbNote.folder_id).toBeNull();
    expect(dbNote.user_id).toBe(user.id);
  });

  it('should create a note with an associated folder', async () => {
    const user = await createTestUser();
    const folder = await createTestFolder(user.id);

    const input: CreateNoteInput = {
      title: 'Folder Note',
      content: 'Note inside a folder',
      user_id: user.id,
      folder_id: folder.id,
    };

    const note = await createNote(input);

    expect(note.id).toBeDefined();
    expect(note.folder_id).toBe(folder.id);

    // Verify persisted relation
    const rows = await db.select().from(notesTable).where(eq(notesTable.id, note.id)).execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].folder_id).toBe(folder.id);
  });
});
