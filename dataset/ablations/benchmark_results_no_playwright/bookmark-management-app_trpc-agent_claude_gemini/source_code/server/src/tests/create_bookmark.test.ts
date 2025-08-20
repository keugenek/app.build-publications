import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type CreateBookmarkInput } from '../schema';
import { createBookmark } from '../handlers/create_bookmark';
import { eq } from 'drizzle-orm';

// Test data setup
let testUserId: number;
let testCollectionId: number;
let testTagId1: number;
let testTagId2: number;

const basicBookmarkInput: CreateBookmarkInput = {
  user_id: 0, // Will be set in beforeEach
  title: 'Test Bookmark',
  url: 'https://example.com',
  description: 'A test bookmark',
};

describe('createBookmark', () => {
  beforeEach(async () => {
    await createDB();

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
        user_id: testUserId,
        name: 'Test Collection',
        description: 'A test collection'
      })
      .returning()
      .execute();
    testCollectionId = collectionResult[0].id;

    // Create test tags
    const tagResult1 = await db.insert(tagsTable)
      .values({
        user_id: testUserId,
        name: 'Test Tag 1',
        color: '#FF0000'
      })
      .returning()
      .execute();
    testTagId1 = tagResult1[0].id;

    const tagResult2 = await db.insert(tagsTable)
      .values({
        user_id: testUserId,
        name: 'Test Tag 2',
        color: '#00FF00'
      })
      .returning()
      .execute();
    testTagId2 = tagResult2[0].id;

    // Update the test input with the actual user ID
    basicBookmarkInput.user_id = testUserId;
  });

  afterEach(resetDB);

  it('should create a bookmark with basic fields', async () => {
    const result = await createBookmark(basicBookmarkInput);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUserId);
    expect(result.title).toEqual('Test Bookmark');
    expect(result.url).toEqual('https://example.com');
    expect(result.description).toEqual('A test bookmark');
    expect(result.collection_id).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save bookmark to database', async () => {
    const result = await createBookmark(basicBookmarkInput);

    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, result.id))
      .execute();

    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].title).toEqual('Test Bookmark');
    expect(bookmarks[0].url).toEqual('https://example.com');
    expect(bookmarks[0].description).toEqual('A test bookmark');
    expect(bookmarks[0].user_id).toEqual(testUserId);
    expect(bookmarks[0].collection_id).toBeNull();
  });

  it('should create bookmark with collection', async () => {
    const inputWithCollection: CreateBookmarkInput = {
      ...basicBookmarkInput,
      collection_id: testCollectionId
    };

    const result = await createBookmark(inputWithCollection);

    expect(result.collection_id).toEqual(testCollectionId);

    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, result.id))
      .execute();

    expect(bookmarks[0].collection_id).toEqual(testCollectionId);
  });

  it('should create bookmark with single tag', async () => {
    const inputWithTag: CreateBookmarkInput = {
      ...basicBookmarkInput,
      tag_ids: [testTagId1]
    };

    const result = await createBookmark(inputWithTag);

    // Verify bookmark was created
    expect(result.id).toBeDefined();

    // Verify tag relationship was created
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, result.id))
      .execute();

    expect(bookmarkTags).toHaveLength(1);
    expect(bookmarkTags[0].tag_id).toEqual(testTagId1);
    expect(bookmarkTags[0].created_at).toBeInstanceOf(Date);
  });

  it('should create bookmark with multiple tags', async () => {
    const inputWithTags: CreateBookmarkInput = {
      ...basicBookmarkInput,
      tag_ids: [testTagId1, testTagId2]
    };

    const result = await createBookmark(inputWithTags);

    // Verify tag relationships were created
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, result.id))
      .execute();

    expect(bookmarkTags).toHaveLength(2);
    
    const tagIds = bookmarkTags.map(bt => bt.tag_id).sort();
    expect(tagIds).toEqual([testTagId1, testTagId2].sort());

    // Verify each relationship has proper timestamp
    bookmarkTags.forEach(bt => {
      expect(bt.created_at).toBeInstanceOf(Date);
      expect(bt.bookmark_id).toEqual(result.id);
    });
  });

  it('should create bookmark with collection and tags', async () => {
    const inputWithAll: CreateBookmarkInput = {
      ...basicBookmarkInput,
      collection_id: testCollectionId,
      tag_ids: [testTagId1, testTagId2]
    };

    const result = await createBookmark(inputWithAll);

    // Verify bookmark has collection
    expect(result.collection_id).toEqual(testCollectionId);

    // Verify tag relationships were created
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, result.id))
      .execute();

    expect(bookmarkTags).toHaveLength(2);
  });

  it('should create bookmark without optional fields', async () => {
    const minimalInput: CreateBookmarkInput = {
      user_id: testUserId,
      title: 'Minimal Bookmark',
      url: 'https://minimal.com'
      // No description, collection_id, or tag_ids
    };

    const result = await createBookmark(minimalInput);

    expect(result.description).toBeNull();
    expect(result.collection_id).toBeNull();

    // Verify no tag relationships were created
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, result.id))
      .execute();

    expect(bookmarkTags).toHaveLength(0);
  });

  it('should handle empty tag array', async () => {
    const inputWithEmptyTags: CreateBookmarkInput = {
      ...basicBookmarkInput,
      tag_ids: []
    };

    const result = await createBookmark(inputWithEmptyTags);

    // Verify no tag relationships were created
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, result.id))
      .execute();

    expect(bookmarkTags).toHaveLength(0);
  });

  it('should throw error for invalid user_id', async () => {
    const invalidInput: CreateBookmarkInput = {
      ...basicBookmarkInput,
      user_id: 99999 // Non-existent user ID
    };

    await expect(createBookmark(invalidInput)).rejects.toThrow(/foreign key constraint/i);
  });

  it('should throw error for invalid collection_id', async () => {
    const invalidInput: CreateBookmarkInput = {
      ...basicBookmarkInput,
      collection_id: 99999 // Non-existent collection ID
    };

    await expect(createBookmark(invalidInput)).rejects.toThrow(/foreign key constraint/i);
  });

  it('should throw error for invalid tag_id', async () => {
    const invalidInput: CreateBookmarkInput = {
      ...basicBookmarkInput,
      tag_ids: [99999] // Non-existent tag ID
    };

    await expect(createBookmark(invalidInput)).rejects.toThrow(/foreign key constraint/i);
  });
});
