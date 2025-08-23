import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { notesTable, usersTable, foldersTable } from '../db/schema';
import { type CreateNoteInput } from '../schema';
import { createNote } from '../handlers/create_note';
import { eq } from 'drizzle-orm';

// Insert a placeholder user with id 0 for testing
const insertPlaceholderUser = async () => {
  await db
    .insert(usersTable)
    .values({
      id: 0,
      email: 'placeholder@example.com',
      password_hash: 'hashed',
    })
    .execute();
};

// Insert a folder for the placeholder user
const insertFolder = async (folderId: number) => {
  await db
    .insert(foldersTable)
    .values({
      id: folderId,
      user_id: 0,
      name: `Folder ${folderId}`,
    })
    .execute();
};

const testInput: CreateNoteInput = {
  content: 'Test note content',
  // folder_id omitted for first test
};

describe('createNote', () => {
  beforeEach(async () => {
    await createDB();
    await insertPlaceholderUser();
  });
  afterEach(resetDB);

  it('should create a note and return all fields', async () => {
    const result = await createNote(testInput);

    expect(result.id).toBeGreaterThanOrEqual(1);
    expect(result.user_id).toBe(0);
    expect(result.folder_id).toBeNull();
    expect(result.content).toBe(testInput.content);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should persist the note in the database', async () => {
    const result = await createNote(testInput);

    const notes = await db
      .select()
      .from(notesTable)
      .where(eq(notesTable.id, result.id))
      .execute();

    expect(notes).toHaveLength(1);
    const dbNote = notes[0];
    expect(dbNote.content).toBe(testInput.content);
    expect(dbNote.user_id).toBe(0);
    expect(dbNote.folder_id).toBeNull();
    expect(dbNote.created_at).toBeInstanceOf(Date);
    expect(dbNote.updated_at).toBeInstanceOf(Date);
  });

  it('should associate note with a folder when folder_id is provided', async () => {
    await insertFolder(1);

    const inputWithFolder: CreateNoteInput = {
      content: 'Note with folder',
      folder_id: 1,
    };

    const result = await createNote(inputWithFolder);

    expect(result.folder_id).toBe(1);

    const notes = await db
      .select()
      .from(notesTable)
      .where(eq(notesTable.id, result.id))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].folder_id).toBe(1);
  });
});
