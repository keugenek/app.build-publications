import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookmarksTable, usersTable } from '../db/schema';
import { type SearchBookmarksInput, type CreateUserInput, type CreateBookmarkInput } from '../schema';
import { searchBookmarks } from '../handlers/search_bookmarks';
import { eq } from 'drizzle-orm';

// Test user input
const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User'
};

// Test bookmarks
const testBookmarks: CreateBookmarkInput[] = [
  {
    user_id: 1,
    url: 'https://example.com',
    title: 'Example Website',
    description: 'This is an example website for testing'
  },
  {
    user_id: 1,
    url: 'https://google.com',
    title: 'Google Search',
    description: 'Popular search engine'
  },
  {
    user_id: 1,
    url: 'https://github.com',
    title: 'GitHub Repository',
    description: 'Code hosting platform'
  }
];

describe('searchBookmarks', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();
    
    // Create test bookmarks
    for (const bookmark of testBookmarks) {
      await db.insert(bookmarksTable)
        .values(bookmark)
        .execute();
    }
  });
  
  afterEach(resetDB);

  it('should search bookmarks by title', async () => {
    const input: SearchBookmarksInput = {
      user_id: 1,
      query: 'Google'
    };

    const results = await searchBookmarks(input);
    
    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Google Search');
    expect(results[0].url).toEqual('https://google.com');
    expect(results[0].description).toEqual('Popular search engine');
  });

  it('should search bookmarks by url', async () => {
    const input: SearchBookmarksInput = {
      user_id: 1,
      query: 'github'
    };

    const results = await searchBookmarks(input);
    
    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('GitHub Repository');
    expect(results[0].url).toEqual('https://github.com');
    expect(results[0].description).toEqual('Code hosting platform');
  });

  it('should search bookmarks by description', async () => {
    const input: SearchBookmarksInput = {
      user_id: 1,
      query: 'example'
    };

    const results = await searchBookmarks(input);
    
    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Example Website');
    expect(results[0].url).toEqual('https://example.com');
    expect(results[0].description).toEqual('This is an example website for testing');
  });

  it('should return multiple results when query matches multiple bookmarks', async () => {
    const input: SearchBookmarksInput = {
      user_id: 1,
      query: 'com'
    };

    const results = await searchBookmarks(input);
    
    expect(results).toHaveLength(3);
    expect(results.map(r => r.url)).toContain('https://example.com');
    expect(results.map(r => r.url)).toContain('https://google.com');
    expect(results.map(r => r.url)).toContain('https://github.com');
  });

  it('should return empty array when no matches found', async () => {
    const input: SearchBookmarksInput = {
      user_id: 1,
      query: 'nonexistent'
    };

    const results = await searchBookmarks(input);
    
    expect(results).toHaveLength(0);
  });

  it('should only return bookmarks for the specified user', async () => {
    // Create another user
    await db.insert(usersTable)
      .values({ email: 'another@example.com', name: 'Another User' })
      .execute();
    
    // Create a bookmark for the second user
    await db.insert(bookmarksTable)
      .values({
        user_id: 2,
        url: 'https://example.com',
        title: 'Another Example Website',
        description: 'This bookmark belongs to another user'
      })
      .execute();

    const input: SearchBookmarksInput = {
      user_id: 1,
      query: 'example'
    };

    const results = await searchBookmarks(input);
    
    // Should only return bookmarks for user 1
    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Example Website');
    expect(results[0].user_id).toEqual(1);
  });

  it('should perform case-insensitive search', async () => {
    const input: SearchBookmarksInput = {
      user_id: 1,
      query: 'EXAMPLE'
    };

    const results = await searchBookmarks(input);
    
    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Example Website');
  });
});
