import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable, notesTable } from '../db/schema';
import { type Note } from '../schema';
import { getNotes } from '../handlers/get_notes';
import { eq } from 'drizzle-orm';

/** Helper to create a user directly in the DB */
const createTestUser = async () => {
  const result = await db
    .insert(usersTable)
    .values({
      email: 'test@example.com',
      password_hash: 'hashed_password',
    })
    .returning()
    .execute();
  return result[0];
};

/** Helper to create a note for a given user */
const createTestNote = async (userId: number) => {
  const result = await db
    .insert(notesTable)
    .values({
      user_id: userId,
      content: 'Sample note content',
    })
    .returning()
    .execute();
  return result[0];
};

describe('getNotes handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no notes exist', async () => {
    const notes = await getNotes();
    expect(notes).toBeInstanceOf(Array);
    expect(notes).toHaveLength(0);
  });

  it('should fetch notes from the database', async () => {
    const user = await createTestUser();
    const insertedNote = await createTestNote(user.id);

    const notes = await getNotes();

    // Basic array checks
    expect(notes).toBeInstanceOf(Array);
    expect(notes).toHaveLength(1);

    const note = notes[0] as Note;
    // Verify fields match inserted record
    expect(note.id).toBe(insertedNote.id);
    expect(note.user_id).toBe(user.id);
    expect(note.content).toBe('Sample note content');
    // Date fields should be Date instances
    expect(note.created_at).toBeInstanceOf(Date);
    expect(note.updated_at).toBeInstanceOf(Date);
  });

  it('should return all notes when multiple records exist', async () => {
    const user = await createTestUser();
    await createTestNote(user.id);
    await createTestNote(user.id);

    const notes = await getNotes();
    expect(notes).toHaveLength(2);
    // Ensure each note belongs to the same user
    for (const n of notes) {
      expect((n as Note).user_id).toBe(user.id);
    }
  });
});
