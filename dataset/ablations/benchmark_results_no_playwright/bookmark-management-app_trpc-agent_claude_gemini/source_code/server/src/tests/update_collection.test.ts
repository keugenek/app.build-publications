import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable } from '../db/schema';
import { type UpdateCollectionInput } from '../schema';
import { updateCollection } from '../handlers/update_collection';
import { eq } from 'drizzle-orm';

// Create test user and collection
const createTestData = async () => {
  // Create test user first
  const user = await db.insert(usersTable)
    .values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashed_password'
    })
    .returning()
    .execute();

  // Create test collection
  const collection = await db.insert(collectionsTable)
    .values({
      user_id: user[0].id,
      name: 'Original Collection',
      description: 'Original description'
    })
    .returning()
    .execute();

  return { user: user[0], collection: collection[0] };
};

describe('updateCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update collection name only', async () => {
    const { collection } = await createTestData();

    // Add small delay to ensure updated_at timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1));

    const updateInput: UpdateCollectionInput = {
      id: collection.id,
      name: 'Updated Collection Name'
    };

    const result = await updateCollection(updateInput);

    // Verify the update
    expect(result.id).toEqual(collection.id);
    expect(result.user_id).toEqual(collection.user_id);
    expect(result.name).toEqual('Updated Collection Name');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.created_at).toEqual(collection.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > collection.updated_at).toBe(true);
  });

  it('should update collection description only', async () => {
    const { collection } = await createTestData();

    // Add small delay to ensure updated_at timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1));

    const updateInput: UpdateCollectionInput = {
      id: collection.id,
      description: 'Updated description'
    };

    const result = await updateCollection(updateInput);

    // Verify the update
    expect(result.id).toEqual(collection.id);
    expect(result.user_id).toEqual(collection.user_id);
    expect(result.name).toEqual('Original Collection'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toEqual(collection.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > collection.updated_at).toBe(true);
  });

  it('should update both name and description', async () => {
    const { collection } = await createTestData();

    // Add small delay to ensure updated_at timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1));

    const updateInput: UpdateCollectionInput = {
      id: collection.id,
      name: 'Completely New Name',
      description: 'Completely new description'
    };

    const result = await updateCollection(updateInput);

    // Verify both fields were updated
    expect(result.id).toEqual(collection.id);
    expect(result.user_id).toEqual(collection.user_id);
    expect(result.name).toEqual('Completely New Name');
    expect(result.description).toEqual('Completely new description');
    expect(result.created_at).toEqual(collection.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > collection.updated_at).toBe(true);
  });

  it('should set description to null', async () => {
    const { collection } = await createTestData();

    // Add small delay to ensure updated_at timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1));

    const updateInput: UpdateCollectionInput = {
      id: collection.id,
      description: null
    };

    const result = await updateCollection(updateInput);

    // Verify description was set to null
    expect(result.description).toBeNull();
    expect(result.name).toEqual('Original Collection'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > collection.updated_at).toBe(true);
  });

  it('should save updated collection to database', async () => {
    const { collection } = await createTestData();

    // Add small delay to ensure updated_at timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1));

    const updateInput: UpdateCollectionInput = {
      id: collection.id,
      name: 'Database Test Collection',
      description: 'Testing database persistence'
    };

    await updateCollection(updateInput);

    // Query the database to verify the update was persisted
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collection.id))
      .execute();

    expect(collections).toHaveLength(1);
    expect(collections[0].name).toEqual('Database Test Collection');
    expect(collections[0].description).toEqual('Testing database persistence');
    expect(collections[0].updated_at).toBeInstanceOf(Date);
    expect(collections[0].updated_at > collection.updated_at).toBe(true);
  });

  it('should throw error when collection does not exist', async () => {
    const updateInput: UpdateCollectionInput = {
      id: 99999, // Non-existent ID
      name: 'This should fail'
    };

    await expect(updateCollection(updateInput)).rejects.toThrow(/Collection with id 99999 not found/i);
  });

  it('should handle empty updates gracefully', async () => {
    const { collection } = await createTestData();

    // Add small delay to ensure updated_at timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1));

    // Update with only ID (no name or description changes)
    const updateInput: UpdateCollectionInput = {
      id: collection.id
    };

    const result = await updateCollection(updateInput);

    // Should only update the updated_at timestamp
    expect(result.id).toEqual(collection.id);
    expect(result.name).toEqual('Original Collection');
    expect(result.description).toEqual('Original description');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > collection.updated_at).toBe(true);
  });

  it('should handle collection with null description originally', async () => {
    const { user } = await createTestData();

    // Create collection with null description
    const nullDescCollection = await db.insert(collectionsTable)
      .values({
        user_id: user.id,
        name: 'Null Desc Collection',
        description: null
      })
      .returning()
      .execute();

    const updateInput: UpdateCollectionInput = {
      id: nullDescCollection[0].id,
      name: 'Updated Null Collection',
      description: 'Now has description'
    };

    const result = await updateCollection(updateInput);

    expect(result.name).toEqual('Updated Null Collection');
    expect(result.description).toEqual('Now has description');
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
