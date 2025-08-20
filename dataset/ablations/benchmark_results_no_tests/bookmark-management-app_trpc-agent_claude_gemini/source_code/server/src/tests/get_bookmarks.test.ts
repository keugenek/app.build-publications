import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, bookmarksTable } from '../db/schema';
import { getBookmarks } from '../handlers/get_bookmarks';

describe('getBookmarks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return bookmarks for a user ordered by creation date', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        display_name: 'Test User'
      })
      .returning()
      .execute();

    // Create test bookmarks with small delays to ensure different timestamps
    const bookmark1 = await db.insert(bookmarksTable)
      .values({
        user_id: user.id,
        collection_id: null,
        url: 'https://example1.com',
        title: 'First Bookmark',
        description: 'First bookmark description',
        favicon_url: 'https://example1.com/favicon.ico'
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const bookmark2 = await db.insert(bookmarksTable)
      .values({
        user_id: user.id,
        collection_id: null,
        url: 'https://example2.com',
        title: 'Second Bookmark',
        description: 'Second bookmark description',
        favicon_url: 'https://example2.com/favicon.ico'
      })
      .returning()
      .execute();

    const result = await getBookmarks(user.id);

    expect(result).toHaveLength(2);
    // Should be ordered by creation date (most recent first)
    expect(result[0].title).toBe('Second Bookmark');
    expect(result[1].title).toBe('First Bookmark');
    
    // Verify all fields are present
    expect(result[0].id).toBeDefined();
    expect(result[0].user_id).toBe(user.id);
    expect(result[0].url).toBe('https://example2.com');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when user has no bookmarks', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        display_name: 'Test User'
      })
      .returning()
      .execute();

    const result = await getBookmarks(user.id);

    expect(result).toHaveLength(0);
  });

  it('should filter bookmarks by collection when collection_id is provided', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        display_name: 'Test User'
      })
      .returning()
      .execute();

    // Create test collection
    const [collection] = await db.insert(collectionsTable)
      .values({
        user_id: user.id,
        name: 'Test Collection',
        description: 'A test collection'
      })
      .returning()
      .execute();

    // Create bookmarks - some in collection, some not
    await db.insert(bookmarksTable)
      .values({
        user_id: user.id,
        collection_id: collection.id,
        url: 'https://collection-bookmark.com',
        title: 'Collection Bookmark',
        description: 'Bookmark in collection'
      })
      .execute();

    await db.insert(bookmarksTable)
      .values({
        user_id: user.id,
        collection_id: null,
        url: 'https://no-collection.com',
        title: 'No Collection Bookmark',
        description: 'Bookmark without collection'
      })
      .execute();

    // Test filtering by collection
    const collectionBookmarks = await getBookmarks(user.id, collection.id);
    expect(collectionBookmarks).toHaveLength(1);
    expect(collectionBookmarks[0].title).toBe('Collection Bookmark');
    expect(collectionBookmarks[0].collection_id).toBe(collection.id);

    // Test getting all bookmarks
    const allBookmarks = await getBookmarks(user.id);
    expect(allBookmarks).toHaveLength(2);
  });

  it('should only return bookmarks for the specified user', async () => {
    // Create two test users
    const [user1] = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        display_name: 'User One'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        display_name: 'User Two'
      })
      .returning()
      .execute();

    // Create bookmarks for both users
    await db.insert(bookmarksTable)
      .values({
        user_id: user1.id,
        collection_id: null,
        url: 'https://user1-bookmark.com',
        title: 'User 1 Bookmark',
        description: 'Bookmark for user 1'
      })
      .execute();

    await db.insert(bookmarksTable)
      .values({
        user_id: user2.id,
        collection_id: null,
        url: 'https://user2-bookmark.com',
        title: 'User 2 Bookmark',
        description: 'Bookmark for user 2'
      })
      .execute();

    // Test that each user only gets their own bookmarks
    const user1Bookmarks = await getBookmarks(user1.id);
    expect(user1Bookmarks).toHaveLength(1);
    expect(user1Bookmarks[0].title).toBe('User 1 Bookmark');
    expect(user1Bookmarks[0].user_id).toBe(user1.id);

    const user2Bookmarks = await getBookmarks(user2.id);
    expect(user2Bookmarks).toHaveLength(1);
    expect(user2Bookmarks[0].title).toBe('User 2 Bookmark');
    expect(user2Bookmarks[0].user_id).toBe(user2.id);
  });

  it('should handle bookmarks with null collection_id correctly', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        display_name: 'Test User'
      })
      .returning()
      .execute();

    // Create bookmark without collection
    await db.insert(bookmarksTable)
      .values({
        user_id: user.id,
        collection_id: null,
        url: 'https://no-collection.com',
        title: 'Bookmark Without Collection',
        description: null,
        favicon_url: null
      })
      .execute();

    const result = await getBookmarks(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Bookmark Without Collection');
    expect(result[0].collection_id).toBeNull();
    expect(result[0].description).toBeNull();
    expect(result[0].favicon_url).toBeNull();
  });

  it('should return empty array when filtering by non-existent collection', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        display_name: 'Test User'
      })
      .returning()
      .execute();

    // Create bookmark without collection
    await db.insert(bookmarksTable)
      .values({
        user_id: user.id,
        collection_id: null,
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'Test description'
      })
      .execute();

    // Filter by non-existent collection ID
    const result = await getBookmarks(user.id, 999);

    expect(result).toHaveLength(0);
  });
});
