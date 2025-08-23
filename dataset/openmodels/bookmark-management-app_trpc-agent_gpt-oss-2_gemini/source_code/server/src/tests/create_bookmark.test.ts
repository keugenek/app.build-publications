import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { bookmarks, users } from '../db/schema';
import { type CreateBookmarkInput } from '../schema';
import { createBookmark } from '../handlers/create_bookmark';
import { eq } from 'drizzle-orm';

const testInput: CreateBookmarkInput = {
  url: 'https://example.com',
  title: 'Example Site',
  description: 'A test bookmark',
};

describe('createBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a bookmark without user', async () => {
    const result = await createBookmark(testInput);

    expect(result.id).toBeDefined();
    expect(result.url).toBe(testInput.url);
    expect(result.title).toBe(testInput.title);
    expect(result.description).toBe(testInput.description!);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.user_id).toBeNull();
  });

  it('should persist the bookmark in the database', async () => {
    const result = await createBookmark(testInput);

    const rows = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.id, result.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.url).toBe(testInput.url);
    expect(row.title).toBe(testInput.title);
    expect(row.description).toBe(testInput.description!);
    expect(row.created_at).toBeInstanceOf(Date);
    expect(row.user_id).toBeNull();
  });

  it('should associate bookmark with a user when ctx provides userId', async () => {
    // Create a user first
    const [newUser] = await db
      .insert(users)
      .values({ email: 'user@example.com', password_hash: 'hashed' })
      .returning()
      .execute();

    const result = await createBookmark(testInput, { userId: newUser.id });

    expect(result.user_id).toBe(newUser.id);

    const rows = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.id, result.id))
      .execute();

    expect(rows).toHaveLength(1);
    expect(rows[0].user_id).toBe(newUser.id);
  });
});
