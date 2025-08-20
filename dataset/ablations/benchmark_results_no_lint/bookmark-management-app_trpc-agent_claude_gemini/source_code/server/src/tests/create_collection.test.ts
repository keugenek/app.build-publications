import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { collectionsTable, usersTable } from '../db/schema';
import { type CreateCollectionInput } from '../schema';
import { createCollection } from '../handlers/create_collection';
import { eq, and } from 'drizzle-orm';

describe('createCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test user
  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a collection with all fields', async () => {
    // Create prerequisite user
    const user = await createTestUser();

    const testInput: CreateCollectionInput = {
      name: 'My Favorite Links',
      description: 'A collection of useful resources',
      user_id: user.id
    };

    const result = await createCollection(testInput);

    // Basic field validation
    expect(result.name).toEqual('My Favorite Links');
    expect(result.description).toEqual('A collection of useful resources');
    expect(result.user_id).toEqual(user.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a collection with null description', async () => {
    // Create prerequisite user
    const user = await createTestUser();

    const testInput: CreateCollectionInput = {
      name: 'Work Links',
      description: null,
      user_id: user.id
    };

    const result = await createCollection(testInput);

    expect(result.name).toEqual('Work Links');
    expect(result.description).toBeNull();
    expect(result.user_id).toEqual(user.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save collection to database', async () => {
    // Create prerequisite user
    const user = await createTestUser();

    const testInput: CreateCollectionInput = {
      name: 'Tech Resources',
      description: 'Programming and development links',
      user_id: user.id
    };

    const result = await createCollection(testInput);

    // Query using proper drizzle syntax
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, result.id))
      .execute();

    expect(collections).toHaveLength(1);
    expect(collections[0].name).toEqual('Tech Resources');
    expect(collections[0].description).toEqual('Programming and development links');
    expect(collections[0].user_id).toEqual(user.id);
    expect(collections[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const testInput: CreateCollectionInput = {
      name: 'Invalid Collection',
      description: 'This should fail',
      user_id: 99999 // Non-existent user ID
    };

    await expect(createCollection(testInput)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when collection name already exists for user', async () => {
    // Create prerequisite user
    const user = await createTestUser();

    const testInput: CreateCollectionInput = {
      name: 'Duplicate Name',
      description: 'First collection',
      user_id: user.id
    };

    // Create first collection
    await createCollection(testInput);

    // Try to create second collection with same name for same user
    const duplicateInput: CreateCollectionInput = {
      name: 'Duplicate Name',
      description: 'Second collection with same name',
      user_id: user.id
    };

    await expect(createCollection(duplicateInput)).rejects.toThrow(/collection name already exists/i);
  });

  it('should allow same collection name for different users', async () => {
    // Create two test users
    const user1 = await createTestUser();
    
    const user2 = await db.insert(usersTable)
      .values({
        email: 'test2@example.com',
        username: 'testuser2'
      })
      .returning()
      .execute();

    const collectionName = 'Personal Links';

    // Create collection for first user
    const input1: CreateCollectionInput = {
      name: collectionName,
      description: 'User 1 collection',
      user_id: user1.id
    };

    const result1 = await createCollection(input1);

    // Create collection with same name for second user
    const input2: CreateCollectionInput = {
      name: collectionName,
      description: 'User 2 collection',
      user_id: user2[0].id
    };

    const result2 = await createCollection(input2);

    // Both should succeed
    expect(result1.name).toEqual(collectionName);
    expect(result1.user_id).toEqual(user1.id);
    expect(result2.name).toEqual(collectionName);
    expect(result2.user_id).toEqual(user2[0].id);
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should validate collections are properly stored for each user', async () => {
    // Create two test users
    const user1 = await createTestUser();
    
    const user2 = await db.insert(usersTable)
      .values({
        email: 'another@example.com',
        username: 'anotheruser'
      })
      .returning()
      .execute();

    // Create collections for each user
    await createCollection({
      name: 'User1 Collection',
      description: 'For user 1',
      user_id: user1.id
    });

    await createCollection({
      name: 'User2 Collection',
      description: 'For user 2', 
      user_id: user2[0].id
    });

    // Verify each user has their own collection
    const user1Collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.user_id, user1.id))
      .execute();

    const user2Collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.user_id, user2[0].id))
      .execute();

    expect(user1Collections).toHaveLength(1);
    expect(user1Collections[0].name).toEqual('User1 Collection');
    expect(user1Collections[0].user_id).toEqual(user1.id);

    expect(user2Collections).toHaveLength(1);
    expect(user2Collections[0].name).toEqual('User2 Collection');
    expect(user2Collections[0].user_id).toEqual(user2[0].id);
  });
});
