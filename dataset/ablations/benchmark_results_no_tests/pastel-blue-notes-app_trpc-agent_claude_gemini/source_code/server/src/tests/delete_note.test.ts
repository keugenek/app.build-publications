import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, notesTable } from '../db/schema';
import { type DeleteNoteInput } from '../schema';
import { deleteNote } from '../handlers/delete_note';
import { eq } from 'drizzle-orm';

describe('deleteNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create prerequisite data
  async function createTestData() {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create another user for ownership tests
    const otherUserResult = await db.insert(usersTable)
      .values({
        username: 'otheruser',
        email: 'other@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const otherUser = otherUserResult[0];

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        user_id: user.id
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create test note
    const noteResult = await db.insert(notesTable)
      .values({
        title: 'Test Note',
        content: 'Test content',
        user_id: user.id,
        category_id: category.id
      })
      .returning()
      .execute();
    const note = noteResult[0];

    // Create note without category
    const noteWithoutCategoryResult = await db.insert(notesTable)
      .values({
        title: 'Note without category',
        content: 'Content without category',
        user_id: user.id,
        category_id: null
      })
      .returning()
      .execute();
    const noteWithoutCategory = noteWithoutCategoryResult[0];

    return {
      user,
      otherUser,
      category,
      note,
      noteWithoutCategory
    };
  }

  it('should delete a note successfully', async () => {
    const { user, note } = await createTestData();

    const input: DeleteNoteInput = {
      id: note.id,
      user_id: user.id
    };

    const result = await deleteNote(input);
    expect(result).toBe(true);

    // Verify note is deleted from database
    const deletedNote = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, note.id))
      .execute();

    expect(deletedNote).toHaveLength(0);
  });

  it('should delete a note without category successfully', async () => {
    const { user, noteWithoutCategory } = await createTestData();

    const input: DeleteNoteInput = {
      id: noteWithoutCategory.id,
      user_id: user.id
    };

    const result = await deleteNote(input);
    expect(result).toBe(true);

    // Verify note is deleted from database
    const deletedNote = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, noteWithoutCategory.id))
      .execute();

    expect(deletedNote).toHaveLength(0);
  });

  it('should return false when note does not exist', async () => {
    const { user } = await createTestData();

    const input: DeleteNoteInput = {
      id: 99999, // Non-existent note ID
      user_id: user.id
    };

    const result = await deleteNote(input);
    expect(result).toBe(false);
  });

  it('should return false when user tries to delete another users note', async () => {
    const { user, otherUser, note } = await createTestData();

    const input: DeleteNoteInput = {
      id: note.id,
      user_id: otherUser.id // Different user trying to delete
    };

    const result = await deleteNote(input);
    expect(result).toBe(false);

    // Verify note still exists in database
    const existingNote = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, note.id))
      .execute();

    expect(existingNote).toHaveLength(1);
    expect(existingNote[0].user_id).toBe(user.id);
  });

  it('should return false when user does not exist', async () => {
    const { note } = await createTestData();

    const input: DeleteNoteInput = {
      id: note.id,
      user_id: 99999 // Non-existent user ID
    };

    const result = await deleteNote(input);
    expect(result).toBe(false);

    // Verify note still exists in database
    const existingNote = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, note.id))
      .execute();

    expect(existingNote).toHaveLength(1);
  });

  it('should only delete the specific note and not affect other notes', async () => {
    const { user } = await createTestData();

    // Create additional notes for the same user
    const additionalNotes = await db.insert(notesTable)
      .values([
        {
          title: 'Note 2',
          content: 'Content 2',
          user_id: user.id,
          category_id: null
        },
        {
          title: 'Note 3',
          content: 'Content 3',
          user_id: user.id,
          category_id: null
        }
      ])
      .returning()
      .execute();

    // Delete only the first additional note
    const input: DeleteNoteInput = {
      id: additionalNotes[0].id,
      user_id: user.id
    };

    const result = await deleteNote(input);
    expect(result).toBe(true);

    // Verify only the specific note was deleted
    const remainingNotes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.user_id, user.id))
      .execute();

    // Should have original test note + noteWithoutCategory + Note 3 = 3 notes
    expect(remainingNotes).toHaveLength(3);

    // Verify the deleted note is not in the results
    const deletedNoteExists = remainingNotes.some(note => note.id === additionalNotes[0].id);
    expect(deletedNoteExists).toBe(false);

    // Verify the other note still exists
    const otherNoteExists = remainingNotes.some(note => note.id === additionalNotes[1].id);
    expect(otherNoteExists).toBe(true);
  });
});
