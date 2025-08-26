import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable } from '../db/schema';
import { type GetUserCategoriesInput } from '../schema';
import { getUserCategories } from '../handlers/get_user_categories';

describe('getUserCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let otherUserId: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'test@example.com',
          password_hash: 'hashed_password'
        },
        {
          email: 'other@example.com',
          password_hash: 'hashed_password'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    otherUserId = users[1].id;
  });

  it('should return empty array when user has no categories', async () => {
    const input: GetUserCategoriesInput = {
      user_id: testUserId
    };

    const result = await getUserCategories(input);

    expect(result).toEqual([]);
  });

  it('should return user categories ordered by name', async () => {
    // Create categories with different names to test ordering
    await db.insert(categoriesTable)
      .values([
        {
          name: 'Work',
          user_id: testUserId
        },
        {
          name: 'Personal',
          user_id: testUserId
        },
        {
          name: 'Archive',
          user_id: testUserId
        }
      ])
      .execute();

    const input: GetUserCategoriesInput = {
      user_id: testUserId
    };

    const result = await getUserCategories(input);

    expect(result).toHaveLength(3);
    // Should be ordered alphabetically by name
    expect(result[0].name).toEqual('Archive');
    expect(result[1].name).toEqual('Personal');
    expect(result[2].name).toEqual('Work');

    // Verify all categories belong to the correct user
    result.forEach(category => {
      expect(category.user_id).toEqual(testUserId);
      expect(category.id).toBeDefined();
      expect(category.created_at).toBeInstanceOf(Date);
      expect(category.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should only return categories for the specified user', async () => {
    // Create categories for both users
    await db.insert(categoriesTable)
      .values([
        {
          name: 'User 1 Category',
          user_id: testUserId
        },
        {
          name: 'User 2 Category',
          user_id: otherUserId
        },
        {
          name: 'Another User 1 Category',
          user_id: testUserId
        }
      ])
      .execute();

    const input: GetUserCategoriesInput = {
      user_id: testUserId
    };

    const result = await getUserCategories(input);

    expect(result).toHaveLength(2);
    result.forEach(category => {
      expect(category.user_id).toEqual(testUserId);
    });

    // Verify categories are ordered by name
    expect(result[0].name).toEqual('Another User 1 Category');
    expect(result[1].name).toEqual('User 1 Category');
  });

  it('should return empty array for non-existent user', async () => {
    // Create some categories for existing user
    await db.insert(categoriesTable)
      .values([
        {
          name: 'Test Category',
          user_id: testUserId
        }
      ])
      .execute();

    const input: GetUserCategoriesInput = {
      user_id: 99999 // Non-existent user
    };

    const result = await getUserCategories(input);

    expect(result).toEqual([]);
  });

  it('should handle multiple categories with same name correctly', async () => {
    // Create categories with same name (should be allowed per schema)
    await db.insert(categoriesTable)
      .values([
        {
          name: 'Important',
          user_id: testUserId
        },
        {
          name: 'Important',
          user_id: testUserId
        },
        {
          name: 'Less Important',
          user_id: testUserId
        }
      ])
      .execute();

    const input: GetUserCategoriesInput = {
      user_id: testUserId
    };

    const result = await getUserCategories(input);

    expect(result).toHaveLength(3);
    
    // Should be ordered by name, with duplicates appearing together
    expect(result[0].name).toEqual('Important');
    expect(result[1].name).toEqual('Important');
    expect(result[2].name).toEqual('Less Important');

    // Each should have unique IDs
    const ids = result.map(cat => cat.id);
    expect(new Set(ids).size).toEqual(3); // All IDs should be unique
  });
});
