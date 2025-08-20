import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookmarksTable, usersTable, tagsTable, bookmarkTagsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteBookmark } from '../handlers/delete_bookmark';

describe('deleteBookmark', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Create a test bookmark
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        user_id: userId,
        title: 'Test Bookmark',
        url: 'https://example.com',
        description: 'A test bookmark'
      })
      .returning()
      .execute();
    
    // Store the bookmark ID for tests
    (global as any).testBookmarkId = bookmarkResult[0].id;
    (global as any).testUserId = userId;
  });
  
  afterEach(async () => {
    await resetDB();
  });

  it('should delete a bookmark', async () => {
    const bookmarkId = (global as any).testBookmarkId;
    
    // Verify bookmark exists before deletion
    const beforeDelete = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmarkId))
      .execute();
    
    expect(beforeDelete).toHaveLength(1);
    
    // Delete the bookmark
    const result = await deleteBookmark(bookmarkId);
    
    // Check that deletion was successful
    expect(result).toBe(true);
    
    // Verify bookmark no longer exists
    const afterDelete = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmarkId))
      .execute();
    
    expect(afterDelete).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent bookmark', async () => {
    const result = await deleteBookmark(99999); // Non-existent ID
    expect(result).toBe(false);
  });

  it('should also delete related bookmark-tag associations', async () => {
    const bookmarkId = (global as any).testBookmarkId;
    const userId = (global as any).testUserId;
    
    // First create a tag
    const tagResult = await db.insert(tagsTable)
      .values({
        user_id: userId,
        name: 'test-tag'
      })
      .returning()
      .execute();
    
    const tagId = tagResult[0].id;
    
    // Create a bookmark-tag association
    await db.insert(bookmarkTagsTable)
      .values({
        bookmark_id: bookmarkId,
        tag_id: tagId
      })
      .execute();
    
    // Verify association exists
    const beforeDelete = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();
    
    expect(beforeDelete).toHaveLength(1);
    
    // Delete the bookmark
    await deleteBookmark(bookmarkId);
    
    // Verify association is also deleted
    const afterDelete = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();
    
    expect(afterDelete).toHaveLength(0);
  });
});
