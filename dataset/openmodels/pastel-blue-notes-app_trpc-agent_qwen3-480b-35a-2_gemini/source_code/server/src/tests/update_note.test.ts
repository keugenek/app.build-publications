import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, notesTable } from '../db/schema';
import { type UpdateNoteInput } from '../schema';
import { updateNote } from '../handlers/update_note';
import { eq } from 'drizzle-orm';

describe('updateNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data
  const testUser = {
    email: 'test@example.com',
    password_hash: 'hashed_password_here',
  };

  const testCategory = {
    name: 'Test Category',
  };

  const testNote = {
    title: 'Test Note',
    content: 'This is a test note',
  };

  it('should update a note successfully', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create a note
    const noteResult = await db.insert(notesTable)
      .values({
        ...testNote,
        user_id: userId,
      })
      .returning()
      .execute();
    const noteId = noteResult[0].id;

    // Update the note
    const updateInput: UpdateNoteInput = {
      id: noteId,
      title: 'Updated Note Title',
      content: 'Updated content',
    };

    const result = await updateNote(updateInput, userId);

    // Validate the result
    expect(result.id).toBe(noteId);
    expect(result.title).toBe('Updated Note Title');
    expect(result.content).toBe('Updated content');
    expect(result.user_id).toBe(userId);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields of a note', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create a note
    const noteResult = await db.insert(notesTable)
      .values({
        ...testNote,
        user_id: userId,
      })
      .returning()
      .execute();
    const noteId = noteResult[0].id;
    const originalTitle = noteResult[0].title;
    const originalContent = noteResult[0].content;

    // Update only the title
    const updateInput: UpdateNoteInput = {
      id: noteId,
      title: 'Partially Updated Note',
    };

    const result = await updateNote(updateInput, userId);

    // Validate that only title was updated
    expect(result.id).toBe(noteId);
    expect(result.title).toBe('Partially Updated Note');
    expect(result.content).toBe(originalContent); // Should remain unchanged
    expect(result.user_id).toBe(userId);
  });

  it('should update note category', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create a category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        ...testCategory,
        user_id: userId,
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create a note without category
    const noteResult = await db.insert(notesTable)
      .values({
        ...testNote,
        user_id: userId,
      })
      .returning()
      .execute();
    const noteId = noteResult[0].id;

    // Update the note to add category
    const updateInput: UpdateNoteInput = {
      id: noteId,
      category_id: categoryId,
    };

    const result = await updateNote(updateInput, userId);

    // Validate that category was updated
    expect(result.id).toBe(noteId);
    expect(result.category_id).toBe(categoryId);
  });

  it('should throw an error when trying to update a non-existent note', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const updateInput: UpdateNoteInput = {
      id: 99999, // Non-existent note ID
      title: 'This should fail',
    };

    await expect(updateNote(updateInput, userId)).rejects.toThrow('Note not found');
  });

  it('should throw an error when trying to update another user\'s note', async () => {
    // Create first user
    const user1Result = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    // Create second user
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password_here',
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create a note for user1
    const noteResult = await db.insert(notesTable)
      .values({
        ...testNote,
        user_id: user1Id,
      })
      .returning()
      .execute();
    const noteId = noteResult[0].id;

    // Try to update user1's note as user2
    const updateInput: UpdateNoteInput = {
      id: noteId,
      title: 'Unauthorized update',
    };

    await expect(updateNote(updateInput, user2Id)).rejects.toThrow('Unauthorized: Note does not belong to user');
  });

  it('should save updated note to database', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create a note
    const noteResult = await db.insert(notesTable)
      .values({
        ...testNote,
        user_id: userId,
      })
      .returning()
      .execute();
    const noteId = noteResult[0].id;

    // Update the note
    const updateInput: UpdateNoteInput = {
      id: noteId,
      title: 'Database Updated Note',
      content: 'Content updated in database',
    };

    await updateNote(updateInput, userId);

    // Query the database to verify the update was saved
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, noteId))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe('Database Updated Note');
    expect(notes[0].content).toBe('Content updated in database');
    expect(notes[0].user_id).toBe(userId);
    // Verify updated_at was changed
    expect(notes[0].updated_at.getTime()).toBeGreaterThan(notes[0].created_at.getTime());
  });
});
