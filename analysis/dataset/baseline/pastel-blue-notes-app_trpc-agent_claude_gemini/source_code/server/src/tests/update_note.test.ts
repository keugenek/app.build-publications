import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, notesTable } from '../db/schema';
import { type UpdateNoteInput } from '../schema';
import { updateNote } from '../handlers/update_note';
import { eq, and } from 'drizzle-orm';

// Test data setup
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password'
};

const testCategory = {
  name: 'Test Category',
  color: '#FF0000'
};

const testNote = {
  title: 'Original Title',
  content: 'Original content'
};

describe('updateNote', () => {
  let userId: number;
  let categoryId: number;
  let noteId: number;
  let otherUserId: number;
  let otherCategoryId: number;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create another user for access control tests
    const otherUserResult = await db.insert(usersTable)
      .values({
        email: 'other@example.com',
        password_hash: 'other_password'
      })
      .returning()
      .execute();
    otherUserId = otherUserResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        ...testCategory,
        user_id: userId
      })
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    // Create category for other user
    const otherCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Other Category',
        color: '#00FF00',
        user_id: otherUserId
      })
      .returning()
      .execute();
    otherCategoryId = otherCategoryResult[0].id;

    // Create test note
    const noteResult = await db.insert(notesTable)
      .values({
        ...testNote,
        category_id: categoryId,
        user_id: userId
      })
      .returning()
      .execute();
    noteId = noteResult[0].id;
  });

  afterEach(resetDB);

  it('should update note title only', async () => {
    const updateInput: UpdateNoteInput = {
      id: noteId,
      title: 'Updated Title',
      user_id: userId
    };

    const result = await updateNote(updateInput);

    expect(result.id).toEqual(noteId);
    expect(result.title).toEqual('Updated Title');
    expect(result.content).toEqual('Original content'); // Should remain unchanged
    expect(result.category_id).toEqual(categoryId); // Should remain unchanged
    expect(result.user_id).toEqual(userId);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify in database
    const dbNote = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, noteId))
      .execute();

    expect(dbNote[0].title).toEqual('Updated Title');
    expect(dbNote[0].content).toEqual('Original content');
  });

  it('should update note content only', async () => {
    const updateInput: UpdateNoteInput = {
      id: noteId,
      content: 'Updated content with more details',
      user_id: userId
    };

    const result = await updateNote(updateInput);

    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.content).toEqual('Updated content with more details');
    expect(result.category_id).toEqual(categoryId); // Should remain unchanged
  });

  it('should update category_id', async () => {
    // Create another category for the same user
    const newCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'New Category',
        color: '#0000FF',
        user_id: userId
      })
      .returning()
      .execute();
    const newCategoryId = newCategoryResult[0].id;

    const updateInput: UpdateNoteInput = {
      id: noteId,
      category_id: newCategoryId,
      user_id: userId
    };

    const result = await updateNote(updateInput);

    expect(result.category_id).toEqual(newCategoryId);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.content).toEqual('Original content'); // Should remain unchanged
  });

  it('should set category_id to null', async () => {
    const updateInput: UpdateNoteInput = {
      id: noteId,
      category_id: null,
      user_id: userId
    };

    const result = await updateNote(updateInput);

    expect(result.category_id).toBeNull();
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.content).toEqual('Original content'); // Should remain unchanged
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateNoteInput = {
      id: noteId,
      title: 'New Title',
      content: 'New content',
      category_id: null,
      user_id: userId
    };

    const result = await updateNote(updateInput);

    expect(result.title).toEqual('New Title');
    expect(result.content).toEqual('New content');
    expect(result.category_id).toBeNull();
    expect(result.user_id).toEqual(userId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    const originalNote = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, noteId))
      .execute();
    const originalUpdatedAt = originalNote[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateNoteInput = {
      id: noteId,
      title: 'Updated Title',
      user_id: userId
    };

    const result = await updateNote(updateInput);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error when note does not exist', async () => {
    const updateInput: UpdateNoteInput = {
      id: 99999, // Non-existent ID
      title: 'Updated Title',
      user_id: userId
    };

    expect(updateNote(updateInput)).rejects.toThrow(/note not found/i);
  });

  it('should throw error when user does not own the note', async () => {
    const updateInput: UpdateNoteInput = {
      id: noteId,
      title: 'Updated Title',
      user_id: otherUserId // Different user
    };

    expect(updateNote(updateInput)).rejects.toThrow(/note not found or access denied/i);
  });

  it('should throw error when category does not exist', async () => {
    const updateInput: UpdateNoteInput = {
      id: noteId,
      category_id: 99999, // Non-existent category ID
      user_id: userId
    };

    expect(updateNote(updateInput)).rejects.toThrow(/category not found/i);
  });

  it('should throw error when user does not own the category', async () => {
    const updateInput: UpdateNoteInput = {
      id: noteId,
      category_id: otherCategoryId, // Category owned by different user
      user_id: userId
    };

    expect(updateNote(updateInput)).rejects.toThrow(/category not found or access denied/i);
  });

  it('should handle empty string content', async () => {
    const updateInput: UpdateNoteInput = {
      id: noteId,
      content: '',
      user_id: userId
    };

    const result = await updateNote(updateInput);

    expect(result.content).toEqual('');
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
  });

  it('should preserve original fields when no updates provided', async () => {
    const updateInput: UpdateNoteInput = {
      id: noteId,
      user_id: userId
      // No title, content, or category_id provided
    };

    const result = await updateNote(updateInput);

    expect(result.title).toEqual('Original Title');
    expect(result.content).toEqual('Original content');
    expect(result.category_id).toEqual(categoryId);
    expect(result.updated_at).toBeInstanceOf(Date); // Should still be updated
  });
});
