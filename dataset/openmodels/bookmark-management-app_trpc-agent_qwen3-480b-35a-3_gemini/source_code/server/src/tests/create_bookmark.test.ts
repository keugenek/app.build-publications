import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookmarksTable, tagsTable, collectionsTable, bookmarkTagsTable, bookmarkCollectionsTable } from '../db/schema';
import { type CreateBookmarkInput } from '../schema';
import { createBookmark } from '../handlers/create_bookmark';
import { eq } from 'drizzle-orm';

// Test user ID (matching the default in the handler)
const TEST_USER_ID = 1;

// Simple test input
const testInput: CreateBookmarkInput = {
  url: 'https://example.com',
  title: 'Test Bookmark',
  description: 'A bookmark for testing',
};

describe('createBookmark', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test user since bookmarks require a user_id
    await db.execute(`INSERT INTO users (id, email, password_hash) VALUES (1, 'test@example.com', 'hash')`);
  });
  afterEach(resetDB);

  it('should create a bookmark', async () => {
    const result = await createBookmark(testInput);

    // Basic field validation
    expect(result.url).toEqual('https://example.com');
    expect(result.title).toEqual('Test Bookmark');
    expect(result.description).toEqual('A bookmark for testing');
    expect(result.user_id).toEqual(TEST_USER_ID);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save bookmark to database', async () => {
    const result = await createBookmark(testInput);

    // Query using proper drizzle syntax
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, result.id))
      .execute();

    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].url).toEqual('https://example.com');
    expect(bookmarks[0].title).toEqual('Test Bookmark');
    expect(bookmarks[0].description).toEqual('A bookmark for testing');
    expect(bookmarks[0].user_id).toEqual(TEST_USER_ID);
  });

  it('should create bookmark with tag associations', async () => {
    // First create a tag for the user
    const tagResult = await db.insert(tagsTable)
      .values({
        user_id: TEST_USER_ID,
        name: 'Test Tag'
      })
      .returning()
      .execute();

    const tagId = tagResult[0].id;

    const inputWithTags: CreateBookmarkInput = {
      ...testInput,
      tagIds: [tagId]
    };

    const result = await createBookmark(inputWithTags);

    // Verify the bookmark was created
    expect(result.id).toBeDefined();

    // Check that the bookmark-tag association was created
    const associations = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, result.id))
      .execute();

    expect(associations).toHaveLength(1);
    expect(associations[0].tag_id).toEqual(tagId);
  });

  it('should create bookmark with collection associations', async () => {
    // First create a collection for the user
    const collectionResult = await db.insert(collectionsTable)
      .values({
        user_id: TEST_USER_ID,
        name: 'Test Collection',
        description: 'A test collection'
      })
      .returning()
      .execute();

    const collectionId = collectionResult[0].id;

    const inputWithCollections: CreateBookmarkInput = {
      ...testInput,
      collectionIds: [collectionId]
    };

    const result = await createBookmark(inputWithCollections);

    // Verify the bookmark was created
    expect(result.id).toBeDefined();

    // Check that the bookmark-collection association was created
    const associations = await db.select()
      .from(bookmarkCollectionsTable)
      .where(eq(bookmarkCollectionsTable.bookmark_id, result.id))
      .execute();

    expect(associations).toHaveLength(1);
    expect(associations[0].collection_id).toEqual(collectionId);
  });

  it('should handle multiple tag and collection associations', async () => {
    // Create multiple tags
    const tagResults = await Promise.all([
      db.insert(tagsTable)
        .values({ user_id: TEST_USER_ID, name: 'Tag 1' })
        .returning()
        .execute(),
      db.insert(tagsTable)
        .values({ user_id: TEST_USER_ID, name: 'Tag 2' })
        .returning()
        .execute()
    ]);

    const tagIds = tagResults.map(result => result[0].id);

    // Create multiple collections
    const collectionResults = await Promise.all([
      db.insert(collectionsTable)
        .values({ user_id: TEST_USER_ID, name: 'Collection 1', description: 'First collection' })
        .returning()
        .execute(),
      db.insert(collectionsTable)
        .values({ user_id: TEST_USER_ID, name: 'Collection 2', description: 'Second collection' })
        .returning()
        .execute()
    ]);

    const collectionIds = collectionResults.map(result => result[0].id);

    const inputWithMultipleAssociations: CreateBookmarkInput = {
      ...testInput,
      tagIds: tagIds,
      collectionIds: collectionIds
    };

    const result = await createBookmark(inputWithMultipleAssociations);

    // Check tag associations
    const tagAssociations = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, result.id))
      .execute();

    expect(tagAssociations).toHaveLength(2);
    expect(tagAssociations.map(a => a.tag_id)).toEqual(expect.arrayContaining(tagIds));

    // Check collection associations
    const collectionAssociations = await db.select()
      .from(bookmarkCollectionsTable)
      .where(eq(bookmarkCollectionsTable.bookmark_id, result.id))
      .execute();

    expect(collectionAssociations).toHaveLength(2);
    expect(collectionAssociations.map(a => a.collection_id)).toEqual(expect.arrayContaining(collectionIds));
  });
});
