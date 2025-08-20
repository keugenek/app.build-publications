import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { collectionsTable, usersTable } from '../db/schema';
import { type CreateCollectionInput } from '../schema';
import { createCollection } from '../handlers/create_collection';
import { eq } from 'drizzle-orm';

// Test helper to create a user
const createTestUser = async () => {
  const result = await db.insert(usersTable)
    .values({
      email: 'test@example.com',
      password_hash: 'hashed_password',
      display_name: 'Test User'
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('createCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a collection with description', async () => {
    const user = await createTestUser();
    
    const testInput: CreateCollectionInput = {
      user_id: user.id,
      name: 'My Favorites',
      description: 'A collection of my favorite bookmarks'
    };

    const result = await createCollection(testInput);

    // Basic field validation
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(user.id);
    expect(result.name).toEqual('My Favorites');
    expect(result.description).toEqual('A collection of my favorite bookmarks');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a collection without description', async () => {
    const user = await createTestUser();
    
    const testInput: CreateCollectionInput = {
      user_id: user.id,
      name: 'Work Bookmarks'
    };

    const result = await createCollection(testInput);

    // Basic field validation
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(user.id);
    expect(result.name).toEqual('Work Bookmarks');
    expect(result.description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a collection with null description explicitly', async () => {
    const user = await createTestUser();
    
    const testInput: CreateCollectionInput = {
      user_id: user.id,
      name: 'Empty Collection',
      description: null
    };

    const result = await createCollection(testInput);

    // Basic field validation
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(user.id);
    expect(result.name).toEqual('Empty Collection');
    expect(result.description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save collection to database', async () => {
    const user = await createTestUser();
    
    const testInput: CreateCollectionInput = {
      user_id: user.id,
      name: 'Test Collection',
      description: 'Test description'
    };

    const result = await createCollection(testInput);

    // Query using proper drizzle syntax
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, result.id))
      .execute();

    expect(collections).toHaveLength(1);
    expect(collections[0].name).toEqual('Test Collection');
    expect(collections[0].description).toEqual('Test description');
    expect(collections[0].user_id).toEqual(user.id);
    expect(collections[0].created_at).toBeInstanceOf(Date);
    expect(collections[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const testInput: CreateCollectionInput = {
      user_id: 999999, // Non-existent user ID
      name: 'Test Collection',
      description: 'Test description'
    };

    await expect(createCollection(testInput)).rejects.toThrow(/User with id 999999 does not exist/i);
  });

  it('should create multiple collections for same user', async () => {
    const user = await createTestUser();
    
    const input1: CreateCollectionInput = {
      user_id: user.id,
      name: 'Collection 1',
      description: 'First collection'
    };

    const input2: CreateCollectionInput = {
      user_id: user.id,
      name: 'Collection 2',
      description: 'Second collection'
    };

    const result1 = await createCollection(input1);
    const result2 = await createCollection(input2);

    // Verify both collections were created with different IDs
    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);

    // Verify both collections belong to same user
    expect(result1.user_id).toEqual(user.id);
    expect(result2.user_id).toEqual(user.id);

    // Verify names are correct
    expect(result1.name).toEqual('Collection 1');
    expect(result2.name).toEqual('Collection 2');

    // Verify both are persisted in database
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.user_id, user.id))
      .execute();

    expect(collections).toHaveLength(2);
  });

  it('should handle collections with same name for same user', async () => {
    const user = await createTestUser();
    
    const input1: CreateCollectionInput = {
      user_id: user.id,
      name: 'Favorites',
      description: 'First favorites'
    };

    const input2: CreateCollectionInput = {
      user_id: user.id,
      name: 'Favorites',
      description: 'Second favorites'
    };

    const result1 = await createCollection(input1);
    const result2 = await createCollection(input2);

    // Both should be created successfully (no unique constraint on name)
    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Favorites');
    expect(result2.name).toEqual('Favorites');
  });
});
