import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, bookmarksTable } from '../db/schema';
import { deleteCollection } from '../handlers/delete_collection';
import { eq } from 'drizzle-orm';

describe('deleteCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a collection successfully', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'Test Collection',
        description: 'A test collection'
      })
      .returning()
      .execute();
    
    const collectionId = collectionResult[0].id;

    // Delete the collection
    const result = await deleteCollection(collectionId, userId);
    expect(result).toBe(true);

    // Verify collection was deleted
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collectionId))
      .execute();
    
    expect(collections).toHaveLength(0);
  });

  it('should return false for non-existent collection', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Try to delete non-existent collection
    const result = await deleteCollection(999, userId);
    expect(result).toBe(false);
  });

  it('should return false when trying to delete another users collection', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword',
        display_name: 'User One'
      })
      .returning()
      .execute();
    
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword',
        display_name: 'User Two'
      })
      .returning()
      .execute();
    
    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create collection for user1
    const collectionResult = await db.insert(collectionsTable)
      .values({
        user_id: user1Id,
        name: 'User 1 Collection',
        description: 'Belongs to user 1'
      })
      .returning()
      .execute();
    
    const collectionId = collectionResult[0].id;

    // Try to delete user1's collection as user2
    const result = await deleteCollection(collectionId, user2Id);
    expect(result).toBe(false);

    // Verify collection still exists
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collectionId))
      .execute();
    
    expect(collections).toHaveLength(1);
  });

  it('should set bookmarks collection_id to null when deleting collection', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'Test Collection',
        description: 'A test collection'
      })
      .returning()
      .execute();
    
    const collectionId = collectionResult[0].id;

    // Create bookmarks in the collection
    await db.insert(bookmarksTable)
      .values([
        {
          user_id: userId,
          collection_id: collectionId,
          url: 'https://example1.com',
          title: 'Example 1',
          description: 'First bookmark'
        },
        {
          user_id: userId,
          collection_id: collectionId,
          url: 'https://example2.com',
          title: 'Example 2',
          description: 'Second bookmark'
        }
      ])
      .execute();

    // Verify bookmarks are in the collection initially
    const bookmarksBeforeDelete = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.collection_id, collectionId))
      .execute();
    
    expect(bookmarksBeforeDelete).toHaveLength(2);

    // Delete the collection
    const result = await deleteCollection(collectionId, userId);
    expect(result).toBe(true);

    // Verify collection was deleted
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collectionId))
      .execute();
    
    expect(collections).toHaveLength(0);

    // Verify bookmarks still exist but with null collection_id
    const bookmarksAfterDelete = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.user_id, userId))
      .execute();
    
    expect(bookmarksAfterDelete).toHaveLength(2);
    expect(bookmarksAfterDelete[0].collection_id).toBeNull();
    expect(bookmarksAfterDelete[1].collection_id).toBeNull();
  });

  it('should handle deletion of collection with no bookmarks', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create empty collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'Empty Collection',
        description: null
      })
      .returning()
      .execute();
    
    const collectionId = collectionResult[0].id;

    // Delete the empty collection
    const result = await deleteCollection(collectionId, userId);
    expect(result).toBe(true);

    // Verify collection was deleted
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collectionId))
      .execute();
    
    expect(collections).toHaveLength(0);
  });

  it('should only affect bookmarks in the deleted collection', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create two collections
    const collection1Result = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'Collection 1',
        description: 'First collection'
      })
      .returning()
      .execute();
    
    const collection2Result = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'Collection 2',
        description: 'Second collection'
      })
      .returning()
      .execute();
    
    const collection1Id = collection1Result[0].id;
    const collection2Id = collection2Result[0].id;

    // Create bookmarks in both collections
    await db.insert(bookmarksTable)
      .values([
        {
          user_id: userId,
          collection_id: collection1Id,
          url: 'https://example1.com',
          title: 'Bookmark 1',
          description: 'In collection 1'
        },
        {
          user_id: userId,
          collection_id: collection2Id,
          url: 'https://example2.com',
          title: 'Bookmark 2',
          description: 'In collection 2'
        }
      ])
      .execute();

    // Delete first collection
    const result = await deleteCollection(collection1Id, userId);
    expect(result).toBe(true);

    // Verify first collection was deleted
    const collection1Check = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collection1Id))
      .execute();
    
    expect(collection1Check).toHaveLength(0);

    // Verify second collection still exists
    const collection2Check = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collection2Id))
      .execute();
    
    expect(collection2Check).toHaveLength(1);

    // Verify bookmark from first collection has null collection_id
    const bookmark1 = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.url, 'https://example1.com'))
      .execute();
    
    expect(bookmark1).toHaveLength(1);
    expect(bookmark1[0].collection_id).toBeNull();

    // Verify bookmark from second collection is unchanged
    const bookmark2 = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.url, 'https://example2.com'))
      .execute();
    
    expect(bookmark2).toHaveLength(1);
    expect(bookmark2[0].collection_id).toBe(collection2Id);
  });
});
