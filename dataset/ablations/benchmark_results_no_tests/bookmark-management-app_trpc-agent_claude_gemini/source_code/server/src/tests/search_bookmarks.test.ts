import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type SearchBookmarksInput } from '../schema';
import { searchBookmarks } from '../handlers/search_bookmarks';

// Test data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password',
  display_name: 'Test User'
};

const testCollection = {
  user_id: 1,
  name: 'Tech Resources',
  description: 'Programming resources'
};

const testTags = [
  { user_id: 1, name: 'javascript', color: '#f7df1e' },
  { user_id: 1, name: 'react', color: '#61dafb' },
  { user_id: 1, name: 'tutorial', color: '#ff6b35' }
];

const testBookmarks = [
  {
    user_id: 1,
    collection_id: 1,
    url: 'https://javascript.info',
    title: 'Modern JavaScript Tutorial',
    description: 'The modern JavaScript tutorial',
    favicon_url: 'https://javascript.info/favicon.ico'
  },
  {
    user_id: 1,
    collection_id: 1,
    url: 'https://react.dev',
    title: 'React Documentation',
    description: 'Learn React with the official docs',
    favicon_url: 'https://react.dev/favicon.ico'
  },
  {
    user_id: 1,
    collection_id: null,
    url: 'https://example.com/python',
    title: 'Python Guide',
    description: 'A comprehensive Python tutorial',
    favicon_url: null
  }
];

describe('searchBookmarks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to set up test data
  const setupTestData = async () => {
    // Create user
    await db.insert(usersTable).values(testUser).execute();

    // Create collection
    await db.insert(collectionsTable).values(testCollection).execute();

    // Create tags
    await db.insert(tagsTable).values(testTags).execute();

    // Create bookmarks
    await db.insert(bookmarksTable).values(testBookmarks).execute();

    // Create bookmark-tag relationships
    await db.insert(bookmarkTagsTable).values([
      { bookmark_id: 1, tag_id: 1 }, // javascript.info -> javascript
      { bookmark_id: 1, tag_id: 3 }, // javascript.info -> tutorial
      { bookmark_id: 2, tag_id: 2 }, // react.dev -> react
      { bookmark_id: 2, tag_id: 3 }, // react.dev -> tutorial
      { bookmark_id: 3, tag_id: 3 }  // python guide -> tutorial
    ]).execute();
  };

  const basicSearchInput: SearchBookmarksInput = {
    user_id: 1,
    limit: 20,
    offset: 0
  };

  it('should return all bookmarks for a user without filters', async () => {
    await setupTestData();

    const result = await searchBookmarks(basicSearchInput);

    expect(result).toHaveLength(3);
    expect(result[0].title).toBe('Python Guide'); // Most recent first
    expect(result[1].title).toBe('React Documentation');
    expect(result[2].title).toBe('Modern JavaScript Tutorial');

    // Verify basic structure
    result.forEach(bookmark => {
      expect(bookmark.id).toBeDefined();
      expect(bookmark.user_id).toBe(1);
      expect(bookmark.url).toStartWith('https://');
      expect(bookmark.title).toBeDefined();
      expect(bookmark.created_at).toBeInstanceOf(Date);
      expect(bookmark.updated_at).toBeInstanceOf(Date);
      expect(bookmark.tags).toBeDefined();
    });
  });

  it('should include collection data when bookmark has collection', async () => {
    await setupTestData();

    const result = await searchBookmarks(basicSearchInput);

    // Find bookmarks with collections
    const bookmarkWithCollection = result.find(b => b.collection_id === 1);
    expect(bookmarkWithCollection).toBeDefined();
    expect(bookmarkWithCollection!.collection).toBeDefined();
    expect(bookmarkWithCollection!.collection!.name).toBe('Tech Resources');
    expect(bookmarkWithCollection!.collection!.description).toBe('Programming resources');

    // Find bookmark without collection
    const bookmarkWithoutCollection = result.find(b => b.collection_id === null);
    expect(bookmarkWithoutCollection).toBeDefined();
    expect(bookmarkWithoutCollection!.collection).toBeNull();
  });

  it('should include tag data for bookmarks', async () => {
    await setupTestData();

    const result = await searchBookmarks(basicSearchInput);

    // Check JavaScript tutorial has correct tags
    const jsBookmark = result.find(b => b.title.includes('JavaScript'));
    expect(jsBookmark).toBeDefined();
    expect(jsBookmark!.tags).toHaveLength(2);
    
    const tagNames = jsBookmark!.tags!.map(t => t.name).sort();
    expect(tagNames).toEqual(['javascript', 'tutorial']);

    // Check React bookmark has correct tags
    const reactBookmark = result.find(b => b.title.includes('React'));
    expect(reactBookmark).toBeDefined();
    expect(reactBookmark!.tags).toHaveLength(2);
    
    const reactTagNames = reactBookmark!.tags!.map(t => t.name).sort();
    expect(reactTagNames).toEqual(['react', 'tutorial']);
  });

  it('should search by title', async () => {
    await setupTestData();

    const searchInput: SearchBookmarksInput = {
      ...basicSearchInput,
      query: 'React'
    };

    const result = await searchBookmarks(searchInput);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('React Documentation');
  });

  it('should search by URL', async () => {
    await setupTestData();

    const searchInput: SearchBookmarksInput = {
      ...basicSearchInput,
      query: 'javascript.info'
    };

    const result = await searchBookmarks(searchInput);

    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://javascript.info');
  });

  it('should search by description', async () => {
    await setupTestData();

    const searchInput: SearchBookmarksInput = {
      ...basicSearchInput,
      query: 'comprehensive'
    };

    const result = await searchBookmarks(searchInput);

    expect(result).toHaveLength(1);
    expect(result[0].description).toContain('comprehensive');
  });

  it('should search by tag name', async () => {
    await setupTestData();

    const searchInput: SearchBookmarksInput = {
      ...basicSearchInput,
      query: 'javascript'
    };

    const result = await searchBookmarks(searchInput);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Modern JavaScript Tutorial');
    
    // Verify the tag is actually attached
    const hasJsTag = result[0].tags!.some(tag => tag.name === 'javascript');
    expect(hasJsTag).toBe(true);
  });

  it('should filter by collection_id', async () => {
    await setupTestData();

    const searchInput: SearchBookmarksInput = {
      ...basicSearchInput,
      collection_id: 1
    };

    const result = await searchBookmarks(searchInput);

    expect(result).toHaveLength(2);
    result.forEach(bookmark => {
      expect(bookmark.collection_id).toBe(1);
    });
  });

  it('should return all bookmarks when collection_id is undefined', async () => {
    await setupTestData();

    const searchInput: SearchBookmarksInput = {
      ...basicSearchInput,
      collection_id: undefined
    };

    const result = await searchBookmarks(searchInput);

    expect(result).toHaveLength(3);
    // Should include bookmarks both with and without collections
    const withCollection = result.filter(b => b.collection_id !== null);
    const withoutCollection = result.filter(b => b.collection_id === null);
    expect(withCollection.length).toBeGreaterThan(0);
    expect(withoutCollection.length).toBeGreaterThan(0);
  });

  it('should filter by single tag_id', async () => {
    await setupTestData();

    const searchInput: SearchBookmarksInput = {
      ...basicSearchInput,
      tag_ids: [1] // javascript tag
    };

    const result = await searchBookmarks(searchInput);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Modern JavaScript Tutorial');
    
    const hasJsTag = result[0].tags!.some(tag => tag.id === 1);
    expect(hasJsTag).toBe(true);
  });

  it('should filter by multiple tag_ids (AND condition)', async () => {
    await setupTestData();

    const searchInput: SearchBookmarksInput = {
      ...basicSearchInput,
      tag_ids: [1, 3] // javascript AND tutorial
    };

    const result = await searchBookmarks(searchInput);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Modern JavaScript Tutorial');
    
    // Verify both tags are present
    const tagIds = result[0].tags!.map(t => t.id).sort();
    expect(tagIds).toContain(1);
    expect(tagIds).toContain(3);
  });

  it('should return empty array when tag combination has no matches', async () => {
    await setupTestData();

    const searchInput: SearchBookmarksInput = {
      ...basicSearchInput,
      tag_ids: [1, 2] // javascript AND react (no bookmark has both)
    };

    const result = await searchBookmarks(searchInput);

    expect(result).toHaveLength(0);
  });

  it('should handle pagination correctly', async () => {
    await setupTestData();

    // First page
    const firstPageInput: SearchBookmarksInput = {
      ...basicSearchInput,
      limit: 2,
      offset: 0
    };

    const firstPage = await searchBookmarks(firstPageInput);
    expect(firstPage).toHaveLength(2);

    // Second page
    const secondPageInput: SearchBookmarksInput = {
      ...basicSearchInput,
      limit: 2,
      offset: 2
    };

    const secondPage = await searchBookmarks(secondPageInput);
    expect(secondPage).toHaveLength(1);

    // Verify no overlap
    const firstPageIds = firstPage.map(b => b.id);
    const secondPageIds = secondPage.map(b => b.id);
    const overlap = firstPageIds.filter(id => secondPageIds.includes(id));
    expect(overlap).toHaveLength(0);
  });

  it('should combine query search with filters', async () => {
    await setupTestData();

    const searchInput: SearchBookmarksInput = {
      ...basicSearchInput,
      query: 'tutorial',
      collection_id: 1
    };

    const result = await searchBookmarks(searchInput);

    expect(result).toHaveLength(2);
    result.forEach(bookmark => {
      expect(bookmark.collection_id).toBe(1);
      // Should match either title, description, or have tutorial tag
      const matchesQuery = 
        bookmark.title.toLowerCase().includes('tutorial') ||
        bookmark.description?.toLowerCase().includes('tutorial') ||
        bookmark.tags!.some(tag => tag.name.toLowerCase().includes('tutorial'));
      expect(matchesQuery).toBe(true);
    });
  });

  it('should handle case-insensitive search', async () => {
    await setupTestData();

    const searchInput: SearchBookmarksInput = {
      ...basicSearchInput,
      query: 'JAVASCRIPT'
    };

    const result = await searchBookmarks(searchInput);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Modern JavaScript Tutorial');
  });

  it('should return empty array for non-existent user', async () => {
    await setupTestData();

    const searchInput: SearchBookmarksInput = {
      user_id: 999,
      limit: 20,
      offset: 0
    };

    const result = await searchBookmarks(searchInput);

    expect(result).toHaveLength(0);
  });

  it('should handle empty query gracefully', async () => {
    await setupTestData();

    const searchInput: SearchBookmarksInput = {
      ...basicSearchInput,
      query: ''
    };

    const result = await searchBookmarks(searchInput);

    expect(result).toHaveLength(3); // Should return all bookmarks
  });

  it('should handle whitespace-only query', async () => {
    await setupTestData();

    const searchInput: SearchBookmarksInput = {
      ...basicSearchInput,
      query: '   '
    };

    const result = await searchBookmarks(searchInput);

    expect(result).toHaveLength(3); // Should return all bookmarks
  });
});
