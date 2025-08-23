// Tests for deleteBookmark handler
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { bookmarks } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteBookmark } from '../handlers/delete_bookmark';

// Helper to create a bookmark directly in DB
const createTestBookmark = async () => {
  const result = await db
    .insert(bookmarks)
    .values({
      url: 'https://example.com',
      title: 'Example',
      description: 'Test description',
    })
    .returning()
    .execute();
  return result[0];
};

describe('deleteBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing bookmark and return its data', async () => {
    const bookmark = await createTestBookmark();
    const deleted = await deleteBookmark(bookmark.id);

    // Returned data should match the original record
    expect(deleted.id).toBe(bookmark.id);
    expect(deleted.url).toBe(bookmark.url);
    expect(deleted.title).toBe(bookmark.title);
    expect(deleted.description).toBe(bookmark.description);
    // created_at may be Date objects; ensure they are equal (toISOString)
    expect(new Date(deleted.created_at).toISOString()).toBe(new Date(bookmark.created_at).toISOString());
    expect(deleted.user_id).toBe(bookmark.user_id ?? null);

    // Verify it no longer exists in the DB
    const remaining = await db.select().from(bookmarks).where(eq(bookmarks.id, bookmark.id)).execute();
    expect(remaining).toHaveLength(0);
  });

  it('should throw an error when trying to delete a non‑existent bookmark', async () => {
    await expect(deleteBookmark(9999)).rejects.toThrow(/not found/i);
  });
});
