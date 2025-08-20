import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, notesTable } from '../db/schema';
import { type UpdateNoteInput } from '../schema';
import { updateNote } from '../handlers/update_note';
import { eq, and } from 'drizzle-orm';

// Create test user data
const createTestUser = async () => {
  const userResult = await db.insert(usersTable)
    .values({
      email: 'test@example.com',
      password_hash: 'hashed_password'
    })
    .returning()
    .execute();
  return userResult[0];
};

// Create test category data
const createTestCategory = async (userId: number) => {
  const categoryResult = await db.insert(categoriesTable)
    .values({
      name: 'Test Category',
      user_id: userId
    })
    .returning()
    .execute();
  return categoryResult[0];
};

// Create test note data
const createTestNote = async (userId: number, categoryId?: number) => {
  const noteResult = await db.insert(notesTable)
    .values({
      title: 'Test Note',
      content: 'Test content',
      user_id: userId,
      category_id: categoryId || null
    })
    .returning()
    .execute();
  return noteResult[0];
};

describe('updateNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a note with all fields', async () => {
    const user = await createTestUser();
    const category = await createTestCategory(user.id);
    const note = await createTestNote(user.id);

    const input: UpdateNoteInput = {
      id: note.id,
      title: 'Updated Title',
      content: 'Updated content',
      user_id: user.id,
      category_id: category.id
    };

    const result = await updateNote(input);

    expect(result.id).toEqual(note.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.content).toEqual('Updated content');
    expect(result.user_id).toEqual(user.id);
    expect(result.category_id).toEqual(category.id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(note.updated_at.getTime());
  });

  it('should update only provided fields', async () => {
    const user = await createTestUser();
    const note = await createTestNote(user.id);

    const input: UpdateNoteInput = {
      id: note.id,
      title: 'Updated Title Only',
      user_id: user.id
    };

    const result = await updateNote(input);

    expect(result.title).toEqual('Updated Title Only');
    expect(result.content).toEqual(note.content); // Should remain unchanged
    expect(result.category_id).toEqual(note.category_id); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(note.updated_at.getTime());
  });

  it('should update note content only', async () => {
    const user = await createTestUser();
    const note = await createTestNote(user.id);

    const input: UpdateNoteInput = {
      id: note.id,
      content: 'Updated content only',
      user_id: user.id
    };

    const result = await updateNote(input);

    expect(result.title).toEqual(note.title); // Should remain unchanged
    expect(result.content).toEqual('Updated content only');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(note.updated_at.getTime());
  });

  it('should update category_id to null', async () => {
    const user = await createTestUser();
    const category = await createTestCategory(user.id);
    const note = await createTestNote(user.id, category.id);

    const input: UpdateNoteInput = {
      id: note.id,
      user_id: user.id,
      category_id: null
    };

    const result = await updateNote(input);

    expect(result.category_id).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(note.updated_at.getTime());
  });

  it('should persist changes to database', async () => {
    const user = await createTestUser();
    const category = await createTestCategory(user.id);
    const note = await createTestNote(user.id);

    const input: UpdateNoteInput = {
      id: note.id,
      title: 'Database Test',
      content: 'Database content',
      user_id: user.id,
      category_id: category.id
    };

    await updateNote(input);

    // Verify changes are persisted in database
    const updatedNote = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, note.id))
      .execute();

    expect(updatedNote).toHaveLength(1);
    expect(updatedNote[0].title).toEqual('Database Test');
    expect(updatedNote[0].content).toEqual('Database content');
    expect(updatedNote[0].category_id).toEqual(category.id);
    expect(updatedNote[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when note does not exist', async () => {
    const user = await createTestUser();

    const input: UpdateNoteInput = {
      id: 999, // Non-existent note ID
      title: 'Updated Title',
      user_id: user.id
    };

    await expect(updateNote(input)).rejects.toThrow(/Note not found or you do not have permission/i);
  });

  it('should throw error when user does not own the note', async () => {
    const user1 = await createTestUser();
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const user2 = user2Result[0];

    const note = await createTestNote(user1.id);

    const input: UpdateNoteInput = {
      id: note.id,
      title: 'Unauthorized Update',
      user_id: user2.id // Different user trying to update
    };

    await expect(updateNote(input)).rejects.toThrow(/Note not found or you do not have permission/i);
  });

  it('should throw error when category does not exist', async () => {
    const user = await createTestUser();
    const note = await createTestNote(user.id);

    const input: UpdateNoteInput = {
      id: note.id,
      title: 'Updated Title',
      user_id: user.id,
      category_id: 999 // Non-existent category ID
    };

    await expect(updateNote(input)).rejects.toThrow(/Category not found or you do not have permission/i);
  });

  it('should throw error when user does not own the category', async () => {
    const user1 = await createTestUser();
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const user2 = user2Result[0];

    const note = await createTestNote(user1.id);
    const categoryOwnedByUser2 = await createTestCategory(user2.id);

    const input: UpdateNoteInput = {
      id: note.id,
      title: 'Updated Title',
      user_id: user1.id,
      category_id: categoryOwnedByUser2.id // Category owned by different user
    };

    await expect(updateNote(input)).rejects.toThrow(/Category not found or you do not have permission/i);
  });

  it('should allow updating note with existing valid category', async () => {
    const user = await createTestUser();
    const category1 = await createTestCategory(user.id);
    const category2Result = await db.insert(categoriesTable)
      .values({
        name: 'Second Category',
        user_id: user.id
      })
      .returning()
      .execute();
    const category2 = category2Result[0];

    const note = await createTestNote(user.id, category1.id);

    const input: UpdateNoteInput = {
      id: note.id,
      user_id: user.id,
      category_id: category2.id
    };

    const result = await updateNote(input);

    expect(result.category_id).toEqual(category2.id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(note.updated_at.getTime());
  });
});
