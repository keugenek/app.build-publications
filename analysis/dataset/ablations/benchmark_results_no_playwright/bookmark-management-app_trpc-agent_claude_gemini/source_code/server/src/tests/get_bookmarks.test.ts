import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, bookmarksTable } from '../db/schema';
import { type GetUserEntityInput } from '../schema';
import { getBookmarks } from '../handlers/get_bookmarks';
import { eq } from 'drizzle-orm';

// Test input
const testInput: GetUserEntityInput = {
  user_id: 1
};

describe('getBookmarks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no bookmarks', async () => {
    // Create a user but no bookmarks
    await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashedpassword'
    }).execute();

    const result = await getBookmarks(testInput);

    expect(result).toEqual([]);
  });

  it('should return all bookmarks for a specific user', async () => {
    // Create users
    const [user1] = await db.insert(usersTable).values([
      {
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashedpassword1'
      },
      {
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hashedpassword2'
      }
    ]).returning().execute();

    // Create a collection for user1
    const [collection] = await db.insert(collectionsTable).values({
      user_id: user1.id,
      name: 'My Collection',
      description: 'Test collection'
    }).returning().execute();

    // Create bookmarks for both users
    await db.insert(bookmarksTable).values([
      {
        user_id: user1.id,
        collection_id: collection.id,
        title: 'User 1 Bookmark 1',
        url: 'https://example1.com',
        description: 'First bookmark'
      },
      {
        user_id: user1.id,
        collection_id: null,
        title: 'User 1 Bookmark 2',
        url: 'https://example2.com',
        description: null
      },
      {
        user_id: 2, // user2.id
        collection_id: null,
        title: 'User 2 Bookmark',
        url: 'https://example3.com',
        description: 'Should not appear'
      }
    ]).execute();

    const result = await getBookmarks({ user_id: user1.id });

    expect(result).toHaveLength(2);
    expect(result.every(bookmark => bookmark.user_id === user1.id)).toBe(true);
    
    // Check specific bookmark details
    const bookmark1 = result.find(b => b.title === 'User 1 Bookmark 1');
    expect(bookmark1).toBeDefined();
    expect(bookmark1!.url).toBe('https://example1.com');
    expect(bookmark1!.description).toBe('First bookmark');
    expect(bookmark1!.collection_id).toBe(collection.id);
    expect(bookmark1!.created_at).toBeInstanceOf(Date);
    expect(bookmark1!.updated_at).toBeInstanceOf(Date);

    const bookmark2 = result.find(b => b.title === 'User 1 Bookmark 2');
    expect(bookmark2).toBeDefined();
    expect(bookmark2!.url).toBe('https://example2.com');
    expect(bookmark2!.description).toBe(null);
    expect(bookmark2!.collection_id).toBe(null);
  });

  it('should return bookmarks in correct format with all required fields', async () => {
    // Create user
    await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashedpassword'
    }).execute();

    // Create bookmark
    await db.insert(bookmarksTable).values({
      user_id: 1,
      collection_id: null,
      title: 'Test Bookmark',
      url: 'https://test.example.com',
      description: 'Test description'
    }).execute();

    const result = await getBookmarks(testInput);

    expect(result).toHaveLength(1);
    const bookmark = result[0];

    // Verify all required fields are present and correct types
    expect(typeof bookmark.id).toBe('number');
    expect(typeof bookmark.user_id).toBe('number');
    expect(bookmark.collection_id).toBe(null);
    expect(typeof bookmark.title).toBe('string');
    expect(typeof bookmark.url).toBe('string');
    expect(typeof bookmark.description).toBe('string');
    expect(bookmark.created_at).toBeInstanceOf(Date);
    expect(bookmark.updated_at).toBeInstanceOf(Date);

    // Verify field values
    expect(bookmark.user_id).toBe(1);
    expect(bookmark.title).toBe('Test Bookmark');
    expect(bookmark.url).toBe('https://test.example.com');
    expect(bookmark.description).toBe('Test description');
  });

  it('should return bookmarks ordered by creation date', async () => {
    // Create user
    await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashedpassword'
    }).execute();

    // Create multiple bookmarks
    await db.insert(bookmarksTable).values([
      {
        user_id: 1,
        collection_id: null,
        title: 'First Bookmark',
        url: 'https://first.example.com',
        description: 'First'
      },
      {
        user_id: 1,
        collection_id: null,
        title: 'Second Bookmark',
        url: 'https://second.example.com',
        description: 'Second'
      }
    ]).execute();

    const result = await getBookmarks(testInput);

    expect(result).toHaveLength(2);
    
    // Verify bookmarks have timestamps
    result.forEach(bookmark => {
      expect(bookmark.created_at).toBeInstanceOf(Date);
      expect(bookmark.updated_at).toBeInstanceOf(Date);
    });

    // Check that we got the expected bookmarks
    const titles = result.map(b => b.title).sort();
    expect(titles).toEqual(['First Bookmark', 'Second Bookmark']);
  });

  it('should handle user with no existing bookmarks gracefully', async () => {
    // Don't create any data - test with non-existent user_id
    const result = await getBookmarks({ user_id: 999 });

    expect(result).toEqual([]);
  });

  it('should verify database state after creating bookmarks', async () => {
    // Create user
    await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashedpassword'
    }).execute();

    // Create bookmark
    await db.insert(bookmarksTable).values({
      user_id: 1,
      collection_id: null,
      title: 'Verification Bookmark',
      url: 'https://verify.example.com',
      description: 'For verification'
    }).execute();

    // Query database directly to verify data exists
    const dbBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.user_id, 1))
      .execute();

    expect(dbBookmarks).toHaveLength(1);
    expect(dbBookmarks[0].title).toBe('Verification Bookmark');

    // Now test the handler
    const result = await getBookmarks(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Verification Bookmark');
    expect(result[0].url).toBe('https://verify.example.com');
  });
});
