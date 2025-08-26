import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable } from '../db/schema';
import { type UpdateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testCategoryId: number;
  let otherUserId: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'test@example.com',
          password_hash: 'hashedpassword123'
        },
        {
          email: 'other@example.com',
          password_hash: 'hashedpassword456'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create test category
    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Original Category',
        user_id: testUserId
      })
      .returning()
      .execute();

    testCategoryId = categories[0].id;
  });

  it('should update a category name successfully', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'Updated Category Name',
      user_id: testUserId
    };

    const result = await updateCategory(input);

    expect(result.id).toEqual(testCategoryId);
    expect(result.name).toEqual('Updated Category Name');
    expect(result.user_id).toEqual(testUserId);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify updated_at is different from created_at
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should update category in database', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'Database Updated Name',
      user_id: testUserId
    };

    await updateCategory(input);

    // Query database to verify update
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategoryId))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Database Updated Name');
    expect(categories[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // First get the original category
    const original = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategoryId))
      .execute();

    const originalCreatedAt = original[0].created_at;

    const input: UpdateCategoryInput = {
      id: testCategoryId,
      user_id: testUserId
      // Note: name is not provided, should remain unchanged
    };

    const result = await updateCategory(input);

    expect(result.name).toEqual('Original Category'); // Should remain unchanged
    expect(result.created_at).toEqual(originalCreatedAt); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
  });

  it('should throw error when category does not exist', async () => {
    const input: UpdateCategoryInput = {
      id: 99999, // Non-existent category
      name: 'Updated Name',
      user_id: testUserId
    };

    expect(updateCategory(input)).rejects.toThrow(/category not found/i);
  });

  it('should throw error when user does not own category', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'Updated Name',
      user_id: otherUserId // Different user trying to update
    };

    expect(updateCategory(input)).rejects.toThrow(/category not found|access denied/i);
  });

  it('should preserve category ownership after update', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'Ownership Test Category',
      user_id: testUserId
    };

    const result = await updateCategory(input);

    expect(result.user_id).toEqual(testUserId);
    
    // Verify in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategoryId))
      .execute();

    expect(categories[0].user_id).toEqual(testUserId);
  });

  it('should handle empty string name update', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: '', // Empty string should be allowed (validation happens at schema level)
      user_id: testUserId
    };

    const result = await updateCategory(input);

    expect(result.name).toEqual('');
  });
});
