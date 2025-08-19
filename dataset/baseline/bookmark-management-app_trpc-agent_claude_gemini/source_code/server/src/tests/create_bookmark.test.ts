import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type CreateBookmarkInput } from '../schema';
import { createBookmark } from '../handlers/create_bookmark';
import { eq, and } from 'drizzle-orm';

describe('createBookmark', () => {
  let testUserId: number;
  let testCollectionId: number;
  let testTagIds: number[];

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        name: 'Test Collection',
        description: 'A collection for testing',
        user_id: testUserId
      })
      .returning()
      .execute();
    testCollectionId = collectionResult[0].id;

    // Create test tags
    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'JavaScript', user_id: testUserId },
        { name: 'React', user_id: testUserId }
      ])
      .returning()
      .execute();
    testTagIds = tagResults.map(tag => tag.id);
  });

  afterEach(resetDB);

  it('should create a bookmark with all fields', async () => {
    const input: CreateBookmarkInput = {
      url: 'https://example.com',
      title: 'Test Bookmark',
      description: 'A bookmark for testing',
      user_id: testUserId,
      collection_id: testCollectionId,
      tag_ids: testTagIds
    };

    const result = await createBookmark(input);

    // Verify basic bookmark fields
    expect(result.id).toBeDefined();
    expect(result.url).toEqual('https://example.com');
    expect(result.title).toEqual('Test Bookmark');
    expect(result.description).toEqual('A bookmark for testing');
    expect(result.user_id).toEqual(testUserId);
    expect(result.collection_id).toEqual(testCollectionId);
    expect(result.collection_name).toEqual('Test Collection');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify tags are included
    expect(result.tags).toHaveLength(2);
    expect(result.tags.map(t => t.name).sort()).toEqual(['JavaScript', 'React']);
  });

  it('should create a bookmark without collection or tags', async () => {
    const input: CreateBookmarkInput = {
      url: 'https://simple.com',
      title: 'Simple Bookmark',
      description: null,
      user_id: testUserId,
      collection_id: null
    };

    const result = await createBookmark(input);

    expect(result.url).toEqual('https://simple.com');
    expect(result.title).toEqual('Simple Bookmark');
    expect(result.description).toBeNull();
    expect(result.user_id).toEqual(testUserId);
    expect(result.collection_id).toBeNull();
    expect(result.collection_name).toBeNull();
    expect(result.tags).toHaveLength(0);
  });

  it('should save bookmark to database', async () => {
    const input: CreateBookmarkInput = {
      url: 'https://database-test.com',
      title: 'Database Test',
      description: 'Testing database persistence',
      user_id: testUserId,
      collection_id: testCollectionId,
      tag_ids: [testTagIds[0]]
    };

    const result = await createBookmark(input);

    // Verify bookmark exists in database
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, result.id))
      .execute();

    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].url).toEqual('https://database-test.com');
    expect(bookmarks[0].title).toEqual('Database Test');
    expect(bookmarks[0].user_id).toEqual(testUserId);

    // Verify bookmark-tag associations
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, result.id))
      .execute();

    expect(bookmarkTags).toHaveLength(1);
    expect(bookmarkTags[0].tag_id).toEqual(testTagIds[0]);
  });

  it('should create multiple bookmarks with same tags', async () => {
    const input1: CreateBookmarkInput = {
      url: 'https://first.com',
      title: 'First Bookmark',
      description: null,
      user_id: testUserId,
      collection_id: null,
      tag_ids: testTagIds
    };

    const input2: CreateBookmarkInput = {
      url: 'https://second.com',
      title: 'Second Bookmark',
      description: null,
      user_id: testUserId,
      collection_id: testCollectionId,
      tag_ids: [testTagIds[0]]
    };

    const result1 = await createBookmark(input1);
    const result2 = await createBookmark(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.tags).toHaveLength(2);
    expect(result2.tags).toHaveLength(1);

    // Verify both bookmarks exist
    const allBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.user_id, testUserId))
      .execute();

    expect(allBookmarks).toHaveLength(2);
  });

  it('should reject invalid collection_id', async () => {
    const input: CreateBookmarkInput = {
      url: 'https://invalid-collection.com',
      title: 'Invalid Collection Test',
      description: null,
      user_id: testUserId,
      collection_id: 99999, // Non-existent collection
      tag_ids: []
    };

    await expect(createBookmark(input)).rejects.toThrow(/collection not found/i);
  });

  it('should reject collection belonging to different user', async () => {
    // Create another user and collection
    const otherUserResult = await db.insert(usersTable)
      .values({
        username: 'otheruser',
        email: 'other@example.com',
        password_hash: 'other_hash'
      })
      .returning()
      .execute();

    const otherCollectionResult = await db.insert(collectionsTable)
      .values({
        name: 'Other Collection',
        user_id: otherUserResult[0].id
      })
      .returning()
      .execute();

    const input: CreateBookmarkInput = {
      url: 'https://wrong-user-collection.com',
      title: 'Wrong User Collection',
      description: null,
      user_id: testUserId,
      collection_id: otherCollectionResult[0].id, // Collection belongs to other user
      tag_ids: []
    };

    await expect(createBookmark(input)).rejects.toThrow(/collection not found/i);
  });

  it('should reject invalid tag_ids', async () => {
    const input: CreateBookmarkInput = {
      url: 'https://invalid-tags.com',
      title: 'Invalid Tags Test',
      description: null,
      user_id: testUserId,
      collection_id: null,
      tag_ids: [99999] // Non-existent tag
    };

    await expect(createBookmark(input)).rejects.toThrow(/tags not found/i);
  });

  it('should reject tags belonging to different user', async () => {
    // Create another user and tag
    const otherUserResult = await db.insert(usersTable)
      .values({
        username: 'otheruser2',
        email: 'other2@example.com',
        password_hash: 'other_hash2'
      })
      .returning()
      .execute();

    const otherTagResult = await db.insert(tagsTable)
      .values({
        name: 'Other Tag',
        user_id: otherUserResult[0].id
      })
      .returning()
      .execute();

    const input: CreateBookmarkInput = {
      url: 'https://wrong-user-tags.com',
      title: 'Wrong User Tags',
      description: null,
      user_id: testUserId,
      collection_id: null,
      tag_ids: [otherTagResult[0].id] // Tag belongs to other user
    };

    await expect(createBookmark(input)).rejects.toThrow(/tags not found/i);
  });

  it('should handle mixed valid and invalid tag_ids', async () => {
    const input: CreateBookmarkInput = {
      url: 'https://mixed-tags.com',
      title: 'Mixed Tags Test',
      description: null,
      user_id: testUserId,
      collection_id: null,
      tag_ids: [testTagIds[0], 99999] // One valid, one invalid
    };

    await expect(createBookmark(input)).rejects.toThrow(/tags not found/i);
  });

  it('should create bookmark with only some provided tags', async () => {
    const input: CreateBookmarkInput = {
      url: 'https://partial-tags.com',
      title: 'Partial Tags Test',
      description: null,
      user_id: testUserId,
      collection_id: null,
      tag_ids: [testTagIds[0]] // Only one tag
    };

    const result = await createBookmark(input);

    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].name).toEqual('JavaScript');

    // Verify in database
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, result.id))
      .execute();

    expect(bookmarkTags).toHaveLength(1);
  });
});
