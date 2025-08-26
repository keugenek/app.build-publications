import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookmarksTable, usersTable, tagsTable, collectionsTable, bookmarkTagsTable, bookmarkCollectionsTable } from '../db/schema';
import { type SearchBookmarksInput, type CreateUserInput, type CreateBookmarkInput, type CreateTagInput, type CreateCollectionInput } from '../schema';
import { searchBookmarks } from '../handlers/search_bookmarks';
import { eq } from 'drizzle-orm';

describe('searchBookmarks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a user
  const createUser = async (input: CreateUserInput) => {
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        password_hash: input.password // In tests we can use plain text
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper function to create a bookmark
  const createBookmark = async (userId: number, input: CreateBookmarkInput) => {
    const result = await db.insert(bookmarksTable)
      .values({
        user_id: userId,
        url: input.url,
        title: input.title,
        description: input.description
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper function to create a tag
  const createTag = async (userId: number, input: CreateTagInput) => {
    const result = await db.insert(tagsTable)
      .values({
        user_id: userId,
        name: input.name
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper function to create a collection
  const createCollection = async (userId: number, input: CreateCollectionInput) => {
    const result = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: input.name,
        description: input.description
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper function to associate a tag with a bookmark
  const addTagToBookmark = async (bookmarkId: number, tagId: number) => {
    await db.insert(bookmarkTagsTable)
      .values({
        bookmark_id: bookmarkId,
        tag_id: tagId
      })
      .execute();
  };

  // Helper function to associate a bookmark with a collection
  const addBookmarkToCollection = async (bookmarkId: number, collectionId: number) => {
    await db.insert(bookmarkCollectionsTable)
      .values({
        bookmark_id: bookmarkId,
        collection_id: collectionId
      })
      .execute();
  };

  it('should search bookmarks by title', async () => {
    // Create a user
    const user = await createUser({
      email: 'test@example.com',
      password: 'password123'
    });

    // Create a bookmark
    await createBookmark(user.id, {
      url: 'https://example.com',
      title: 'Test Bookmark',
      description: 'A test bookmark for searching'
    });

    // Search for bookmarks
    const input: SearchBookmarksInput = { query: 'Test' };
    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Test Bookmark');
    expect(results[0].url).toEqual('https://example.com');
    expect(results[0].description).toEqual('A test bookmark for searching');
  });

  it('should search bookmarks by URL', async () => {
    // Create a user
    const user = await createUser({
      email: 'test@example.com',
      password: 'password123'
    });

    // Create a bookmark
    await createBookmark(user.id, {
      url: 'https://github.com',
      title: 'GitHub',
      description: 'Code repository'
    });

    // Search for bookmarks
    const input: SearchBookmarksInput = { query: 'github' };
    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('GitHub');
    expect(results[0].url).toEqual('https://github.com');
  });

  it('should search bookmarks by description', async () => {
    // Create a user
    const user = await createUser({
      email: 'test@example.com',
      password: 'password123'
    });

    // Create a bookmark
    await createBookmark(user.id, {
      url: 'https://example.com',
      title: 'Example Site',
      description: 'This is a sample website for testing purposes'
    });

    // Search for bookmarks
    const input: SearchBookmarksInput = { query: 'sample' };
    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].description).toEqual('This is a sample website for testing purposes');
  });

  it('should search bookmarks by tag name', async () => {
    // Create a user
    const user = await createUser({
      email: 'test@example.com',
      password: 'password123'
    });

    // Create a bookmark
    const bookmark = await createBookmark(user.id, {
      url: 'https://example.com',
      title: 'Tagged Bookmark',
      description: 'A bookmark with tags'
    });

    // Create a tag
    const tag = await createTag(user.id, { name: 'typescript' });

    // Associate tag with bookmark
    await addTagToBookmark(bookmark.id, tag.id);

    // Search for bookmarks by tag
    const input: SearchBookmarksInput = { query: 'typescript' };
    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Tagged Bookmark');
  });

  it('should search bookmarks by collection name', async () => {
    // Create a user
    const user = await createUser({
      email: 'test@example.com',
      password: 'password123'
    });

    // Create a bookmark
    const bookmark = await createBookmark(user.id, {
      url: 'https://example.com',
      title: 'Collected Bookmark',
      description: 'A bookmark in a collection'
    });

    // Create a collection
    const collection = await createCollection(user.id, {
      name: 'Programming Resources',
      description: 'Resources for programming'
    });

    // Associate bookmark with collection
    await addBookmarkToCollection(bookmark.id, collection.id);

    // Search for bookmarks by collection
    const input: SearchBookmarksInput = { query: 'Programming' };
    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Collected Bookmark');
  });

  it('should return empty array when no bookmarks match', async () => {
    // Create a user
    const user = await createUser({
      email: 'test@example.com',
      password: 'password123'
    });

    // Create a bookmark
    await createBookmark(user.id, {
      url: 'https://example.com',
      title: 'Test Bookmark',
      description: 'A test bookmark'
    });

    // Search for bookmarks with no matches
    const input: SearchBookmarksInput = { query: 'nonexistent' };
    const results = await searchBookmarks(input);

    expect(results).toHaveLength(0);
  });

  it('should handle case insensitive search', async () => {
    // Create a user
    const user = await createUser({
      email: 'test@example.com',
      password: 'password123'
    });

    // Create a bookmark
    await createBookmark(user.id, {
      url: 'https://EXAMPLE.com',
      title: 'TEST Bookmark',
      description: 'A TEST bookmark for CASE testing'
    });

    // Search with different case
    const input: SearchBookmarksInput = { query: 'test' };
    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('TEST Bookmark');
  });
});
