import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, notesTable } from '../db/schema';
import { type DeleteCategoryInput } from '../schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq, isNull } from 'drizzle-orm';

describe('deleteCategory', () => {
  let testUserId: number;
  let otherUserId: number;
  let testCategoryId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'testuser',
          email: 'test@example.com',
          password_hash: 'hashedpassword'
        },
        {
          username: 'otheruser',
          email: 'other@example.com',
          password_hash: 'hashedpassword'
        }
      ])
      .returning()
      .execute();
    
    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create a test category
    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        user_id: testUserId
      })
      .returning()
      .execute();
    
    testCategoryId = categories[0].id;
  });

  afterEach(resetDB);

  it('should successfully delete a category that belongs to the user', async () => {
    const input: DeleteCategoryInput = {
      id: testCategoryId,
      user_id: testUserId
    };

    const result = await deleteCategory(input);

    expect(result).toBe(true);

    // Verify the category was deleted
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategoryId))
      .execute();

    expect(categories).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent category', async () => {
    const input: DeleteCategoryInput = {
      id: 99999, // Non-existent category
      user_id: testUserId
    };

    const result = await deleteCategory(input);

    expect(result).toBe(false);
  });

  it('should return false when trying to delete category belonging to another user', async () => {
    const input: DeleteCategoryInput = {
      id: testCategoryId,
      user_id: otherUserId // Different user
    };

    const result = await deleteCategory(input);

    expect(result).toBe(false);

    // Verify the category still exists
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategoryId))
      .execute();

    expect(categories).toHaveLength(1);
  });

  it('should move notes to uncategorized when deleting category', async () => {
    // Create notes in the test category
    const notes = await db.insert(notesTable)
      .values([
        {
          title: 'Note 1',
          content: 'Content 1',
          user_id: testUserId,
          category_id: testCategoryId
        },
        {
          title: 'Note 2',
          content: 'Content 2',
          user_id: testUserId,
          category_id: testCategoryId
        }
      ])
      .returning()
      .execute();

    const input: DeleteCategoryInput = {
      id: testCategoryId,
      user_id: testUserId
    };

    const result = await deleteCategory(input);

    expect(result).toBe(true);

    // Verify notes are now uncategorized (category_id is null)
    const updatedNotes = await db.select()
      .from(notesTable)
      .where(isNull(notesTable.category_id))
      .execute();

    expect(updatedNotes).toHaveLength(2);
    expect(updatedNotes[0].category_id).toBeNull();
    expect(updatedNotes[1].category_id).toBeNull();
    expect(updatedNotes[0].updated_at).toBeInstanceOf(Date);
    expect(updatedNotes[1].updated_at).toBeInstanceOf(Date);

    // Verify notes still belong to the correct user
    expect(updatedNotes[0].user_id).toBe(testUserId);
    expect(updatedNotes[1].user_id).toBe(testUserId);
  });

  it('should delete category with no notes successfully', async () => {
    const input: DeleteCategoryInput = {
      id: testCategoryId,
      user_id: testUserId
    };

    const result = await deleteCategory(input);

    expect(result).toBe(true);

    // Verify the category was deleted
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategoryId))
      .execute();

    expect(categories).toHaveLength(0);
  });

  it('should not affect notes in other categories', async () => {
    // Create another category
    const otherCategories = await db.insert(categoriesTable)
      .values({
        name: 'Other Category',
        user_id: testUserId
      })
      .returning()
      .execute();
    
    const otherCategoryId = otherCategories[0].id;

    // Create notes in both categories
    await db.insert(notesTable)
      .values([
        {
          title: 'Note in test category',
          content: 'Content 1',
          user_id: testUserId,
          category_id: testCategoryId
        },
        {
          title: 'Note in other category',
          content: 'Content 2',
          user_id: testUserId,
          category_id: otherCategoryId
        }
      ])
      .execute();

    const input: DeleteCategoryInput = {
      id: testCategoryId,
      user_id: testUserId
    };

    const result = await deleteCategory(input);

    expect(result).toBe(true);

    // Verify note in other category is unchanged
    const notesInOtherCategory = await db.select()
      .from(notesTable)
      .where(eq(notesTable.category_id, otherCategoryId))
      .execute();

    expect(notesInOtherCategory).toHaveLength(1);
    expect(notesInOtherCategory[0].category_id).toBe(otherCategoryId);
    expect(notesInOtherCategory[0].title).toBe('Note in other category');

    // Verify note from deleted category is now uncategorized
    const uncategorizedNotes = await db.select()
      .from(notesTable)
      .where(isNull(notesTable.category_id))
      .execute();

    expect(uncategorizedNotes).toHaveLength(1);
    expect(uncategorizedNotes[0].title).toBe('Note in test category');
  });
});
