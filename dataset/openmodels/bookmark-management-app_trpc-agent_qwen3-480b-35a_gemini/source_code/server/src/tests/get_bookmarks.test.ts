import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, bookmarksTable } from '../db/schema';
import { getBookmarks } from '../handlers/get_bookmarks';

describe('getBookmarks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when user has no bookmarks', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashedpassword123'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const result = await getBookmarks(userId);

    expect(result).toEqual([]);
  });

  it('should return bookmarks for a user', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashedpassword123'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create some bookmarks
    await db.insert(bookmarksTable)
      .values([
        {
          user_id: userId,
          title: 'Test Bookmark 1',
          url: 'https://example.com/1',
          description: 'First test bookmark'
        },
        {
          user_id: userId,
          title: 'Test Bookmark 2',
          url: 'https://example.com/2',
          description: 'Second test bookmark'
        }
      ])
      .execute();

    // Test the handler
    const result = await getBookmarks(userId);

    expect(result).toHaveLength(2);
    
    // Check first bookmark
    const bookmark1 = result.find(b => b.title === 'Test Bookmark 1');
    expect(bookmark1).toBeDefined();
    expect(bookmark1?.user_id).toEqual(userId);
    expect(bookmark1?.title).toEqual('Test Bookmark 1');
    expect(bookmark1?.url).toEqual('https://example.com/1');
    expect(bookmark1?.description).toEqual('First test bookmark');
    expect(bookmark1?.collection_id).toBeNull(); // As per current implementation
    expect(bookmark1?.created_at).toBeInstanceOf(Date);
    expect(bookmark1?.updated_at).toBeInstanceOf(Date);
    
    // Check second bookmark
    const bookmark2 = result.find(b => b.title === 'Test Bookmark 2');
    expect(bookmark2).toBeDefined();
    expect(bookmark2?.user_id).toEqual(userId);
    expect(bookmark2?.title).toEqual('Test Bookmark 2');
    expect(bookmark2?.url).toEqual('https://example.com/2');
    expect(bookmark2?.description).toEqual('Second test bookmark');
    expect(bookmark2?.collection_id).toBeNull(); // As per current implementation
    expect(bookmark2?.created_at).toBeInstanceOf(Date);
    expect(bookmark2?.updated_at).toBeInstanceOf(Date);
  });

  it('should only return bookmarks for the specified user', async () => {
    // Create two users
    const userResults = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          name: 'User 1',
          password_hash: 'hashedpassword123'
        },
        {
          email: 'user2@example.com',
          name: 'User 2',
          password_hash: 'hashedpassword456'
        }
      ])
      .returning()
      .execute();
    
    const user1Id = userResults[0].id;
    const user2Id = userResults[1].id;

    // Create bookmarks for both users
    await db.insert(bookmarksTable)
      .values([
        {
          user_id: user1Id,
          title: 'User 1 Bookmark',
          url: 'https://example.com/user1',
          description: 'Bookmark for user 1'
        },
        {
          user_id: user2Id,
          title: 'User 2 Bookmark',
          url: 'https://example.com/user2',
          description: 'Bookmark for user 2'
        }
      ])
      .execute();

    // Test the handler for user 1
    const result1 = await getBookmarks(user1Id);
    expect(result1).toHaveLength(1);
    expect(result1[0].title).toEqual('User 1 Bookmark');
    expect(result1[0].user_id).toEqual(user1Id);

    // Test the handler for user 2
    const result2 = await getBookmarks(user2Id);
    expect(result2).toHaveLength(1);
    expect(result2[0].title).toEqual('User 2 Bookmark');
    expect(result2[0].user_id).toEqual(user2Id);
  });

  it('should handle bookmarks with null description', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashedpassword123'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a bookmark with null description
    await db.insert(bookmarksTable)
      .values({
        user_id: userId,
        title: 'No Description Bookmark',
        url: 'https://example.com/no-desc',
        description: null
      })
      .execute();

    // Test the handler
    const result = await getBookmarks(userId);
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('No Description Bookmark');
    expect(result[0].description).toBeNull();
    expect(result[0].collection_id).toBeNull();
  });
});
