import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, bookmarksTable } from '../db/schema';
import { type CreateUserInput, type CreateBookmarkInput } from '../schema';
import { getBookmarks } from '../handlers/get_bookmarks';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123'
};

const testBookmark: CreateBookmarkInput = {
  url: 'https://example.com',
  title: 'Test Bookmark',
  description: 'A bookmark for testing'
};

describe('getBookmarks', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: testUser.password // In real implementation, this would be hashed
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Create a test bookmark
    await db.insert(bookmarksTable)
      .values({
        user_id: userId,
        url: testBookmark.url,
        title: testBookmark.title,
        description: testBookmark.description
      })
      .returning()
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch all bookmarks', async () => {
    // Call the handler
    const bookmarks = await getBookmarks();

    // Validate the results
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].url).toEqual(testBookmark.url);
    expect(bookmarks[0].title).toEqual(testBookmark.title);
    expect(bookmarks[0].description).toEqual(testBookmark.description);
    expect(bookmarks[0].id).toBeDefined();
    expect(bookmarks[0].user_id).toBeDefined();
    expect(bookmarks[0].created_at).toBeInstanceOf(Date);
    expect(bookmarks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no bookmarks exist', async () => {
    // Reset the database to test empty case
    await resetDB();
    await createDB();
    
    // Call the handler
    const bookmarks = await getBookmarks();

    // Validate the results
    expect(bookmarks).toHaveLength(0);
  });
});
