import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';
import { eq } from 'drizzle-orm';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when user has no categories', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Get categories for the user
    const result = await getCategories(userId);
    
    expect(result).toEqual([]);
  });

  it('should return all categories for a user', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Create some categories for the user
    const categories = [
      { name: 'Work', user_id: userId },
      { name: 'Personal', user_id: userId },
      { name: 'Ideas', user_id: userId }
    ];
    
    await db.insert(categoriesTable)
      .values(categories)
      .execute();
    
    // Get categories for the user
    const result = await getCategories(userId);
    
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Ideas'); // Should be ordered by name
    expect(result[1].name).toBe('Personal');
    expect(result[2].name).toBe('Work');
    
    // Verify all categories belong to the user
    result.forEach(category => {
      expect(category.user_id).toBe(userId);
      expect(category.id).toBeDefined();
      expect(category.created_at).toBeInstanceOf(Date);
      expect(category.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should not return categories from other users', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;
    
    // Create categories for both users
    await db.insert(categoriesTable)
      .values([
        { name: 'User1 Category', user_id: user1Id },
        { name: 'Another User1 Category', user_id: user1Id }
      ])
      .execute();
    
    await db.insert(categoriesTable)
      .values([
        { name: 'User2 Category', user_id: user2Id }
      ])
      .execute();
    
    // Get categories for user1
    const result = await getCategories(user1Id);
    
    expect(result).toHaveLength(2);
    result.forEach(category => {
      expect(category.user_id).toBe(user1Id);
      expect(category.name).not.toContain('User2');
    });
  });
});
