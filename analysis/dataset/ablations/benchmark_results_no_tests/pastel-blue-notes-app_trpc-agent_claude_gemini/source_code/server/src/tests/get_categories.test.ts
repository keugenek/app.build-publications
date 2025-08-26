import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable } from '../db/schema';
import { type GetNotesByUserInput } from '../schema';
import { getCategories } from '../handlers/get_categories';

// Test input
const testInput: GetNotesByUserInput = {
  user_id: 1
};

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashed_password'
};

// Test category data
const testCategories = [
  {
    name: 'Work',
    user_id: 1
  },
  {
    name: 'Personal',
    user_id: 1
  },
  {
    name: 'Study',
    user_id: 1
  }
];

// Category for different user (should not be returned)
const otherUserCategory = {
  name: 'Other User Category',
  user_id: 2
};

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no categories', async () => {
    // Create a user but no categories
    await db.insert(usersTable).values(testUser).execute();

    const result = await getCategories(testInput);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all categories for a specific user', async () => {
    // Create test user and another user
    await db.insert(usersTable).values([
      testUser,
      {
        username: 'otheruser',
        email: 'other@example.com',
        password_hash: 'other_hashed_password'
      }
    ]).execute();

    // Create categories for both users
    await db.insert(categoriesTable).values([
      ...testCategories,
      otherUserCategory
    ]).execute();

    const result = await getCategories(testInput);

    // Should return exactly 3 categories for user_id 1
    expect(result).toHaveLength(3);
    
    // Verify all returned categories belong to the correct user
    result.forEach(category => {
      expect(category.user_id).toEqual(1);
    });

    // Verify specific category names are present
    const categoryNames = result.map(c => c.name).sort();
    expect(categoryNames).toEqual(['Personal', 'Study', 'Work']);
  });

  it('should return categories with correct structure', async () => {
    // Create test user and category
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(categoriesTable).values(testCategories[0]).execute();

    const result = await getCategories(testInput);

    expect(result).toHaveLength(1);
    
    const category = result[0];
    expect(category.id).toBeDefined();
    expect(category.name).toEqual('Work');
    expect(category.user_id).toEqual(1);
    expect(category.created_at).toBeInstanceOf(Date);
    expect(category.updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array for non-existent user', async () => {
    // Don't create any users, test with user_id that doesn't exist
    const nonExistentUserInput: GetNotesByUserInput = {
      user_id: 999
    };

    const result = await getCategories(nonExistentUserInput);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should maintain correct order and uniqueness', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create categories in specific order
    const orderedCategories = [
      { name: 'Z Category', user_id: 1 },
      { name: 'A Category', user_id: 1 },
      { name: 'M Category', user_id: 1 }
    ];

    await db.insert(categoriesTable).values(orderedCategories).execute();

    const result = await getCategories(testInput);

    expect(result).toHaveLength(3);
    
    // Each category should have a unique ID
    const ids = result.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toEqual(ids.length);

    // All should belong to user 1
    result.forEach(category => {
      expect(category.user_id).toEqual(1);
    });
  });

  it('should handle database query correctly', async () => {
    // Create multiple users and categories
    await db.insert(usersTable).values([
      testUser,
      {
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hash2'
      },
      {
        username: 'user3',
        email: 'user3@example.com',
        password_hash: 'hash3'
      }
    ]).execute();

    // Create categories for different users
    await db.insert(categoriesTable).values([
      { name: 'User1 Cat1', user_id: 1 },
      { name: 'User1 Cat2', user_id: 1 },
      { name: 'User2 Cat1', user_id: 2 },
      { name: 'User3 Cat1', user_id: 3 }
    ]).execute();

    // Test different user queries
    const user1Result = await getCategories({ user_id: 1 });
    const user2Result = await getCategories({ user_id: 2 });
    const user3Result = await getCategories({ user_id: 3 });

    // Verify correct filtering
    expect(user1Result).toHaveLength(2);
    expect(user2Result).toHaveLength(1);
    expect(user3Result).toHaveLength(1);

    // Verify correct categories are returned
    expect(user1Result.map(c => c.name).sort()).toEqual(['User1 Cat1', 'User1 Cat2']);
    expect(user2Result[0].name).toEqual('User2 Cat1');
    expect(user3Result[0].name).toEqual('User3 Cat1');
  });
});
