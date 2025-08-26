import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { collectionsTable, usersTable } from '../db/schema';
import { type CreateCollectionInput } from '../schema';
import { createCollection } from '../handlers/create_collection';
import { eq } from 'drizzle-orm';

describe('createCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user for collections
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  it('should create a collection with all fields', async () => {
    const testInput: CreateCollectionInput = {
      user_id: testUserId,
      name: 'My Favorite Links',
      description: 'Collection of my favorite bookmarks'
    };

    const result = await createCollection(testInput);

    // Basic field validation
    expect(result.name).toEqual('My Favorite Links');
    expect(result.description).toEqual('Collection of my favorite bookmarks');
    expect(result.user_id).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a collection without description', async () => {
    const testInput: CreateCollectionInput = {
      user_id: testUserId,
      name: 'Work Bookmarks'
    };

    const result = await createCollection(testInput);

    expect(result.name).toEqual('Work Bookmarks');
    expect(result.description).toBeNull();
    expect(result.user_id).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a collection with null description when explicitly set', async () => {
    const testInput: CreateCollectionInput = {
      user_id: testUserId,
      name: 'Quick Links',
      description: null
    };

    const result = await createCollection(testInput);

    expect(result.name).toEqual('Quick Links');
    expect(result.description).toBeNull();
    expect(result.user_id).toEqual(testUserId);
    expect(result.id).toBeDefined();
  });

  it('should save collection to database', async () => {
    const testInput: CreateCollectionInput = {
      user_id: testUserId,
      name: 'Database Test Collection',
      description: 'Testing database persistence'
    };

    const result = await createCollection(testInput);

    // Query collection from database
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, result.id))
      .execute();

    expect(collections).toHaveLength(1);
    expect(collections[0].name).toEqual('Database Test Collection');
    expect(collections[0].description).toEqual('Testing database persistence');
    expect(collections[0].user_id).toEqual(testUserId);
    expect(collections[0].created_at).toBeInstanceOf(Date);
    expect(collections[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const testInput: CreateCollectionInput = {
      user_id: 99999, // Non-existent user ID
      name: 'Invalid Collection'
    };

    await expect(createCollection(testInput)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should handle database constraint violations gracefully', async () => {
    // Try to create collection with very long name that exceeds varchar(100) limit
    const testInput: CreateCollectionInput = {
      user_id: testUserId,
      name: 'A'.repeat(150), // Exceeds the 100 character limit
      description: 'This should fail'
    };

    await expect(createCollection(testInput)).rejects.toThrow();
  });

  it('should create multiple collections for same user', async () => {
    const testInput1: CreateCollectionInput = {
      user_id: testUserId,
      name: 'Collection 1',
      description: 'First collection'
    };

    const testInput2: CreateCollectionInput = {
      user_id: testUserId,
      name: 'Collection 2',
      description: 'Second collection'
    };

    const result1 = await createCollection(testInput1);
    const result2 = await createCollection(testInput2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.user_id).toEqual(testUserId);
    expect(result2.user_id).toEqual(testUserId);
    expect(result1.name).toEqual('Collection 1');
    expect(result2.name).toEqual('Collection 2');

    // Verify both collections exist in database
    const allCollections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.user_id, testUserId))
      .execute();

    expect(allCollections).toHaveLength(2);
  });
});
