import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable } from '../db/schema';
import { getCollections } from '../handlers/get_collections';

// Test user data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password',
  display_name: 'Test User'
};

// Test collection data
const testCollections = [
  {
    name: 'Tech Resources',
    description: 'Programming and technology bookmarks'
  },
  {
    name: 'Recipes',
    description: 'Cooking recipes and food blogs'
  },
  {
    name: 'Travel',
    description: null // Test nullable description
  }
];

describe('getCollections', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for user with no collections', async () => {
    // Create user without collections
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;
    const collections = await getCollections(userId);

    expect(collections).toHaveLength(0);
  });

  it('should return all collections for a user', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create collections for the user
    await db.insert(collectionsTable)
      .values(testCollections.map(collection => ({
        ...collection,
        user_id: userId
      })))
      .execute();

    const collections = await getCollections(userId);

    expect(collections).toHaveLength(3);
    expect(collections[0].user_id).toEqual(userId);
    expect(collections[1].user_id).toEqual(userId);
    expect(collections[2].user_id).toEqual(userId);

    // Verify all expected collection names are present
    const collectionNames = collections.map(c => c.name);
    expect(collectionNames).toContain('Tech Resources');
    expect(collectionNames).toContain('Recipes');
    expect(collectionNames).toContain('Travel');
  });

  it('should return collections ordered by creation date (newest first)', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create collections with different creation times
    const firstCollection = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'First Collection',
        description: 'Created first'
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondCollection = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'Second Collection',
        description: 'Created second'
      })
      .returning()
      .execute();

    const collections = await getCollections(userId);

    expect(collections).toHaveLength(2);
    // Should be ordered by newest first
    expect(collections[0].name).toEqual('Second Collection');
    expect(collections[1].name).toEqual('First Collection');
    expect(collections[0].created_at >= collections[1].created_at).toBe(true);
  });

  it('should only return collections for the specified user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        ...testUser,
        email: 'user1@example.com'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        ...testUser,
        email: 'user2@example.com'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create collections for both users
    await db.insert(collectionsTable)
      .values([
        {
          user_id: user1Id,
          name: 'User1 Collection 1',
          description: 'Belongs to user 1'
        },
        {
          user_id: user1Id,
          name: 'User1 Collection 2',
          description: 'Also belongs to user 1'
        },
        {
          user_id: user2Id,
          name: 'User2 Collection',
          description: 'Belongs to user 2'
        }
      ])
      .execute();

    // Get collections for user1
    const user1Collections = await getCollections(user1Id);
    expect(user1Collections).toHaveLength(2);
    expect(user1Collections.every(c => c.user_id === user1Id)).toBe(true);

    // Get collections for user2
    const user2Collections = await getCollections(user2Id);
    expect(user2Collections).toHaveLength(1);
    expect(user2Collections[0].user_id).toEqual(user2Id);
    expect(user2Collections[0].name).toEqual('User2 Collection');
  });

  it('should handle nullable description fields correctly', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create collection with null description
    await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'Collection with null description',
        description: null
      })
      .execute();

    const collections = await getCollections(userId);

    expect(collections).toHaveLength(1);
    expect(collections[0].description).toBeNull();
    expect(collections[0].name).toEqual('Collection with null description');
  });

  it('should return collections with proper date objects', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create collection
    await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'Date Test Collection',
        description: 'Testing date fields'
      })
      .execute();

    const collections = await getCollections(userId);

    expect(collections).toHaveLength(1);
    expect(collections[0].created_at).toBeInstanceOf(Date);
    expect(collections[0].updated_at).toBeInstanceOf(Date);
  });
});
