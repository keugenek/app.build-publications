import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable } from '../db/schema';
import { type UpdateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq, and } from 'drizzle-orm';

describe('updateCategory', () => {
  let testUserId: number;
  let testCategoryId: number;
  let otherUserId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'test@example.com',
          password_hash: 'hashed_password'
        },
        {
          email: 'other@example.com',
          password_hash: 'other_hashed_password'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create a test category
    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Original Category',
        color: '#FF5733',
        user_id: testUserId
      })
      .returning()
      .execute();

    testCategoryId = categories[0].id;
  });

  afterEach(resetDB);

  it('should update category name only', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'Updated Category Name',
      user_id: testUserId
    };

    const result = await updateCategory(input);

    expect(result.id).toBe(testCategoryId);
    expect(result.name).toBe('Updated Category Name');
    expect(result.color).toBe('#FF5733'); // Should remain unchanged
    expect(result.user_id).toBe(testUserId);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify the update was persisted
    const saved = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategoryId))
      .execute();

    expect(saved[0].name).toBe('Updated Category Name');
    expect(saved[0].color).toBe('#FF5733');
  });

  it('should update category color only', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      color: '#00FF00',
      user_id: testUserId
    };

    const result = await updateCategory(input);

    expect(result.id).toBe(testCategoryId);
    expect(result.name).toBe('Original Category'); // Should remain unchanged
    expect(result.color).toBe('#00FF00');
    expect(result.user_id).toBe(testUserId);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify the update was persisted
    const saved = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategoryId))
      .execute();

    expect(saved[0].name).toBe('Original Category');
    expect(saved[0].color).toBe('#00FF00');
  });

  it('should update both name and color', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'Completely New Name',
      color: '#0000FF',
      user_id: testUserId
    };

    const result = await updateCategory(input);

    expect(result.id).toBe(testCategoryId);
    expect(result.name).toBe('Completely New Name');
    expect(result.color).toBe('#0000FF');
    expect(result.user_id).toBe(testUserId);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify both fields were updated in database
    const saved = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategoryId))
      .execute();

    expect(saved[0].name).toBe('Completely New Name');
    expect(saved[0].color).toBe('#0000FF');
  });

  it('should set color to null', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      color: null,
      user_id: testUserId
    };

    const result = await updateCategory(input);

    expect(result.id).toBe(testCategoryId);
    expect(result.name).toBe('Original Category'); // Should remain unchanged
    expect(result.color).toBe(null);
    expect(result.user_id).toBe(testUserId);

    // Verify color was set to null in database
    const saved = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategoryId))
      .execute();

    expect(saved[0].color).toBe(null);
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamp
    const original = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategoryId))
      .execute();

    const originalUpdatedAt = original[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'Updated Name',
      user_id: testUserId
    };

    const result = await updateCategory(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should fail when category does not exist', async () => {
    const input: UpdateCategoryInput = {
      id: 99999, // Non-existent ID
      name: 'Updated Name',
      user_id: testUserId
    };

    await expect(updateCategory(input)).rejects.toThrow(/category not found or unauthorized/i);
  });

  it('should fail when user does not own the category', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'Updated Name',
      user_id: otherUserId // Different user
    };

    await expect(updateCategory(input)).rejects.toThrow(/category not found or unauthorized/i);
  });

  it('should validate that category is still owned by correct user after update', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'Updated Category',
      user_id: testUserId
    };

    const result = await updateCategory(input);

    // Verify ownership hasn't changed
    const saved = await db.select()
      .from(categoriesTable)
      .where(and(
        eq(categoriesTable.id, testCategoryId),
        eq(categoriesTable.user_id, testUserId)
      ))
      .execute();

    expect(saved).toHaveLength(1);
    expect(saved[0].user_id).toBe(testUserId);
    expect(result.user_id).toBe(testUserId);
  });

  it('should handle empty string name updates', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: '', // Empty string - should be allowed at handler level
      user_id: testUserId
    };

    const result = await updateCategory(input);

    expect(result.name).toBe('');
    
    // Verify in database
    const saved = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategoryId))
      .execute();

    expect(saved[0].name).toBe('');
  });
});
