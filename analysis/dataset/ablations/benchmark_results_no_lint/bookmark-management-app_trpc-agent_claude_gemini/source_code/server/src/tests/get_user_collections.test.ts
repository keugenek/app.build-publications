import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable } from '../db/schema';
import { getUserCollections } from '../handlers/get_user_collections';

describe('getUserCollections', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no collections', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const collections = await getUserCollections(userId);

    expect(collections).toHaveLength(0);
    expect(Array.isArray(collections)).toBe(true);
  });

  it('should return user collections ordered by creation date', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create multiple collections with slight delays to ensure different timestamps
    const collection1 = await db.insert(collectionsTable)
      .values({
        name: 'First Collection',
        description: 'This was created first',
        user_id: userId
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const collection2 = await db.insert(collectionsTable)
      .values({
        name: 'Second Collection',
        description: 'This was created second',
        user_id: userId
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const collection3 = await db.insert(collectionsTable)
      .values({
        name: 'Third Collection',
        description: null,
        user_id: userId
      })
      .returning()
      .execute();

    const collections = await getUserCollections(userId);

    expect(collections).toHaveLength(3);
    
    // Verify they are ordered by creation date (oldest first)
    expect(collections[0].name).toBe('First Collection');
    expect(collections[1].name).toBe('Second Collection');
    expect(collections[2].name).toBe('Third Collection');

    // Verify timestamps are in ascending order
    expect(collections[0].created_at <= collections[1].created_at).toBe(true);
    expect(collections[1].created_at <= collections[2].created_at).toBe(true);

    // Verify all collections belong to the correct user
    collections.forEach(collection => {
      expect(collection.user_id).toBe(userId);
      expect(collection.id).toBeDefined();
      expect(collection.created_at).toBeInstanceOf(Date);
    });

    // Test nullable description field
    expect(collections[0].description).toBe('This was created first');
    expect(collections[1].description).toBe('This was created second');
    expect(collections[2].description).toBeNull();
  });

  it('should only return collections for the specified user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        username: 'user1'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        username: 'user2'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create collections for both users
    await db.insert(collectionsTable)
      .values([
        {
          name: 'User 1 Collection A',
          description: 'Belongs to user 1',
          user_id: user1Id
        },
        {
          name: 'User 1 Collection B',
          description: 'Also belongs to user 1',
          user_id: user1Id
        },
        {
          name: 'User 2 Collection',
          description: 'Belongs to user 2',
          user_id: user2Id
        }
      ])
      .execute();

    // Get collections for user 1
    const user1Collections = await getUserCollections(user1Id);
    expect(user1Collections).toHaveLength(2);
    user1Collections.forEach(collection => {
      expect(collection.user_id).toBe(user1Id);
      expect(collection.name).toMatch(/User 1 Collection/);
    });

    // Get collections for user 2
    const user2Collections = await getUserCollections(user2Id);
    expect(user2Collections).toHaveLength(1);
    expect(user2Collections[0].user_id).toBe(user2Id);
    expect(user2Collections[0].name).toBe('User 2 Collection');
  });

  it('should handle non-existent user gracefully', async () => {
    const nonExistentUserId = 999999;
    
    const collections = await getUserCollections(nonExistentUserId);
    
    expect(collections).toHaveLength(0);
    expect(Array.isArray(collections)).toBe(true);
  });

  it('should return collections with all required fields', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a collection
    await db.insert(collectionsTable)
      .values({
        name: 'Test Collection',
        description: 'A test collection with description',
        user_id: userId
      })
      .execute();

    const collections = await getUserCollections(userId);

    expect(collections).toHaveLength(1);
    const collection = collections[0];

    // Verify all required fields are present and correctly typed
    expect(typeof collection.id).toBe('number');
    expect(typeof collection.name).toBe('string');
    expect(typeof collection.user_id).toBe('number');
    expect(collection.created_at).toBeInstanceOf(Date);
    
    // Description can be string or null
    expect(typeof collection.description === 'string' || collection.description === null).toBe(true);
    
    expect(collection.name).toBe('Test Collection');
    expect(collection.description).toBe('A test collection with description');
    expect(collection.user_id).toBe(userId);
  });
});
