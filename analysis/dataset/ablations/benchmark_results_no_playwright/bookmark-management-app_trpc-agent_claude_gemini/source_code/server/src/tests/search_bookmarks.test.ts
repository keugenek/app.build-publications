import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type SearchBookmarksInput } from '../schema';
import { searchBookmarks } from '../handlers/search_bookmarks';

describe('searchBookmarks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testCollectionId: number;
  let testTagId1: number;
  let testTagId2: number;

  const setupTestData = async () => {
    // Create test user
    const userResult = await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashed_password'
    }).returning().execute();
    testUserId = userResult[0].id;

    // Create test collection
    const collectionResult = await db.insert(collectionsTable).values({
      user_id: testUserId,
      name: 'Test Collection',
      description: 'A test collection'
    }).returning().execute();
    testCollectionId = collectionResult[0].id;

    // Create test tags
    const tag1Result = await db.insert(tagsTable).values({
      user_id: testUserId,
      name: 'JavaScript',
      color: '#ffff00'
    }).returning().execute();
    testTagId1 = tag1Result[0].id;

    const tag2Result = await db.insert(tagsTable).values({
      user_id: testUserId,
      name: 'React',
      color: '#0066cc'
    }).returning().execute();
    testTagId2 = tag2Result[0].id;

    // Create test bookmarks
    const bookmarkResults = await db.insert(bookmarksTable).values([
      {
        user_id: testUserId,
        collection_id: testCollectionId,
        title: 'JavaScript Guide',
        url: 'https://developer.mozilla.org/docs/Web/JavaScript',
        description: 'Complete guide to JavaScript programming'
      },
      {
        user_id: testUserId,
        collection_id: testCollectionId,
        title: 'React Documentation',
        url: 'https://reactjs.org/docs',
        description: 'Official React documentation and tutorials'
      },
      {
        user_id: testUserId,
        collection_id: null,
        title: 'Node.js Tutorial',
        url: 'https://nodejs.org/tutorial',
        description: 'Learn Node.js from scratch'
      }
    ]).returning().execute();

    // Add tags to bookmarks
    await db.insert(bookmarkTagsTable).values([
      { bookmark_id: bookmarkResults[0].id, tag_id: testTagId1 },
      { bookmark_id: bookmarkResults[1].id, tag_id: testTagId1 },
      { bookmark_id: bookmarkResults[1].id, tag_id: testTagId2 }
    ]).execute();

    return bookmarkResults;
  };

  it('should search bookmarks by user_id with defaults', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      limit: 20,
      offset: 0
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(3);
    expect(results.every(b => b.user_id === testUserId)).toBe(true);
  });

  it('should search bookmarks by title', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'JavaScript',
      limit: 20,
      offset: 0
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('JavaScript Guide');
  });

  it('should search bookmarks by URL', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'reactjs.org',
      limit: 20,
      offset: 0
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('React Documentation');
  });

  it('should search bookmarks by description', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'scratch',
      limit: 20,
      offset: 0
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Node.js Tutorial');
  });

  it('should filter by collection_id', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      collection_id: testCollectionId,
      limit: 20,
      offset: 0
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(2);
    expect(results.every(b => b.collection_id === testCollectionId)).toBe(true);
  });

  it('should filter by single tag', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      tag_ids: [testTagId1],
      limit: 20,
      offset: 0
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(2);
    expect(results.some(b => b.title === 'JavaScript Guide')).toBe(true);
    expect(results.some(b => b.title === 'React Documentation')).toBe(true);
  });

  it('should filter by multiple tags (AND logic)', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      tag_ids: [testTagId1, testTagId2],
      limit: 20,
      offset: 0
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('React Documentation');
  });

  it('should return empty array when no bookmarks match all tags', async () => {
    await setupTestData();

    // Create a tag that's not used
    const unusedTagResult = await db.insert(tagsTable).values({
      user_id: testUserId,
      name: 'Python',
      color: '#3776ab'
    }).returning().execute();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      tag_ids: [testTagId1, unusedTagResult[0].id],
      limit: 20,
      offset: 0
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(0);
  });

  it('should combine search query with collection filter', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'React',
      collection_id: testCollectionId,
      limit: 20,
      offset: 0
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('React Documentation');
    expect(results[0].collection_id).toBe(testCollectionId);
  });

  it('should combine all filters', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'React',
      collection_id: testCollectionId,
      tag_ids: [testTagId1, testTagId2],
      limit: 20,
      offset: 0
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('React Documentation');
    expect(results[0].collection_id).toBe(testCollectionId);
  });

  it('should handle pagination with limit', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      limit: 2,
      offset: 0
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(2);
  });

  it('should handle pagination with offset', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      limit: 1,
      offset: 1
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
  });

  it('should be case-insensitive for text search', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'JAVASCRIPT',
      limit: 20,
      offset: 0
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('JavaScript Guide');
  });

  it('should handle empty query string', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: '',
      limit: 20,
      offset: 0
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(3);
  });

  it('should handle whitespace-only query', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: '   ',
      limit: 20,
      offset: 0
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(3);
  });

  it('should return empty array for non-existent user', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: 99999,
      limit: 20,
      offset: 0
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(0);
  });

  it('should filter bookmarks with null collection_id', async () => {
    await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'Node.js',
      limit: 20,
      offset: 0
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Node.js Tutorial');
    expect(results[0].collection_id).toBeNull();
  });

  it('should return all fields correctly', async () => {
    const bookmarkResults = await setupTestData();

    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'JavaScript',
      limit: 20,
      offset: 0
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    const bookmark = results[0];
    
    expect(bookmark.id).toBeDefined();
    expect(bookmark.user_id).toBe(testUserId);
    expect(bookmark.collection_id).toBe(testCollectionId);
    expect(bookmark.title).toBe('JavaScript Guide');
    expect(bookmark.url).toBe('https://developer.mozilla.org/docs/Web/JavaScript');
    expect(bookmark.description).toBe('Complete guide to JavaScript programming');
    expect(bookmark.created_at).toBeInstanceOf(Date);
    expect(bookmark.updated_at).toBeInstanceOf(Date);
  });
});
