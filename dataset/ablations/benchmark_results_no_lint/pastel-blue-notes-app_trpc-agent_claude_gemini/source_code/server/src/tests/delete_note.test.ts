import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, notesTable } from '../db/schema';
import { type DeleteNoteInput } from '../schema';
import { deleteNote } from '../handlers/delete_note';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashedpassword123'
};

const testCategory = {
  name: 'Test Category',
  user_id: 1
};

const testNote = {
  title: 'Test Note',
  content: 'This is a test note',
  user_id: 1,
  category_id: 1
};

const testInput: DeleteNoteInput = {
  id: 1,
  user_id: 1
};

describe('deleteNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a note successfully', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(categoriesTable).values(testCategory).execute();
    await db.insert(notesTable).values(testNote).execute();

    // Delete the note
    const result = await deleteNote(testInput);

    expect(result.success).toBe(true);

    // Verify note is deleted from database
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, testInput.id))
      .execute();

    expect(notes).toHaveLength(0);
  });

  it('should delete a note without category', async () => {
    // Create prerequisite data without category
    await db.insert(usersTable).values(testUser).execute();
    
    const noteWithoutCategory = {
      title: 'Note without category',
      content: 'This note has no category',
      user_id: 1,
      category_id: null
    };
    
    await db.insert(notesTable).values(noteWithoutCategory).execute();

    const result = await deleteNote(testInput);

    expect(result.success).toBe(true);

    // Verify note is deleted from database
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, testInput.id))
      .execute();

    expect(notes).toHaveLength(0);
  });

  it('should throw error when note does not exist', async () => {
    // Create user but no note
    await db.insert(usersTable).values(testUser).execute();

    await expect(deleteNote(testInput)).rejects.toThrow(/note not found/i);
  });

  it('should throw error when note belongs to different user', async () => {
    // Create two users
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(usersTable).values({
      email: 'other@example.com',
      password_hash: 'otherhashedpassword'
    }).execute();

    // Create category and note for first user
    await db.insert(categoriesTable).values(testCategory).execute();
    await db.insert(notesTable).values(testNote).execute();

    // Try to delete note as second user
    const wrongUserInput: DeleteNoteInput = {
      id: 1,
      user_id: 2
    };

    await expect(deleteNote(wrongUserInput)).rejects.toThrow(/note not found/i);

    // Verify note still exists
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, 1))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].title).toEqual('Test Note');
  });

  it('should only delete the specified note', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(categoriesTable).values(testCategory).execute();
    
    // Create multiple notes
    const note1 = { ...testNote, title: 'Note 1' };
    const note2 = { ...testNote, title: 'Note 2' };
    
    await db.insert(notesTable).values([note1, note2]).execute();

    // Delete only the first note
    const result = await deleteNote({ id: 1, user_id: 1 });

    expect(result.success).toBe(true);

    // Verify only the first note is deleted
    const allNotes = await db.select()
      .from(notesTable)
      .execute();

    expect(allNotes).toHaveLength(1);
    expect(allNotes[0].title).toEqual('Note 2');
    expect(allNotes[0].id).toEqual(2);
  });

  it('should handle multiple deletion attempts on same note', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(categoriesTable).values(testCategory).execute();
    await db.insert(notesTable).values(testNote).execute();

    // First deletion should succeed
    const result1 = await deleteNote(testInput);
    expect(result1.success).toBe(true);

    // Second deletion should fail
    await expect(deleteNote(testInput)).rejects.toThrow(/note not found/i);
  });
});
