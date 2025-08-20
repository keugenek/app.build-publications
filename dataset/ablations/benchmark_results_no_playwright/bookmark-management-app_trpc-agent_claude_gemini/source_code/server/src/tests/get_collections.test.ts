import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable } from '../db/schema';
import { type GetUserEntityInput } from '../schema';
import { getCollections } from '../handlers/get_collections';

// Test setup data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashedpassword123'
};

const secondUser = {
  username: 'testuser2',
  email: 'test2@example.com',
  password_hash: 'hashedpassword456'
};

describe('getCollections', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no collections', async () => {
    // Create user but no collections
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const input: GetUserEntityInput = {
      user_id: user.id
    };

    const result = await getCollections(input);

    expect(result).toEqual([]);
  });

  it('should return all collections for a specific user', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create collections for the user
    const collectionsData = [
      {
        user_id: user.id,
        name: 'Work Bookmarks',
        description: 'Professional resources'
      },
      {
        user_id: user.id,
        name: 'Personal',
        description: 'Personal bookmarks'
      },
      {
        user_id: user.id,
        name: 'Learning',
        description: null // Test nullable description
      }
    ];

    await db.insert(collectionsTable)
      .values(collectionsData)
      .execute();

    const input: GetUserEntityInput = {
      user_id: user.id
    };

    const result = await getCollections(input);

    expect(result).toHaveLength(3);
    
    // Verify all collections belong to the correct user
    result.forEach(collection => {
      expect(collection.user_id).toEqual(user.id);
    });

    // Check specific collection details
    const workCollection = result.find(c => c.name === 'Work Bookmarks');
    expect(workCollection).toBeDefined();
    expect(workCollection!.description).toEqual('Professional resources');
    expect(workCollection!.created_at).toBeInstanceOf(Date);
    expect(workCollection!.updated_at).toBeInstanceOf(Date);
    expect(workCollection!.id).toBeDefined();

    const learningCollection = result.find(c => c.name === 'Learning');
    expect(learningCollection).toBeDefined();
    expect(learningCollection!.description).toBeNull();
  });

  it('should only return collections for the specified user', async () => {
    // Create two users
    const [user1] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values(secondUser)
      .returning()
      .execute();

    // Create collections for both users
    await db.insert(collectionsTable)
      .values([
        {
          user_id: user1.id,
          name: 'User 1 Collection',
          description: 'First user collection'
        },
        {
          user_id: user2.id,
          name: 'User 2 Collection',
          description: 'Second user collection'
        }
      ])
      .execute();

    const input: GetUserEntityInput = {
      user_id: user1.id
    };

    const result = await getCollections(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user1.id);
    expect(result[0].name).toEqual('User 1 Collection');
    expect(result[0].description).toEqual('First user collection');
  });

  it('should handle user with many collections', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create many collections
    const manyCollections = Array.from({ length: 10 }, (_, i) => ({
      user_id: user.id,
      name: `Collection ${i + 1}`,
      description: `Description for collection ${i + 1}`
    }));

    await db.insert(collectionsTable)
      .values(manyCollections)
      .execute();

    const input: GetUserEntityInput = {
      user_id: user.id
    };

    const result = await getCollections(input);

    expect(result).toHaveLength(10);
    
    // Verify all collections belong to the user
    result.forEach(collection => {
      expect(collection.user_id).toEqual(user.id);
      expect(collection.name).toMatch(/^Collection \d+$/);
      expect(collection.description).toMatch(/^Description for collection \d+$/);
    });
  });

  it('should return empty array for non-existent user', async () => {
    const input: GetUserEntityInput = {
      user_id: 999999 // Non-existent user ID
    };

    const result = await getCollections(input);

    expect(result).toEqual([]);
  });
});
