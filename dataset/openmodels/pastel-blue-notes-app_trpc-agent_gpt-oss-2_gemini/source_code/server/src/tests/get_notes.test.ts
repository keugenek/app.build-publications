import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, notesTable } from '../db/schema';
import { type Note } from '../schema';
import { getNotes } from '../handlers/get_notes';

/** Helper to create a user */
const createTestUser = async () => {
  const [user] = await db
    .insert(usersTable)
    .values({
      email: 'test@example.com',
      password_hash: 'hashed_password',
    })
    .returning()
    .execute();
  return user;
};

/** Helper to create a note */
const createTestNote = async (userId: number) => {
  const [note] = await db
    .insert(notesTable)
    .values({
      title: 'Test Note',
      content: 'This is a test note.',
      folder_id: null,
      user_id: userId,
    })
    .returning()
    .execute();
  return note;
};

describe('getNotes handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve all notes from the database', async () => {
    const user = await createTestUser();
    const insertedNote = await createTestNote(user.id);

    const notes = await getNotes();

    // We expect at least the note we just inserted
    expect(notes.length).toBeGreaterThanOrEqual(1);
    const fetched = notes.find((n) => n.id === insertedNote.id);
    expect(fetched).toBeDefined();
    if (!fetched) return; // type guard
    expect(fetched.title).toBe('Test Note');
    expect(fetched.content).toBe('This is a test note.');
    expect(fetched.user_id).toBe(user.id);
    expect(fetched.folder_id).toBeNull();
    expect(fetched.created_at).toBeInstanceOf(Date);
    expect(fetched.updated_at).toBeInstanceOf(Date);
  });

  it('should return an empty array when there are no notes', async () => {
    const notes = await getNotes();
    expect(Array.isArray(notes)).toBe(true);
    expect(notes).toHaveLength(0);
  });
});
