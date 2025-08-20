import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { collectionsTable, usersTable } from '../db/schema';
import { type CreateCollectionInput } from '../schema';
import { createCollection } from '../handlers/create_collection';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  password_hash: 'hashed_password'
};

// Test input
const testInput: CreateCollectionInput = {
  user_id: 1,
  name: 'Test Collection',
  description: 'A collection for testing'
};

describe('createCollection', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test user first since collections have a foreign key to users
    await db.insert(usersTable).values(testUser).execute();
  });
  
  afterEach(resetDB);

  it('should create a collection', async () => {
    const result = await createCollection(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Collection');
    expect(result.description).toEqual(testInput.description);
    expect(result.user_id).toEqual(testInput.user_id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    // is_public field exists in DB but not in Collection type
  });

  it('should save collection to database', async () => {
    const result = await createCollection(testInput);

    // Query using proper drizzle syntax
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, result.id))
      .execute();

    expect(collections).toHaveLength(1);
    expect(collections[0].name).toEqual('Test Collection');
    expect(collections[0].description).toEqual(testInput.description);
    expect(collections[0].user_id).toEqual(testInput.user_id);
    expect(collections[0].created_at).toBeInstanceOf(Date);
    expect(collections[0].updated_at).toBeInstanceOf(Date);
    expect((collections[0] as any).is_public).toBeFalse();
  });

  it('should handle collections with null description', async () => {
    const inputWithoutDescription: CreateCollectionInput = {
      user_id: 1,
      name: 'Test Collection Without Description',
      description: null
    };

    const result = await createCollection(inputWithoutDescription);

    expect(result.name).toEqual('Test Collection Without Description');
    expect(result.description).toBeNull();
    
    // Verify in database
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, result.id))
      .execute();

    expect(collections).toHaveLength(1);
    expect(collections[0].description).toBeNull();
  });

  it('should throw error for non-existent user_id', async () => {
    const invalidInput: CreateCollectionInput = {
      user_id: 99999, // Non-existent user
      name: 'Invalid Collection',
      description: 'This should fail'
    };

    await expect(createCollection(invalidInput)).rejects.toThrow();
  });
});
