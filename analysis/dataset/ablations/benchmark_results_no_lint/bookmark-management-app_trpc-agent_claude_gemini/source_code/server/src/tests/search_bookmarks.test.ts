import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type SearchBookmarksInput } from '../schema';
import { searchBookmarks } from '../handlers/search_bookmarks';

// Test data setup
let testUserId: number;
let otherUserId: number;
let testCollectionId: number;
let otherCollectionId: number;
let testTagId1: number;
let testTagId2: number;
let testBookmarkId1: number;
let testBookmarkId2: number;
let testBookmarkId3: number;

describe('searchBookmarks', () => {
  beforeEach(async () => {
    await createDB();

    // Create test users
    const users = await db.insert(usersTable)
      .values([
        { email: 'test@example.com', username: 'testuser' },
        { email: 'other@example.com', username: 'otheruser' }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create test collections
    const collections = await db.insert(collectionsTable)
      .values([
        { name: 'Work Bookmarks', description: 'Work related links', user_id: testUserId },
        { name: 'Personal Bookmarks', description: 'Personal links', user_id: testUserId },
        { name: 'Other User Collection', description: 'Other user links', user_id: otherUserId }
      ])
      .returning()
      .execute();

    testCollectionId = collections[0].id;
    otherCollectionId = collections[2].id;

    // Create test tags
    const tags = await db.insert(tagsTable)
      .values([
        { name: 'JavaScript', color: '#f7df1e', user_id: testUserId },
        { name: 'Python', color: '#3776ab', user_id: testUserId }
      ])
      .returning()
      .execute();

    testTagId1 = tags[0].id;
    testTagId2 = tags[1].id;

    // Create test bookmarks one by one to ensure proper timestamp ordering
    const bookmark1 = await db.insert(bookmarksTable)
      .values({
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        title: 'JavaScript MDN Documentation',
        description: 'Comprehensive JavaScript documentation and tutorials',
        user_id: testUserId,
        collection_id: testCollectionId
      })
      .returning()
      .execute();

    const bookmark2 = await db.insert(bookmarksTable)
      .values({
        url: 'https://python.org',
        title: 'Python Official Website',
        description: 'The official Python programming language website',
        user_id: testUserId,
        collection_id: testCollectionId
      })
      .returning()
      .execute();

    const bookmark3 = await db.insert(bookmarksTable)
      .values({
        url: 'https://react.dev',
        title: 'React Documentation',
        description: 'Learn React with interactive tutorials',
        user_id: testUserId,
        collection_id: null // No collection
      })
      .returning()
      .execute();

    const bookmark4 = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'Other User Bookmark',
        description: 'This belongs to another user',
        user_id: otherUserId,
        collection_id: otherCollectionId
      })
      .returning()
      .execute();

    const bookmarks = [bookmark1[0], bookmark2[0], bookmark3[0], bookmark4[0]];

    testBookmarkId1 = bookmarks[0].id;
    testBookmarkId2 = bookmarks[1].id;
    testBookmarkId3 = bookmarks[2].id;

    // Create bookmark-tag relationships
    await db.insert(bookmarkTagsTable)
      .values([
        { bookmark_id: testBookmarkId1, tag_id: testTagId1 },
        { bookmark_id: testBookmarkId2, tag_id: testTagId2 },
        { bookmark_id: testBookmarkId3, tag_id: testTagId1 } // React bookmark with JavaScript tag
      ])
      .execute();
  });

  afterEach(resetDB);

  it('should return all bookmarks for a user without filters', async () => {
    const input: SearchBookmarksInput = {
      user_id: testUserId
    };

    const result = await searchBookmarks(input);

    expect(result).toHaveLength(3);
    // Results should be ordered by created_at DESC (most recent first)
    // Since bookmarks were inserted in order: JS, Python, React, the reverse order is: React, Python, JS
    expect(result[0].title).toEqual('React Documentation'); // Most recent first
    expect(result[1].title).toEqual('Python Official Website');
    expect(result[2].title).toEqual('JavaScript MDN Documentation');
    
    // Verify structure
    expect(result[0].user_id).toEqual(testUserId);
    expect(result[0].url).toBeDefined();
    expect(result[0].tags).toBeInstanceOf(Array);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter bookmarks by text search in title', async () => {
    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'JavaScript'
    };

    const result = await searchBookmarks(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('JavaScript MDN Documentation');
    expect(result[0].description).toContain('Comprehensive JavaScript documentation');
  });

  it('should filter bookmarks by text search in URL', async () => {
    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'python.org'
    };

    const result = await searchBookmarks(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Python Official Website');
    expect(result[0].url).toEqual('https://python.org');
  });

  it('should filter bookmarks by text search in description', async () => {
    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'interactive tutorials'
    };

    const result = await searchBookmarks(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('React Documentation');
    expect(result[0].description).toContain('interactive tutorials');
  });

  it('should filter bookmarks by collection', async () => {
    const input: SearchBookmarksInput = {
      user_id: testUserId,
      collection_id: testCollectionId
    };

    const result = await searchBookmarks(input);

    expect(result).toHaveLength(2);
    expect(result.every(bookmark => bookmark.collection_id === testCollectionId)).toBe(true);
    expect(result.every(bookmark => bookmark.collection_name === 'Work Bookmarks')).toBe(true);
  });

  it('should filter bookmarks by tag', async () => {
    const input: SearchBookmarksInput = {
      user_id: testUserId,
      tag_ids: [testTagId1] // JavaScript tag
    };

    const result = await searchBookmarks(input);

    expect(result).toHaveLength(2);
    // Should include both JavaScript MDN and React Documentation (both tagged with JavaScript)
    const titles = result.map(bookmark => bookmark.title);
    expect(titles).toContain('JavaScript MDN Documentation');
    expect(titles).toContain('React Documentation');
  });

  it('should filter bookmarks by multiple tags', async () => {
    const input: SearchBookmarksInput = {
      user_id: testUserId,
      tag_ids: [testTagId1, testTagId2] // Both JavaScript and Python tags
    };

    const result = await searchBookmarks(input);

    expect(result).toHaveLength(3); // All bookmarks have at least one of these tags
    const titles = result.map(bookmark => bookmark.title);
    expect(titles).toContain('JavaScript MDN Documentation');
    expect(titles).toContain('Python Official Website');
    expect(titles).toContain('React Documentation');
  });

  it('should include tags in bookmark results', async () => {
    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'JavaScript'
    };

    const result = await searchBookmarks(input);

    expect(result).toHaveLength(1);
    expect(result[0].tags).toHaveLength(1);
    expect(result[0].tags[0].name).toEqual('JavaScript');
    expect(result[0].tags[0].color).toEqual('#f7df1e');
    expect(result[0].tags[0].id).toEqual(testTagId1);
  });

  it('should include collection name for bookmarks with collections', async () => {
    const input: SearchBookmarksInput = {
      user_id: testUserId,
      collection_id: testCollectionId
    };

    const result = await searchBookmarks(input);

    expect(result.every(bookmark => bookmark.collection_name === 'Work Bookmarks')).toBe(true);
  });

  it('should handle bookmarks without collections', async () => {
    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'React'
    };

    const result = await searchBookmarks(input);

    expect(result).toHaveLength(1);
    expect(result[0].collection_id).toBeNull();
    expect(result[0].collection_name).toBeNull();
  });

  it('should respect pagination with limit', async () => {
    const input: SearchBookmarksInput = {
      user_id: testUserId,
      limit: 2
    };

    const result = await searchBookmarks(input);

    expect(result).toHaveLength(2);
  });

  it('should respect pagination with offset', async () => {
    const input: SearchBookmarksInput = {
      user_id: testUserId,
      limit: 10,
      offset: 2
    };

    const result = await searchBookmarks(input);

    expect(result).toHaveLength(1); // Only 1 remaining after skipping 2
  });

  it('should combine multiple filters', async () => {
    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'documentation',
      collection_id: testCollectionId,
      tag_ids: [testTagId1]
    };

    const result = await searchBookmarks(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('JavaScript MDN Documentation');
    expect(result[0].collection_id).toEqual(testCollectionId);
    expect(result[0].tags.some(tag => tag.id === testTagId1)).toBe(true);
  });

  it('should only return bookmarks for the specified user', async () => {
    const input: SearchBookmarksInput = {
      user_id: otherUserId
    };

    const result = await searchBookmarks(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Other User Bookmark');
    expect(result[0].user_id).toEqual(otherUserId);
  });

  it('should return empty array when no bookmarks match', async () => {
    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'nonexistent search term'
    };

    const result = await searchBookmarks(input);

    expect(result).toHaveLength(0);
  });

  it('should handle empty tag_ids array', async () => {
    const input: SearchBookmarksInput = {
      user_id: testUserId,
      tag_ids: []
    };

    const result = await searchBookmarks(input);

    expect(result).toHaveLength(3); // Should return all user bookmarks
  });

  it('should be case insensitive for text search', async () => {
    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'JAVASCRIPT' // Uppercase search
    };

    const result = await searchBookmarks(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('JavaScript MDN Documentation');
  });

  it('should handle partial text matches', async () => {
    const input: SearchBookmarksInput = {
      user_id: testUserId,
      query: 'Script' // Partial match for "JavaScript"
    };

    const result = await searchBookmarks(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('JavaScript MDN Documentation');
  });
});
