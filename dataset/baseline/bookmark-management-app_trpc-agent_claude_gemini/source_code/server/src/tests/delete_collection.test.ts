import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, bookmarksTable } from '../db/schema';
import { deleteCollection } from '../handlers/delete_collection';
import { eq } from 'drizzle-orm';

describe('deleteCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a collection owned by the user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        name: 'Test Collection',
        description: 'A collection for testing',
        user_id: userId
      })
      .returning()
      .execute();

    const collectionId = collectionResult[0].id;

    // Delete the collection
    const result = await deleteCollection(collectionId, userId);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify collection no longer exists in database
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collectionId))
      .execute();

    expect(collections).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent collection', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Try to delete non-existent collection
    const result = await deleteCollection(99999, userId);

    expect(result).toBe(false);
  });

  it('should return false when trying to delete collection owned by different user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashedpassword1'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hashedpassword2'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create collection owned by user1
    const collectionResult = await db.insert(collectionsTable)
      .values({
        name: 'User1 Collection',
        description: 'A collection owned by user1',
        user_id: user1Id
      })
      .returning()
      .execute();

    const collectionId = collectionResult[0].id;

    // Try to delete collection as user2 (should fail)
    const result = await deleteCollection(collectionId, user2Id);

    expect(result).toBe(false);

    // Verify collection still exists
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collectionId))
      .execute();

    expect(collections).toHaveLength(1);
    expect(collections[0].user_id).toBe(user1Id);
  });

  it('should cascade delete and set bookmarks collection_id to null', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        name: 'Test Collection',
        description: 'A collection for testing',
        user_id: userId
      })
      .returning()
      .execute();

    const collectionId = collectionResult[0].id;

    // Create bookmark associated with the collection
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'A test bookmark',
        user_id: userId,
        collection_id: collectionId
      })
      .returning()
      .execute();

    const bookmarkId = bookmarkResult[0].id;

    // Delete the collection
    const result = await deleteCollection(collectionId, userId);

    expect(result).toBe(true);

    // Verify bookmark still exists but collection_id is now null
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmarkId))
      .execute();

    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].collection_id).toBeNull();
  });

  it('should handle multiple collections for same user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create multiple collections
    const collection1Result = await db.insert(collectionsTable)
      .values({
        name: 'Collection 1',
        description: 'First collection',
        user_id: userId
      })
      .returning()
      .execute();

    const collection2Result = await db.insert(collectionsTable)
      .values({
        name: 'Collection 2',
        description: 'Second collection',
        user_id: userId
      })
      .returning()
      .execute();

    const collection1Id = collection1Result[0].id;
    const collection2Id = collection2Result[0].id;

    // Delete only the first collection
    const result = await deleteCollection(collection1Id, userId);

    expect(result).toBe(true);

    // Verify only first collection was deleted
    const remainingCollections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.user_id, userId))
      .execute();

    expect(remainingCollections).toHaveLength(1);
    expect(remainingCollections[0].id).toBe(collection2Id);
    expect(remainingCollections[0].name).toBe('Collection 2');
  });
});
