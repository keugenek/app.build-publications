import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, bookmarksTable, collectionsTable, bookmarkCollectionsTable } from '../db/schema';
import { type AddBookmarkToCollectionInput } from '../schema';
import { addBookmarkToCollection } from '../handlers/add_bookmark_to_collection';
import { eq } from 'drizzle-orm';

describe('addBookmarkToCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should add a bookmark to a collection', async () => {
    // First create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a bookmark
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        user_id: userId,
        url: 'https://example.com',
        title: 'Example Bookmark',
        description: 'An example bookmark for testing'
      })
      .returning()
      .execute();
    
    const bookmarkId = bookmarkResult[0].id;

    // Create a collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'Test Collection',
        description: 'A test collection'
      })
      .returning()
      .execute();
    
    const collectionId = collectionResult[0].id;

    // Test input
    const testInput: AddBookmarkToCollectionInput = {
      bookmark_id: bookmarkId,
      collection_id: collectionId
    };

    // Add bookmark to collection
    const result = await addBookmarkToCollection(testInput);

    // Validate the result
    expect(result.bookmark_id).toEqual(bookmarkId);
    expect(result.collection_id).toEqual(collectionId);
  });

  it('should save the bookmark-collection relationship to database', async () => {
    // First create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a bookmark
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        user_id: userId,
        url: 'https://example.com',
        title: 'Example Bookmark',
        description: 'An example bookmark for testing'
      })
      .returning()
      .execute();
    
    const bookmarkId = bookmarkResult[0].id;

    // Create a collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'Test Collection',
        description: 'A test collection'
      })
      .returning()
      .execute();
    
    const collectionId = collectionResult[0].id;

    // Test input
    const testInput: AddBookmarkToCollectionInput = {
      bookmark_id: bookmarkId,
      collection_id: collectionId
    };

    // Add bookmark to collection
    await addBookmarkToCollection(testInput);

    // Query the database to verify the relationship was saved
    const relationships = await db.select()
      .from(bookmarkCollectionsTable)
      .where(
        eq(bookmarkCollectionsTable.bookmark_id, bookmarkId)
      )
      .execute();

    expect(relationships).toHaveLength(1);
    expect(relationships[0].bookmark_id).toEqual(bookmarkId);
    expect(relationships[0].collection_id).toEqual(collectionId);
  });

  it('should throw an error when trying to add a non-existent bookmark to a collection', async () => {
    // First create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'Test Collection',
        description: 'A test collection'
      })
      .returning()
      .execute();
    
    const collectionId = collectionResult[0].id;

    // Test input with a non-existent bookmark ID
    const testInput: AddBookmarkToCollectionInput = {
      bookmark_id: 99999, // Non-existent bookmark
      collection_id: collectionId
    };

    // This should throw a foreign key constraint error
    await expect(addBookmarkToCollection(testInput)).rejects.toThrow(/foreign key constraint/i);
  });
});
