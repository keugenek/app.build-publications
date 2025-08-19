import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { collectionsTable, usersTable } from '../db/schema';
import { type CreateCollectionInput } from '../schema';
import { createCollection } from '../handlers/create_collection';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashed_password'
};

// Test collection input
const testInput: CreateCollectionInput = {
  name: 'My Reading List',
  description: 'Books I want to read',
  user_id: 1 // Will be updated after user creation
};

describe('createCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a collection with all fields', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;
    const collectionInput = { ...testInput, user_id: userId };

    const result = await createCollection(collectionInput);

    // Verify all fields
    expect(result.id).toBeDefined();
    expect(result.name).toEqual('My Reading List');
    expect(result.description).toEqual('Books I want to read');
    expect(result.user_id).toEqual(userId);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a collection with null description', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;
    const collectionInput = {
      name: 'Simple Collection',
      description: null,
      user_id: userId
    };

    const result = await createCollection(collectionInput);

    expect(result.name).toEqual('Simple Collection');
    expect(result.description).toBeNull();
    expect(result.user_id).toEqual(userId);
  });

  it('should save collection to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;
    const collectionInput = { ...testInput, user_id: userId };

    const result = await createCollection(collectionInput);

    // Verify saved in database
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, result.id))
      .execute();

    expect(collections).toHaveLength(1);
    expect(collections[0].name).toEqual('My Reading List');
    expect(collections[0].description).toEqual('Books I want to read');
    expect(collections[0].user_id).toEqual(userId);
    expect(collections[0].created_at).toBeInstanceOf(Date);
    expect(collections[0].updated_at).toBeInstanceOf(Date);
  });

  it('should enforce unique collection name per user', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;
    const collectionInput = { ...testInput, user_id: userId };

    // Create first collection
    await createCollection(collectionInput);

    // Try to create duplicate collection name for same user
    await expect(createCollection(collectionInput)).rejects.toThrow(/duplicate key value violates unique constraint|unique constraint/i);
  });

  it('should allow same collection name for different users', async () => {
    // Create first user
    const user1Result = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create second user
    const user2Result = await db.insert(usersTable)
      .values({
        ...testUser,
        username: 'testuser2',
        email: 'test2@example.com'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create collection for first user
    const collection1Input = { ...testInput, user_id: user1Id };
    const result1 = await createCollection(collection1Input);

    // Create collection with same name for second user (should succeed)
    const collection2Input = { ...testInput, user_id: user2Id };
    const result2 = await createCollection(collection2Input);

    expect(result1.name).toEqual(result2.name);
    expect(result1.user_id).not.toEqual(result2.user_id);
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should throw error for non-existent user', async () => {
    const collectionInput = {
      name: 'Test Collection',
      description: 'Test description',
      user_id: 999 // Non-existent user ID
    };

    await expect(createCollection(collectionInput)).rejects.toThrow(/User with id 999 not found/i);
  });

  it('should handle empty string description', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;
    const collectionInput = {
      name: 'Collection with Empty Description',
      description: '',
      user_id: userId
    };

    const result = await createCollection(collectionInput);

    expect(result.name).toEqual('Collection with Empty Description');
    expect(result.description).toEqual('');
    expect(result.user_id).toEqual(userId);
  });
});
