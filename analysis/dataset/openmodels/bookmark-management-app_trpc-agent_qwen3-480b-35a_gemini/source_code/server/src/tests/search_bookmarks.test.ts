import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, bookmarksTable, tagsTable, bookmarkTagsTable } from '../db/schema';
import { type SearchBookmarksInput, type CreateUserInput, type CreateTagInput } from '../schema';
import { searchBookmarks } from '../handlers/search_bookmarks';

describe('searchBookmarks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create a user
  const createUser = async (input: CreateUserInput) => {
    return await db.insert(usersTable)
      .values({
        email: input.email,
        name: input.name || '',
        password_hash: 'hashed_password',
      })
      .returning()
      .execute()
      .then(result => result[0]);
  };

  // Helper to create a bookmark
  const createBookmark = async (input: { user_id: number; title: string; url: string; description?: string | null }) => {
    return await db.insert(bookmarksTable)
      .values({
        user_id: input.user_id,
        title: input.title,
        url: input.url,
        description: input.description || null,
        is_public: false,
      })
      .returning()
      .execute()
      .then(result => result[0]);
  };

  // Helper to create a tag
  const createTag = async (input: CreateTagInput & { user_id: number }) => {
    return await db.insert(tagsTable)
      .values({
        user_id: input.user_id,
        name: input.name,
      })
      .returning()
      .execute()
      .then(result => result[0]);
  };

  // Helper to associate a tag with a bookmark
  const associateTagWithBookmark = async (bookmark_id: number, tag_id: number) => {
    return await db.insert(bookmarkTagsTable)
      .values({
        bookmark_id,
        tag_id,
      })
      .returning()
      .execute()
      .then(result => result[0]);
  };

  it('should search bookmarks by title', async () => {
    // Create user
    const user = await createUser({ email: 'test@example.com', name: 'Test User' });

    // Create bookmarks
    const bookmark1 = await createBookmark({
      user_id: user.id,
      title: 'JavaScript Guide',
      url: 'https://example.com/js',
      description: 'A guide to JavaScript',
    });

    const bookmark2 = await createBookmark({
      user_id: user.id,
      title: 'Python Tutorial',
      url: 'https://example.com/python',
      description: 'Learn Python programming',
    });

    // Search for JavaScript
    const input: SearchBookmarksInput = {
      user_id: user.id,
      query: 'JavaScript',
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].id).toEqual(bookmark1.id);
    expect(results[0].title).toEqual('JavaScript Guide');
  });

  it('should search bookmarks by description', async () => {
    // Create user
    const user = await createUser({ email: 'test@example.com', name: 'Test User' });

    // Create bookmarks
    await createBookmark({
      user_id: user.id,
      title: 'Bookmark 1',
      url: 'https://example.com/1',
      description: 'This is about JavaScript',
    });

    const bookmark2 = await createBookmark({
      user_id: user.id,
      title: 'Bookmark 2',
      url: 'https://example.com/2',
      description: 'Python tutorial content',
    });

    // Search for Python
    const input: SearchBookmarksInput = {
      user_id: user.id,
      query: 'Python',
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].id).toEqual(bookmark2.id);
    expect(results[0].description).toEqual('Python tutorial content');
  });

  it('should search bookmarks by URL', async () => {
    // Create user
    const user = await createUser({ email: 'test@example.com', name: 'Test User' });

    // Create bookmarks
    await createBookmark({
      user_id: user.id,
      title: 'Bookmark 1',
      url: 'https://javascript.example.com',
      description: 'JS content',
    });

    const bookmark2 = await createBookmark({
      user_id: user.id,
      title: 'Bookmark 2',
      url: 'https://python.example.com',
      description: 'Python content',
    });

    // Search for python in URL
    const input: SearchBookmarksInput = {
      user_id: user.id,
      query: 'python',
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].id).toEqual(bookmark2.id);
    expect(results[0].url).toEqual('https://python.example.com');
  });

  it('should search bookmarks by tag name', async () => {
    // Create user
    const user = await createUser({ email: 'test@example.com', name: 'Test User' });

    // Create bookmarks
    const bookmark = await createBookmark({
      user_id: user.id,
      title: 'JS Frameworks',
      url: 'https://example.com/frameworks',
      description: 'Guide to JS frameworks',
    });

    // Create tag
    const tag = await createTag({
      user_id: user.id,
      name: 'JavaScript',
    });

    // Associate tag with bookmark
    await associateTagWithBookmark(bookmark.id, tag.id);

    // Search for JavaScript tag
    const input: SearchBookmarksInput = {
      user_id: user.id,
      query: 'JavaScript',
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].id).toEqual(bookmark.id);
    expect(results[0].title).toEqual('JS Frameworks');
  });

  it('should return all bookmarks when query is empty', async () => {
    // Create user
    const user = await createUser({ email: 'test@example.com', name: 'Test User' });

    // Create bookmarks
    const bookmark1 = await createBookmark({
      user_id: user.id,
      title: 'Bookmark 1',
      url: 'https://example.com/1',
      description: 'First bookmark',
    });

    const bookmark2 = await createBookmark({
      user_id: user.id,
      title: 'Bookmark 2',
      url: 'https://example.com/2',
      description: 'Second bookmark',
    });

    // Search with empty query
    const input: SearchBookmarksInput = {
      user_id: user.id,
      query: '',
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(2);
    const resultIds = results.map(r => r.id).sort();
    expect(resultIds).toEqual([bookmark1.id, bookmark2.id].sort());
  });

  it('should only return bookmarks for the specified user', async () => {
    // Create users
    const user1 = await createUser({ email: 'user1@example.com', name: 'User 1' });
    const user2 = await createUser({ email: 'user2@example.com', name: 'User 2' });

    // Create bookmarks for both users
    const bookmark1 = await createBookmark({
      user_id: user1.id,
      title: 'User 1 Bookmark',
      url: 'https://example.com/u1',
      description: 'Bookmark for user 1',
    });

    await createBookmark({
      user_id: user2.id,
      title: 'User 2 Bookmark',
      url: 'https://example.com/u2',
      description: 'Bookmark for user 2',
    });

    // Search for user 1
    const input: SearchBookmarksInput = {
      user_id: user1.id,
      query: 'Bookmark',
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(1);
    expect(results[0].id).toEqual(bookmark1.id);
    expect(results[0].user_id).toEqual(user1.id);
  });

  it('should return empty array when no matches found', async () => {
    // Create user
    const user = await createUser({ email: 'test@example.com', name: 'Test User' });

    // Create bookmark
    await createBookmark({
      user_id: user.id,
      title: 'JavaScript Guide',
      url: 'https://example.com/js',
      description: 'A guide to JavaScript',
    });

    // Search for something that doesn't exist
    const input: SearchBookmarksInput = {
      user_id: user.id,
      query: 'Nonexistent',
    };

    const results = await searchBookmarks(input);

    expect(results).toHaveLength(0);
  });
});
