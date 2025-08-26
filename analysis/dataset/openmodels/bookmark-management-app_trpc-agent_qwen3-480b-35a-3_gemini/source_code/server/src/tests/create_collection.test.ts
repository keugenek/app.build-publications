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
  password_hash: 'hashed_password_here'
};

// Test collection input
const testInput: CreateCollectionInput = {
  name: 'Test Collection',
  description: 'A collection for testing'
};

describe('createCollection', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test user first
    await db.insert(usersTable).values(testUser).execute();
  });
  
  afterEach(resetDB);

  it('should create a collection', async () => {
    const result = await createCollection(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Collection');
    expect(result.description).toEqual(testInput.description);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
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
    expect(collections[0].created_at).toBeInstanceOf(Date);
  });
});
