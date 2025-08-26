import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, bookmarksTable } from '../db/schema';
import { type DeleteEntityInput, type CreateUserInput, type CreateCollectionInput, type CreateBookmarkInput } from '../schema';
import { deleteCollection } from '../handlers/delete_collection';
import { eq } from 'drizzle-orm';

// Test user data
const testUserInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

// Test collection data
const testCollectionInput: CreateCollectionInput = {
  user_id: 1, // Will be set after user creation
  name: 'Test Collection',
  description: 'A collection for testing'
};

// Test bookmark data
const testBookmarkInput: CreateBookmarkInput = {
  user_id: 1, // Will be set after user creation
  collection_id: 1, // Will be set after collection creation
  title: 'Test Bookmark',
  url: 'https://example.com',
  description: 'A bookmark for testing'
};

describe('deleteCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        username: testUserInput.username,
        email: testUserInput.email,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestCollection = async (userId: number) => {
    const result = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: testCollectionInput.name,
        description: testCollectionInput.description
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestBookmark = async (userId: number, collectionId: number) => {
    const result = await db.insert(bookmarksTable)
      .values({
        user_id: userId,
        collection_id: collectionId,
        title: testBookmarkInput.title,
        url: testBookmarkInput.url,
        description: testBookmarkInput.description
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should delete a collection successfully', async () => {
    // Create test data
    const user = await createTestUser();
    const collection = await createTestCollection(user.id);

    // Delete the collection
    const deleteInput: DeleteEntityInput = { id: collection.id };
    const result = await deleteCollection(deleteInput);

    expect(result.success).toBe(true);

    // Verify collection is deleted
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collection.id))
      .execute();

    expect(collections).toHaveLength(0);
  });

  it('should set collection_id to null for associated bookmarks', async () => {
    // Create test data
    const user = await createTestUser();
    const collection = await createTestCollection(user.id);
    const bookmark = await createTestBookmark(user.id, collection.id);

    // Verify bookmark has collection_id set
    expect(bookmark.collection_id).toBe(collection.id);

    // Delete the collection
    const deleteInput: DeleteEntityInput = { id: collection.id };
    await deleteCollection(deleteInput);

    // Verify bookmark's collection_id is now null
    const updatedBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmark.id))
      .execute();

    expect(updatedBookmarks).toHaveLength(1);
    expect(updatedBookmarks[0].collection_id).toBeNull();
  });

  it('should handle multiple bookmarks in the same collection', async () => {
    // Create test data
    const user = await createTestUser();
    const collection = await createTestCollection(user.id);
    
    // Create multiple bookmarks in the same collection
    const bookmark1 = await createTestBookmark(user.id, collection.id);
    const bookmark2 = await db.insert(bookmarksTable)
      .values({
        user_id: user.id,
        collection_id: collection.id,
        title: 'Second Test Bookmark',
        url: 'https://example2.com',
        description: 'Another bookmark for testing'
      })
      .returning()
      .execute();

    // Delete the collection
    const deleteInput: DeleteEntityInput = { id: collection.id };
    await deleteCollection(deleteInput);

    // Verify both bookmarks have collection_id set to null
    const updatedBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.user_id, user.id))
      .execute();

    expect(updatedBookmarks).toHaveLength(2);
    updatedBookmarks.forEach(bookmark => {
      expect(bookmark.collection_id).toBeNull();
    });
  });

  it('should handle deletion of non-existent collection gracefully', async () => {
    const deleteInput: DeleteEntityInput = { id: 999 };
    
    // Should not throw error even if collection doesn't exist
    const result = await deleteCollection(deleteInput);
    expect(result.success).toBe(true);
  });

  it('should not affect bookmarks in other collections', async () => {
    // Create test data
    const user = await createTestUser();
    const collection1 = await createTestCollection(user.id);
    const collection2 = await db.insert(collectionsTable)
      .values({
        user_id: user.id,
        name: 'Second Collection',
        description: 'Another collection for testing'
      })
      .returning()
      .execute();

    // Create bookmarks in both collections
    await createTestBookmark(user.id, collection1.id);
    const bookmark2 = await db.insert(bookmarksTable)
      .values({
        user_id: user.id,
        collection_id: collection2[0].id,
        title: 'Bookmark in Second Collection',
        url: 'https://example2.com',
        description: 'This should not be affected'
      })
      .returning()
      .execute();

    // Delete only the first collection
    const deleteInput: DeleteEntityInput = { id: collection1.id };
    await deleteCollection(deleteInput);

    // Verify second collection and its bookmark are unaffected
    const remainingCollections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collection2[0].id))
      .execute();

    expect(remainingCollections).toHaveLength(1);

    const remainingBookmark = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmark2[0].id))
      .execute();

    expect(remainingBookmark).toHaveLength(1);
    expect(remainingBookmark[0].collection_id).toBe(collection2[0].id);
  });

  it('should work with collections that have no bookmarks', async () => {
    // Create test data without bookmarks
    const user = await createTestUser();
    const collection = await createTestCollection(user.id);

    // Delete the collection
    const deleteInput: DeleteEntityInput = { id: collection.id };
    const result = await deleteCollection(deleteInput);

    expect(result.success).toBe(true);

    // Verify collection is deleted
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collection.id))
      .execute();

    expect(collections).toHaveLength(0);
  });
});
