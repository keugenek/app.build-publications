import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookmarksTable, usersTable } from '../db/schema';
import { type CreateBookmarkInput, type CreateUserInput } from '../schema';
import { createBookmark } from '../handlers/create_bookmark';
import { eq } from 'drizzle-orm';

// Test user input
const testUserInput: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User'
};

// Test bookmark input
const testInput: CreateBookmarkInput = {
  user_id: 1,
  url: 'https://example.com',
  title: 'Example Bookmark',
  description: 'A bookmark for testing'
};

describe('createBookmark', () => {
  beforeEach(async () => {
    await createDB();
    // Create a user first since bookmarks require a valid user_id
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    testInput.user_id = userResult[0].id;
  });
  
  afterEach(resetDB);

  it('should create a bookmark', async () => {
    const result = await createBookmark(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testInput.user_id);
    expect(result.url).toEqual(testInput.url);
    expect(result.title).toEqual(testInput.title);
    expect(result.description).toEqual(testInput.description);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save bookmark to database', async () => {
    const result = await createBookmark(testInput);

    // Query using proper drizzle syntax
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, result.id))
      .execute();

    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].user_id).toEqual(testInput.user_id);
    expect(bookmarks[0].url).toEqual(testInput.url);
    expect(bookmarks[0].title).toEqual(testInput.title);
    expect(bookmarks[0].description).toEqual(testInput.description);
    expect(bookmarks[0].created_at).toBeInstanceOf(Date);
    expect(bookmarks[0].updated_at).toBeInstanceOf(Date);
  });
});
