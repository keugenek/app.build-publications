import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, notesTable } from '../db/schema';
import { type DeleteCategoryInput } from '../schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq } from 'drizzle-orm';

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let otherUserId: number;
  let categoryId: number;
  let otherCategoryId: number;

  const setupTestData = async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'test@example.com',
          password_hash: 'hashed_password_1'
        },
        {
          email: 'other@example.com',
          password_hash: 'hashed_password_2'
        }
      ])
      .returning()
      .execute();

    userId = users[0].id;
    otherUserId = users[1].id;

    // Create test categories
    const categories = await db.insert(categoriesTable)
      .values([
        {
          name: 'Work',
          user_id: userId
        },
        {
          name: 'Personal',
          user_id: otherUserId
        }
      ])
      .returning()
      .execute();

    categoryId = categories[0].id;
    otherCategoryId = categories[1].id;
  };

  it('should delete a category successfully', async () => {
    await setupTestData();

    const input: DeleteCategoryInput = {
      id: categoryId,
      user_id: userId
    };

    const result = await deleteCategory(input);

    expect(result.success).toBe(true);

    // Verify category is deleted
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(0);
  });

  it('should handle notes when deleting category', async () => {
    await setupTestData();

    // Create notes with the category
    await db.insert(notesTable)
      .values([
        {
          title: 'Work Note 1',
          content: 'Important work task',
          user_id: userId,
          category_id: categoryId
        },
        {
          title: 'Work Note 2',
          content: 'Another work task',
          user_id: userId,
          category_id: categoryId
        }
      ])
      .execute();

    const input: DeleteCategoryInput = {
      id: categoryId,
      user_id: userId
    };

    const result = await deleteCategory(input);

    expect(result.success).toBe(true);

    // Verify notes have category_id set to null
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.user_id, userId))
      .execute();

    expect(notes).toHaveLength(2);
    notes.forEach(note => {
      expect(note.category_id).toBeNull();
    });

    // Verify category is deleted
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(0);
  });

  it('should throw error when category does not exist', async () => {
    await setupTestData();

    const input: DeleteCategoryInput = {
      id: 99999, // Non-existent category ID
      user_id: userId
    };

    expect(deleteCategory(input)).rejects.toThrow(/category not found/i);
  });

  it('should throw error when category belongs to different user', async () => {
    await setupTestData();

    const input: DeleteCategoryInput = {
      id: otherCategoryId, // Category belongs to otherUserId
      user_id: userId // But trying to delete with userId
    };

    expect(deleteCategory(input)).rejects.toThrow(/category not found.*does not belong to user/i);
  });

  it('should not affect other categories when deleting', async () => {
    await setupTestData();

    // Create additional category for same user
    const additionalCategory = await db.insert(categoriesTable)
      .values({
        name: 'Additional Category',
        user_id: userId
      })
      .returning()
      .execute();

    const input: DeleteCategoryInput = {
      id: categoryId,
      user_id: userId
    };

    const result = await deleteCategory(input);

    expect(result.success).toBe(true);

    // Verify only the target category is deleted
    const remainingCategories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.user_id, userId))
      .execute();

    expect(remainingCategories).toHaveLength(1);
    expect(remainingCategories[0].id).toBe(additionalCategory[0].id);
    expect(remainingCategories[0].name).toBe('Additional Category');

    // Verify other user's category is unaffected
    const otherUserCategories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.user_id, otherUserId))
      .execute();

    expect(otherUserCategories).toHaveLength(1);
    expect(otherUserCategories[0].id).toBe(otherCategoryId);
  });

  it('should only update notes belonging to the deleted category', async () => {
    await setupTestData();

    // Create another category for the same user
    const anotherCategory = await db.insert(categoriesTable)
      .values({
        name: 'Another Category',
        user_id: userId
      })
      .returning()
      .execute();

    const anotherCategoryId = anotherCategory[0].id;

    // Create notes with different categories
    await db.insert(notesTable)
      .values([
        {
          title: 'Note in target category',
          content: 'This note should have category_id set to null',
          user_id: userId,
          category_id: categoryId
        },
        {
          title: 'Note in another category',
          content: 'This note should keep its category_id',
          user_id: userId,
          category_id: anotherCategoryId
        },
        {
          title: 'Note without category',
          content: 'This note already has null category_id',
          user_id: userId,
          category_id: null
        }
      ])
      .execute();

    const input: DeleteCategoryInput = {
      id: categoryId,
      user_id: userId
    };

    const result = await deleteCategory(input);

    expect(result.success).toBe(true);

    // Verify notes are handled correctly
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.user_id, userId))
      .execute();

    expect(notes).toHaveLength(3);

    const noteInTargetCategory = notes.find(note => note.title === 'Note in target category');
    const noteInAnotherCategory = notes.find(note => note.title === 'Note in another category');
    const noteWithoutCategory = notes.find(note => note.title === 'Note without category');

    expect(noteInTargetCategory?.category_id).toBeNull();
    expect(noteInAnotherCategory?.category_id).toBe(anotherCategoryId);
    expect(noteWithoutCategory?.category_id).toBeNull();
  });
});
