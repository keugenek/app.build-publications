import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable } from '../db/schema';
import { getCollections } from '../handlers/get_collections';

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashed_password'
};

const testUser2 = {
  username: 'testuser2',
  email: 'test2@example.com',
  password_hash: 'hashed_password2'
};

describe('getCollections', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no collections', async () => {
    // Create user without collections
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const result = await getCollections(userResult[0].id);

    expect(result).toEqual([]);
  });

  it('should return all collections for a specific user', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create collections for the user
    await db.insert(collectionsTable)
      .values([
        {
          name: 'Work Bookmarks',
          description: 'Professional resources',
          user_id: userId
        },
        {
          name: 'Personal Bookmarks',
          description: 'Personal interests',
          user_id: userId
        },
        {
          name: 'Tech Resources',
          description: null,
          user_id: userId
        }
      ])
      .execute();

    const result = await getCollections(userId);

    expect(result).toHaveLength(3);
    
    // Verify all collections belong to the user
    result.forEach(collection => {
      expect(collection.user_id).toEqual(userId);
      expect(collection.id).toBeDefined();
      expect(collection.created_at).toBeInstanceOf(Date);
      expect(collection.updated_at).toBeInstanceOf(Date);
    });

    // Check specific collection data
    const personalCollection = result.find(c => c.name === 'Personal Bookmarks');
    expect(personalCollection).toBeDefined();
    expect(personalCollection?.description).toEqual('Personal interests');

    const techCollection = result.find(c => c.name === 'Tech Resources');
    expect(techCollection).toBeDefined();
    expect(techCollection?.description).toBeNull();
  });

  it('should return collections ordered by name', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create collections in non-alphabetical order
    await db.insert(collectionsTable)
      .values([
        {
          name: 'Zebra Collection',
          description: 'Last in alphabet',
          user_id: userId
        },
        {
          name: 'Alpha Collection',
          description: 'First in alphabet',
          user_id: userId
        },
        {
          name: 'Beta Collection',
          description: 'Second in alphabet',
          user_id: userId
        }
      ])
      .execute();

    const result = await getCollections(userId);

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Alpha Collection');
    expect(result[1].name).toEqual('Beta Collection');
    expect(result[2].name).toEqual('Zebra Collection');
  });

  it('should only return collections for the specified user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values(testUser2)
      .returning()
      .execute();

    const userId1 = user1Result[0].id;
    const userId2 = user2Result[0].id;

    // Create collections for both users
    await db.insert(collectionsTable)
      .values([
        {
          name: 'User 1 Collection 1',
          description: 'First user collection',
          user_id: userId1
        },
        {
          name: 'User 1 Collection 2',
          description: 'Second user collection',
          user_id: userId1
        },
        {
          name: 'User 2 Collection',
          description: 'Other user collection',
          user_id: userId2
        }
      ])
      .execute();

    // Get collections for user 1
    const user1Collections = await getCollections(userId1);
    expect(user1Collections).toHaveLength(2);
    user1Collections.forEach(collection => {
      expect(collection.user_id).toEqual(userId1);
      expect(collection.name).toMatch(/User 1 Collection/);
    });

    // Get collections for user 2
    const user2Collections = await getCollections(userId2);
    expect(user2Collections).toHaveLength(1);
    expect(user2Collections[0].user_id).toEqual(userId2);
    expect(user2Collections[0].name).toEqual('User 2 Collection');
  });

  it('should return empty array for non-existent user', async () => {
    const nonExistentUserId = 99999;
    const result = await getCollections(nonExistentUserId);

    expect(result).toEqual([]);
  });
});
