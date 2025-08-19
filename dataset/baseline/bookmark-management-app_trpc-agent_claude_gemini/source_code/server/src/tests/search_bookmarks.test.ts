import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type SearchBookmarksInput } from '../schema';
import { searchBookmarks } from '../handlers/search_bookmarks';

describe('searchBookmarks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Setup test data
  let testUserId: number;
  let testCollectionId: number;
  let testTagId1: number;
  let testTagId2: number;
  let testBookmarkId1: number;
  let testBookmarkId2: number;
  let testBookmarkId3: number;

  const setupTestData = async () => {
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
        name: 'Test Collection',
        description: 'A collection for testing',
        user_id: testUserId
      })
      .returning()
      .execute();
    testCollectionId = collectionResult[0].id;

    // Create test tags
    const tag1Result = await db.insert(tagsTable)
      .values({
        name: 'javascript',
        user_id: testUserId
      })
      .returning()
      .execute();
    testTagId1 = tag1Result[0].id;

    const tag2Result = await db.insert(tagsTable)
      .values({
        name: 'tutorial',
        user_id: testUserId
      })
      .returning()
      .execute();
    testTagId2 = tag2Result[0].id;

    // Create test bookmarks
    const bookmark1Result = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com/javascript-tutorial',
        title: 'JavaScript Tutorial',
        description: 'Learn JavaScript basics',
        user_id: testUserId,
        collection_id: testCollectionId
      })
      .returning()
      .execute();
    testBookmarkId1 = bookmark1Result[0].id;

    const bookmark2Result = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com/react-guide',
        title: 'React Guide',
        description: 'Complete guide to React framework',
        user_id: testUserId,
        collection_id: null
      })
      .returning()
      .execute();
    testBookmarkId2 = bookmark2Result[0].id;

    const bookmark3Result = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com/python-basics',
        title: 'Python Basics',
        description: 'Introduction to Python programming',
        user_id: testUserId,
        collection_id: testCollectionId
      })
      .returning()
      .execute();
    testBookmarkId3 = bookmark3Result[0].id;

    // Create bookmark-tag associations
    await db.insert(bookmarkTagsTable)
      .values([
        { bookmark_id: testBookmarkId1, tag_id: testTagId1 },
        { bookmark_id: testBookmarkId1, tag_id: testTagId2 },
        { bookmark_id: testBookmarkId2, tag_id: testTagId1 }
      ])
      .execute();
  };

  it('should search bookmarks by title', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'JavaScript'
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('JavaScript Tutorial');
    expect(results[0].url).toEqual('https://example.com/javascript-tutorial');
    expect(results[0].description).toEqual('Learn JavaScript basics');
    expect(results[0].user_id).toEqual(testUserId);
    expect(results[0].collection_id).toEqual(testCollectionId);
    expect(results[0].collection_name).toEqual('Test Collection');
    expect(results[0].tags).toHaveLength(2);
    expect(results[0].tags.some(tag => tag.name === 'javascript')).toBe(true);
    expect(results[0].tags.some(tag => tag.name === 'tutorial')).toBe(true);
  });

  it('should search bookmarks by description', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'React framework'
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('React Guide');
    expect(results[0].description).toEqual('Complete guide to React framework');
    expect(results[0].collection_id).toBeNull();
    expect(results[0].collection_name).toBeNull();
    expect(results[0].tags).toHaveLength(1);
    expect(results[0].tags[0].name).toEqual('javascript');
  });

  it('should search case-insensitively', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'python'
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Python Basics');
  });

  it('should filter by collection_id', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'guide',
      collection_id: testCollectionId
    };

    const results = await searchBookmarks(input);

    // Should not find "React Guide" because it's not in the test collection
    expect(results).toHaveLength(0);
  });

  it('should filter by collection_id and find matches', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'Python',
      collection_id: testCollectionId
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Python Basics');
    expect(results[0].collection_id).toEqual(testCollectionId);
  });

  it('should filter by tag_ids', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'guide',
      tag_ids: [testTagId2] // tutorial tag
    };

    const results = await searchBookmarks(input);

    // Should not find "React Guide" because it doesn't have the tutorial tag
    expect(results).toHaveLength(0);
  });

  it('should filter by tag_ids and find matches', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'JavaScript',
      tag_ids: [testTagId2] // tutorial tag
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('JavaScript Tutorial');
    expect(results[0].tags.some(tag => tag.name === 'tutorial')).toBe(true);
  });

  it('should filter by multiple tag_ids', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'guide',
      tag_ids: [testTagId1, testTagId2] // javascript OR tutorial
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('React Guide');
    expect(results[0].tags.some(tag => tag.name === 'javascript')).toBe(true);
  });

  it('should combine collection and tag filters', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'JavaScript',
      collection_id: testCollectionId,
      tag_ids: [testTagId1] // javascript tag
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('JavaScript Tutorial');
    expect(results[0].collection_id).toEqual(testCollectionId);
    expect(results[0].tags.some(tag => tag.name === 'javascript')).toBe(true);
  });

  it('should return empty array when no matches found', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'nonexistent'
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(0);
  });

  it('should only return bookmarks for the specified user', async () => {
    await setupTestData();

    // Create another user and bookmark
    const otherUserResult = await db.insert(usersTable)
      .values({
        username: 'otheruser',
        email: 'other@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com/other-javascript',
        title: 'Other JavaScript Guide',
        description: 'Another JavaScript resource',
        user_id: otherUserResult[0].id,
        collection_id: null
      })
      .execute();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'JavaScript'
    };

    const results = await searchBookmarks(input);

    // Should only find the bookmark belonging to testUserId
    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('JavaScript Tutorial');
    expect(results[0].user_id).toEqual(testUserId);
  });

  it('should handle bookmarks with no tags', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'Python'
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Python Basics');
    expect(results[0].tags).toHaveLength(0);
  });

  it('should handle partial word searches', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'Tut'
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('JavaScript Tutorial');
  });
});
