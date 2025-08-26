import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type CreateBookmarkInput } from '../schema';
import { createBookmark } from '../handlers/create_bookmark';
import { eq } from 'drizzle-orm';

describe('createBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testCollectionId: number;
  let testTagIds: number[];

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        user_id: testUserId,
        name: 'Test Collection',
        description: 'A collection for testing'
      })
      .returning()
      .execute();
    testCollectionId = collectionResult[0].id;

    // Create test tags
    const tag1Result = await db.insert(tagsTable)
      .values({
        user_id: testUserId,
        name: 'Tag 1',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const tag2Result = await db.insert(tagsTable)
      .values({
        user_id: testUserId,
        name: 'Tag 2',
        color: '#00ff00'
      })
      .returning()
      .execute();

    testTagIds = [tag1Result[0].id, tag2Result[0].id];
  });

  const baseInput: CreateBookmarkInput = {
    user_id: 0, // Will be set in tests
    collection_id: null,
    url: 'https://example.com',
    title: 'Example Website',
    description: 'A test bookmark',
    favicon_url: 'https://example.com/favicon.ico'
  };

  it('should create a bookmark with all fields', async () => {
    const input: CreateBookmarkInput = {
      ...baseInput,
      user_id: testUserId,
      collection_id: testCollectionId
    };

    const result = await createBookmark(input);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUserId);
    expect(result.collection_id).toEqual(testCollectionId);
    expect(result.url).toEqual('https://example.com');
    expect(result.title).toEqual('Example Website');
    expect(result.description).toEqual('A test bookmark');
    expect(result.favicon_url).toEqual('https://example.com/favicon.ico');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a bookmark without collection', async () => {
    const input: CreateBookmarkInput = {
      ...baseInput,
      user_id: testUserId,
      collection_id: null
    };

    const result = await createBookmark(input);

    expect(result.collection_id).toBeNull();
    expect(result.user_id).toEqual(testUserId);
    expect(result.url).toEqual('https://example.com');
  });

  it('should create a bookmark with tags', async () => {
    const input: CreateBookmarkInput = {
      ...baseInput,
      user_id: testUserId,
      tag_ids: testTagIds
    };

    const result = await createBookmark(input);

    // Verify bookmark was created
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUserId);

    // Verify bookmark-tag relationships were created
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, result.id))
      .execute();

    expect(bookmarkTags).toHaveLength(2);
    expect(bookmarkTags.map(bt => bt.tag_id).sort()).toEqual(testTagIds.sort());
  });

  it('should save bookmark to database', async () => {
    const input: CreateBookmarkInput = {
      ...baseInput,
      user_id: testUserId
    };

    const result = await createBookmark(input);

    // Query database to verify bookmark was saved
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, result.id))
      .execute();

    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].title).toEqual('Example Website');
    expect(bookmarks[0].url).toEqual('https://example.com');
    expect(bookmarks[0].user_id).toEqual(testUserId);
  });

  it('should handle nullable fields correctly', async () => {
    const input: CreateBookmarkInput = {
      user_id: testUserId,
      url: 'https://example.com',
      title: 'Minimal Bookmark'
      // description and favicon_url are optional/nullable
    };

    const result = await createBookmark(input);

    expect(result.description).toBeNull();
    expect(result.favicon_url).toBeNull();
    expect(result.collection_id).toBeNull();
  });

  it('should throw error for non-existent user', async () => {
    const input: CreateBookmarkInput = {
      ...baseInput,
      user_id: 999999 // Non-existent user
    };

    await expect(createBookmark(input)).rejects.toThrow(/User with id 999999 does not exist/i);
  });

  it('should throw error for non-existent collection', async () => {
    const input: CreateBookmarkInput = {
      ...baseInput,
      user_id: testUserId,
      collection_id: 999999 // Non-existent collection
    };

    await expect(createBookmark(input)).rejects.toThrow(/Collection with id 999999 does not exist/i);
  });

  it('should throw error for non-existent tag', async () => {
    const input: CreateBookmarkInput = {
      ...baseInput,
      user_id: testUserId,
      tag_ids: [999999] // Non-existent tag
    };

    await expect(createBookmark(input)).rejects.toThrow(/Tag with id 999999 does not exist/i);
  });

  it('should create bookmark with single tag', async () => {
    const input: CreateBookmarkInput = {
      ...baseInput,
      user_id: testUserId,
      tag_ids: [testTagIds[0]]
    };

    const result = await createBookmark(input);

    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, result.id))
      .execute();

    expect(bookmarkTags).toHaveLength(1);
    expect(bookmarkTags[0].tag_id).toEqual(testTagIds[0]);
  });

  it('should create bookmark without tags when tag_ids is empty array', async () => {
    const input: CreateBookmarkInput = {
      ...baseInput,
      user_id: testUserId,
      tag_ids: []
    };

    const result = await createBookmark(input);

    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, result.id))
      .execute();

    expect(bookmarkTags).toHaveLength(0);
  });
});
