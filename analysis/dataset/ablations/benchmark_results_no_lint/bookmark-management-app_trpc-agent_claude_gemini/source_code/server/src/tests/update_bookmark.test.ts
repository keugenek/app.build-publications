import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type UpdateBookmarkInput } from '../schema';
import { updateBookmark } from '../handlers/update_bookmark';
import { eq } from 'drizzle-orm';

describe('updateBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup
  let testUserId: number;
  let testCollectionId: number;
  let testTagIds: number[];
  let testBookmarkId: number;

  const setupTestData = async () => {
    // Create test user
    const userResults = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser'
      })
      .returning()
      .execute();
    testUserId = userResults[0].id;

    // Create test collection
    const collectionResults = await db.insert(collectionsTable)
      .values({
        name: 'Test Collection',
        description: 'A collection for testing',
        user_id: testUserId
      })
      .returning()
      .execute();
    testCollectionId = collectionResults[0].id;

    // Create test tags
    const tag1Results = await db.insert(tagsTable)
      .values({
        name: 'JavaScript',
        color: '#f7df1e',
        user_id: testUserId
      })
      .returning()
      .execute();

    const tag2Results = await db.insert(tagsTable)
      .values({
        name: 'React',
        color: '#61dafb',
        user_id: testUserId
      })
      .returning()
      .execute();

    testTagIds = [tag1Results[0].id, tag2Results[0].id];

    // Create test bookmark
    const bookmarkResults = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'Original Title',
        description: 'Original description',
        user_id: testUserId,
        collection_id: testCollectionId
      })
      .returning()
      .execute();
    testBookmarkId = bookmarkResults[0].id;

    // Add initial tag association
    await db.insert(bookmarkTagsTable)
      .values({
        bookmark_id: testBookmarkId,
        tag_id: testTagIds[0]
      })
      .execute();
  };

  it('should update basic bookmark fields', async () => {
    await setupTestData();

    const updateInput: UpdateBookmarkInput = {
      id: testBookmarkId,
      url: 'https://updated.com',
      title: 'Updated Title',
      description: 'Updated description'
    };

    const result = await updateBookmark(updateInput);

    expect(result.id).toEqual(testBookmarkId);
    expect(result.url).toEqual('https://updated.com');
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated description');
    expect(result.user_id).toEqual(testUserId);
    expect(result.collection_id).toEqual(testCollectionId);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify in database
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, testBookmarkId))
      .execute();

    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].url).toEqual('https://updated.com');
    expect(bookmarks[0].title).toEqual('Updated Title');
    expect(bookmarks[0].description).toEqual('Updated description');
  });

  it('should update only provided fields', async () => {
    await setupTestData();

    const updateInput: UpdateBookmarkInput = {
      id: testBookmarkId,
      title: 'Only Title Updated'
    };

    const result = await updateBookmark(updateInput);

    expect(result.id).toEqual(testBookmarkId);
    expect(result.url).toEqual('https://example.com'); // Original value
    expect(result.title).toEqual('Only Title Updated'); // Updated value
    expect(result.description).toEqual('Original description'); // Original value
    expect(result.user_id).toEqual(testUserId);
  });

  it('should update collection association', async () => {
    await setupTestData();

    // Create another collection
    const newCollectionResults = await db.insert(collectionsTable)
      .values({
        name: 'New Collection',
        description: 'Another collection',
        user_id: testUserId
      })
      .returning()
      .execute();

    const updateInput: UpdateBookmarkInput = {
      id: testBookmarkId,
      collection_id: newCollectionResults[0].id
    };

    const result = await updateBookmark(updateInput);

    expect(result.collection_id).toEqual(newCollectionResults[0].id);
    expect(result.collection_name).toEqual('New Collection');
  });

  it('should remove collection association when set to null', async () => {
    await setupTestData();

    const updateInput: UpdateBookmarkInput = {
      id: testBookmarkId,
      collection_id: null
    };

    const result = await updateBookmark(updateInput);

    expect(result.collection_id).toBeNull();
    expect(result.collection_name).toBeNull();
  });

  it('should update tag associations', async () => {
    await setupTestData();

    const updateInput: UpdateBookmarkInput = {
      id: testBookmarkId,
      tag_ids: [testTagIds[1]] // Change from first tag to second tag
    };

    const result = await updateBookmark(updateInput);

    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].id).toEqual(testTagIds[1]);
    expect(result.tags[0].name).toEqual('React');
    expect(result.tags[0].color).toEqual('#61dafb');

    // Verify in database
    const tagAssociations = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, testBookmarkId))
      .execute();

    expect(tagAssociations).toHaveLength(1);
    expect(tagAssociations[0].tag_id).toEqual(testTagIds[1]);
  });

  it('should remove all tag associations when empty array provided', async () => {
    await setupTestData();

    const updateInput: UpdateBookmarkInput = {
      id: testBookmarkId,
      tag_ids: []
    };

    const result = await updateBookmark(updateInput);

    expect(result.tags).toHaveLength(0);

    // Verify in database
    const tagAssociations = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, testBookmarkId))
      .execute();

    expect(tagAssociations).toHaveLength(0);
  });

  it('should add multiple tag associations', async () => {
    await setupTestData();

    // First remove existing tag associations
    await db.delete(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, testBookmarkId))
      .execute();

    const updateInput: UpdateBookmarkInput = {
      id: testBookmarkId,
      tag_ids: testTagIds // Both tags
    };

    const result = await updateBookmark(updateInput);

    expect(result.tags).toHaveLength(2);
    const tagNames = result.tags.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['JavaScript', 'React']);

    // Verify in database
    const tagAssociations = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, testBookmarkId))
      .execute();

    expect(tagAssociations).toHaveLength(2);
  });

  it('should preserve existing tag associations when tag_ids not provided', async () => {
    await setupTestData();

    const updateInput: UpdateBookmarkInput = {
      id: testBookmarkId,
      title: 'Updated Title'
      // No tag_ids provided
    };

    const result = await updateBookmark(updateInput);

    // Should still have the original tag
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].name).toEqual('JavaScript');
  });

  it('should handle description set to null', async () => {
    await setupTestData();

    const updateInput: UpdateBookmarkInput = {
      id: testBookmarkId,
      description: null
    };

    const result = await updateBookmark(updateInput);

    expect(result.description).toBeNull();

    // Verify in database
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, testBookmarkId))
      .execute();

    expect(bookmarks[0].description).toBeNull();
  });

  it('should throw error when bookmark does not exist', async () => {
    await setupTestData();

    const updateInput: UpdateBookmarkInput = {
      id: 99999,
      title: 'This should fail'
    };

    await expect(updateBookmark(updateInput)).rejects.toThrow(/Bookmark with id 99999 not found/i);
  });

  it('should return bookmark with associated data structure', async () => {
    await setupTestData();

    const updateInput: UpdateBookmarkInput = {
      id: testBookmarkId,
      title: 'Updated with data'
    };

    const result = await updateBookmark(updateInput);

    // Verify complete data structure
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('user_id');
    expect(result).toHaveProperty('collection_id');
    expect(result).toHaveProperty('collection_name');
    expect(result).toHaveProperty('tags');
    expect(result).toHaveProperty('created_at');
    expect(result).toHaveProperty('updated_at');

    expect(Array.isArray(result.tags)).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
