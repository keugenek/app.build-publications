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
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        name: 'Original Collection',
        description: 'Original description',
        user_id: testUserId
      })
      .returning()
      .execute();
    testCollectionId = collectionResult[0].id;
  });

  it('should update collection name only', async () => {
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
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update collection description only', async () => {
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

  it('should set description to null', async () => {
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

  it('should update collection in database', async () => {
    const input: UpdateCollectionInput = {
      id: testCollectionId,
      name: 'Database Updated Name',
      description: 'Database updated description'
    };

    const result = await updateCollection(input);

    // Verify the update persisted in database
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, testCollectionId))
      .execute();

    expect(collections).toHaveLength(1);
    expect(collections[0].name).toEqual('Database Updated Name');
    expect(collections[0].description).toEqual('Database updated description');
    expect(collections[0].updated_at).toBeInstanceOf(Date);
    
    // Verify updated_at was actually updated
    expect(collections[0].updated_at.getTime()).toBeGreaterThan(collections[0].created_at.getTime());
  });

  it('should return null for non-existent collection', async () => {
    const input: UpdateCollectionInput = {
      id: 99999, // Non-existent ID
      name: 'Should not update'
    };

    const result = await updateCollection(input);

    expect(result).toBeNull();
  });

  it('should handle empty update (only updating timestamp)', async () => {
    const input: UpdateCollectionInput = {
      id: testCollectionId
    };

    const result = await updateCollection(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testCollectionId);
    expect(result!.name).toEqual('Original Collection'); // Should remain unchanged
    expect(result!.description).toEqual('Original description'); // Should remain unchanged
    expect(result!.user_id).toEqual(testUserId);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle collection with null description initially', async () => {
    // Create collection with null description
    const collectionResult = await db.insert(collectionsTable)
      .values({
        name: 'Null Description Collection',
        description: null,
        user_id: testUserId
      })
      .returning()
      .execute();
    
    const nullDescCollectionId = collectionResult[0].id;

    const input: UpdateCollectionInput = {
      id: nullDescCollectionId,
      name: 'Updated Null Collection',
      description: 'Now has description'
    };

    const result = await updateCollection(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(nullDescCollectionId);
    expect(result!.name).toEqual('Updated Null Collection');
    expect(result!.description).toEqual('Now has description');
    expect(result!.user_id).toEqual(testUserId);
  });
});
