import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookmarkCollectionsTable, bookmarksTable, collectionsTable, usersTable } from '../db/schema';
import { type AddBookmarkToCollectionInput } from '../schema';
import { addBookmarkToCollection } from '../handlers/add_bookmark_to_collection';
import { eq, and } from 'drizzle-orm';

describe('addBookmarkToCollection', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a user first (required for foreign key constraints)
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
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
    
    // Create a collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'Test Collection',
        description: 'A test collection'
      })
      .returning()
      .execute();
    
    // Store IDs for use in tests
    (global as any).testData = {
      bookmarkId: bookmarkResult[0].id,
      collectionId: collectionResult[0].id,
      userId: userId
    };
  });
  
  afterEach(async () => {
    await resetDB();
    delete (global as any).testData;
  });

  it('should add a bookmark to a collection', async () => {
    const input: AddBookmarkToCollectionInput = {
      bookmark_id: (global as any).testData.bookmarkId,
      collection_id: (global as any).testData.collectionId
    };

    // This should not throw any error
    await addBookmarkToCollection(input);

    // Verify the relationship was created
    const relations = await db.select()
      .from(bookmarkCollectionsTable)
      .where(
        and(
          eq(bookmarkCollectionsTable.bookmark_id, input.bookmark_id),
          eq(bookmarkCollectionsTable.collection_id, input.collection_id)
        )
      )
      .execute();

    expect(relations).toHaveLength(1);
    expect(relations[0].bookmark_id).toBe(input.bookmark_id);
    expect(relations[0].collection_id).toBe(input.collection_id);
  });

  it('should not throw an error when adding the same bookmark to the same collection twice', async () => {
    const input: AddBookmarkToCollectionInput = {
      bookmark_id: (global as any).testData.bookmarkId,
      collection_id: (global as any).testData.collectionId
    };

    // Add bookmark to collection first time
    await addBookmarkToCollection(input);
    
    // Add bookmark to collection second time (should not throw due to onConflictDoNothing)
    await addBookmarkToCollection(input);

    // Verify only one relationship exists
    const relations = await db.select()
      .from(bookmarkCollectionsTable)
      .where(
        and(
          eq(bookmarkCollectionsTable.bookmark_id, input.bookmark_id),
          eq(bookmarkCollectionsTable.collection_id, input.collection_id)
        )
      )
      .execute();

    expect(relations).toHaveLength(1);
  });

  it('should throw an error when bookmark_id does not exist', async () => {
    const input: AddBookmarkToCollectionInput = {
      bookmark_id: 99999, // Non-existent bookmark
      collection_id: (global as any).testData.collectionId
    };

    await expect(addBookmarkToCollection(input)).rejects.toThrow();
  });

  it('should throw an error when collection_id does not exist', async () => {
    const input: AddBookmarkToCollectionInput = {
      bookmark_id: (global as any).testData.bookmarkId,
      collection_id: 99999 // Non-existent collection
    };

    await expect(addBookmarkToCollection(input)).rejects.toThrow();
  });
});
