import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable } from '../db/schema';
import { type UpdateCollectionInput } from '../schema';
import { updateCollection } from '../handlers/update_collection';
import { eq } from 'drizzle-orm';

describe('updateCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testCollectionId: number;

  beforeEach(async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;

    // Create a test collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        user_id: testUserId,
        name: 'Original Collection',
        description: 'Original description'
      })
      .returning()
      .execute();
    
    testCollectionId = collectionResult[0].id;
  });

  it('should update collection name', async () => {
    const input: UpdateCollectionInput = {
      id: testCollectionId,
      name: 'Updated Collection Name'
    };

    const result = await updateCollection(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testCollectionId);
    expect(result!.name).toEqual('Updated Collection Name');
    expect(result!.description).toEqual('Original description'); // Should remain unchanged
    expect(result!.user_id).toEqual(testUserId);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update collection description', async () => {
    const input: UpdateCollectionInput = {
      id: testCollectionId,
      description: 'Updated description'
    };

    const result = await updateCollection(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testCollectionId);
    expect(result!.name).toEqual('Original Collection'); // Should remain unchanged
    expect(result!.description).toEqual('Updated description');
    expect(result!.user_id).toEqual(testUserId);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update both name and description', async () => {
    const input: UpdateCollectionInput = {
      id: testCollectionId,
      name: 'New Collection Name',
      description: 'New description'
    };

    const result = await updateCollection(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testCollectionId);
    expect(result!.name).toEqual('New Collection Name');
    expect(result!.description).toEqual('New description');
    expect(result!.user_id).toEqual(testUserId);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should set description to null when explicitly provided', async () => {
    const input: UpdateCollectionInput = {
      id: testCollectionId,
      description: null
    };

    const result = await updateCollection(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testCollectionId);
    expect(result!.name).toEqual('Original Collection'); // Should remain unchanged
    expect(result!.description).toBeNull();
    expect(result!.user_id).toEqual(testUserId);
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamp
    const originalCollection = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, testCollectionId))
      .execute();

    const originalUpdatedAt = originalCollection[0].updated_at;

    // Wait a brief moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateCollectionInput = {
      id: testCollectionId,
      name: 'Updated Name'
    };

    const result = await updateCollection(input);

    expect(result).not.toBeNull();
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should persist changes to database', async () => {
    const input: UpdateCollectionInput = {
      id: testCollectionId,
      name: 'Persisted Name',
      description: 'Persisted description'
    };

    await updateCollection(input);

    // Verify changes were saved
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, testCollectionId))
      .execute();

    expect(collections).toHaveLength(1);
    expect(collections[0].name).toEqual('Persisted Name');
    expect(collections[0].description).toEqual('Persisted description');
    expect(collections[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent collection', async () => {
    const input: UpdateCollectionInput = {
      id: 99999, // Non-existent ID
      name: 'New Name'
    };

    const result = await updateCollection(input);

    expect(result).toBeNull();
  });

  it('should handle partial updates correctly', async () => {
    // Update only name
    const nameOnlyInput: UpdateCollectionInput = {
      id: testCollectionId,
      name: 'Name Only Update'
    };

    const nameResult = await updateCollection(nameOnlyInput);

    expect(nameResult!.name).toEqual('Name Only Update');
    expect(nameResult!.description).toEqual('Original description');

    // Update only description
    const descriptionOnlyInput: UpdateCollectionInput = {
      id: testCollectionId,
      description: 'Description Only Update'
    };

    const descriptionResult = await updateCollection(descriptionOnlyInput);

    expect(descriptionResult!.name).toEqual('Name Only Update'); // Should retain previous update
    expect(descriptionResult!.description).toEqual('Description Only Update');
  });

  it('should handle empty string updates', async () => {
    const input: UpdateCollectionInput = {
      id: testCollectionId,
      name: '', // Empty string should be allowed (validation happens at schema level)
      description: ''
    };

    const result = await updateCollection(input);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('');
    expect(result!.description).toEqual('');
  });
});
