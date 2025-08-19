import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { getCategories } from '../handlers/get_categories';
import { eq } from 'drizzle-orm';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no categories', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const result = await getCategories(userId);

    expect(result).toEqual([]);
  });

  it('should return categories for specific user only', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password1'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password2'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create categories for both users
    await db.insert(categoriesTable)
      .values([
        {
          name: 'User 1 Category 1',
          color: '#ff0000',
          user_id: user1Id
        },
        {
          name: 'User 1 Category 2',
          color: null,
          user_id: user1Id
        },
        {
          name: 'User 2 Category',
          color: '#00ff00',
          user_id: user2Id
        }
      ])
      .execute();

    const user1Categories = await getCategories(user1Id);
    const user2Categories = await getCategories(user2Id);

    expect(user1Categories).toHaveLength(2);
    expect(user2Categories).toHaveLength(1);

    // Verify user 1 categories
    expect(user1Categories[0].name).toEqual('User 1 Category 1');
    expect(user1Categories[0].color).toEqual('#ff0000');
    expect(user1Categories[0].user_id).toEqual(user1Id);
    expect(user1Categories[1].name).toEqual('User 1 Category 2');
    expect(user1Categories[1].color).toBeNull();

    // Verify user 2 category
    expect(user2Categories[0].name).toEqual('User 2 Category');
    expect(user2Categories[0].color).toEqual('#00ff00');
    expect(user2Categories[0].user_id).toEqual(user2Id);
  });

  it('should return categories ordered by name', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create categories in reverse alphabetical order
    await db.insert(categoriesTable)
      .values([
        {
          name: 'Zebra Category',
          color: '#ff0000',
          user_id: userId
        },
        {
          name: 'Alpha Category',
          color: '#00ff00',
          user_id: userId
        },
        {
          name: 'Beta Category',
          color: null,
          user_id: userId
        }
      ])
      .execute();

    const categories = await getCategories(userId);

    expect(categories).toHaveLength(3);
    expect(categories[0].name).toEqual('Alpha Category');
    expect(categories[1].name).toEqual('Beta Category');
    expect(categories[2].name).toEqual('Zebra Category');
  });

  it('should include all category fields', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a category
    await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#123456',
        user_id: userId
      })
      .execute();

    const categories = await getCategories(userId);

    expect(categories).toHaveLength(1);
    const category = categories[0];

    // Verify all fields are present
    expect(category.id).toBeDefined();
    expect(typeof category.id).toBe('number');
    expect(category.name).toEqual('Test Category');
    expect(category.color).toEqual('#123456');
    expect(category.user_id).toEqual(userId);
    expect(category.created_at).toBeInstanceOf(Date);
    expect(category.updated_at).toBeInstanceOf(Date);
  });

  it('should handle categories with null color correctly', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create categories with and without color
    await db.insert(categoriesTable)
      .values([
        {
          name: 'Colored Category',
          color: '#abcdef',
          user_id: userId
        },
        {
          name: 'Uncolored Category',
          color: null,
          user_id: userId
        }
      ])
      .execute();

    const categories = await getCategories(userId);

    expect(categories).toHaveLength(2);
    
    const coloredCategory = categories.find(c => c.name === 'Colored Category');
    const uncoloredCategory = categories.find(c => c.name === 'Uncolored Category');

    expect(coloredCategory?.color).toEqual('#abcdef');
    expect(uncoloredCategory?.color).toBeNull();
  });

  it('should return categories created at different times', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create first category
    await db.insert(categoriesTable)
      .values({
        name: 'First Category',
        color: '#111111',
        user_id: userId
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second category
    await db.insert(categoriesTable)
      .values({
        name: 'Second Category',
        color: '#222222',
        user_id: userId
      })
      .execute();

    const categories = await getCategories(userId);

    expect(categories).toHaveLength(2);
    
    // Should still be ordered by name, not creation time
    expect(categories[0].name).toEqual('First Category');
    expect(categories[1].name).toEqual('Second Category');

    // But timestamps should be different
    expect(categories[0].created_at).toBeInstanceOf(Date);
    expect(categories[1].created_at).toBeInstanceOf(Date);
    expect(categories[0].created_at.getTime()).toBeLessThan(categories[1].created_at.getTime());
  });
});
