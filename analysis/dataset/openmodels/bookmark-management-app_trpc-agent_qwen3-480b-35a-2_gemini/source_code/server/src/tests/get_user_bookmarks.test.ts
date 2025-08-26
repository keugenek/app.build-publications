import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, bookmarksTable } from '../db/schema';
import { getUserBookmarks } from '../handlers/get_user_bookmarks';

describe('getUserBookmarks', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const user = await db.insert(usersTable)
      .values({ email: 'test@example.com', name: 'Test User' })
      .returning()
      .execute();
    
    const userId = user[0].id;
    
    // Create test bookmarks
    await db.insert(bookmarksTable)
      .values([
        {
          user_id: userId,
          url: 'https://example1.com',
          title: 'Example 1',
          description: 'First example bookmark'
        },
        {
          user_id: userId,
          url: 'https://example2.com',
          title: 'Example 2',
          description: 'Second example bookmark'
        }
      ])
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch all bookmarks for a user', async () => {
    // First get the user ID
    const users = await db.select().from(usersTable).execute();
    const userId = users[0].id;

    const bookmarks = await getUserBookmarks(userId);

    expect(bookmarks).toHaveLength(2);
    expect(bookmarks[0]).toMatchObject({
      user_id: userId,
      url: 'https://example1.com',
      title: 'Example 1',
      description: 'First example bookmark'
    });
    expect(bookmarks[1]).toMatchObject({
      user_id: userId,
      url: 'https://example2.com',
      title: 'Example 2',
      description: 'Second example bookmark'
    });
    
    // Ensure all bookmarks have proper fields
    bookmarks.forEach(bookmark => {
      expect(bookmark.id).toBeDefined();
      expect(bookmark.created_at).toBeInstanceOf(Date);
      expect(bookmark.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for user with no bookmarks', async () => {
    // Create a user with no bookmarks
    const newUser = await db.insert(usersTable)
      .values({ email: 'empty@example.com', name: 'Empty User' })
      .returning()
      .execute();
    
    const bookmarks = await getUserBookmarks(newUser[0].id);
    
    expect(bookmarks).toHaveLength(0);
  });

  it('should handle non-existent user ID gracefully', async () => {
    const bookmarks = await getUserBookmarks(99999);
    expect(bookmarks).toHaveLength(0);
  });
});
