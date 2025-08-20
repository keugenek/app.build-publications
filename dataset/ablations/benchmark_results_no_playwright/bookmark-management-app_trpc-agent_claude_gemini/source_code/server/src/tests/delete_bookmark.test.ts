import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, bookmarksTable, tagsTable, bookmarkTagsTable } from '../db/schema';
import { type DeleteEntityInput } from '../schema';
import { deleteBookmark } from '../handlers/delete_bookmark';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashedpassword'
};

const testCollection = {
  user_id: 1,
  name: 'Test Collection',
  description: 'A test collection'
};

const testBookmark = {
  user_id: 1,
  collection_id: 1,
  title: 'Test Bookmark',
  url: 'https://example.com',
  description: 'A test bookmark'
};

const testTag = {
  user_id: 1,
  name: 'test-tag',
  color: '#ff0000'
};

const deleteInput: DeleteEntityInput = {
  id: 1
};

describe('deleteBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a bookmark successfully', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test collection
    await db.insert(collectionsTable).values(testCollection).execute();

    // Create test bookmark
    await db.insert(bookmarksTable).values(testBookmark).execute();

    const result = await deleteBookmark(deleteInput);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify bookmark is deleted from database
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, 1))
      .execute();

    expect(bookmarks).toHaveLength(0);
  });

  it('should delete bookmark with associated tags', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test collection
    await db.insert(collectionsTable).values(testCollection).execute();

    // Create test bookmark
    await db.insert(bookmarksTable).values(testBookmark).execute();

    // Create test tag
    await db.insert(tagsTable).values(testTag).execute();

    // Create bookmark-tag relationship
    await db.insert(bookmarkTagsTable).values({
      bookmark_id: 1,
      tag_id: 1
    }).execute();

    const result = await deleteBookmark(deleteInput);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify bookmark is deleted
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, 1))
      .execute();

    expect(bookmarks).toHaveLength(0);

    // Verify tag relationships are deleted (CASCADE)
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, 1))
      .execute();

    expect(bookmarkTags).toHaveLength(0);

    // Verify tag itself still exists
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, 1))
      .execute();

    expect(tags).toHaveLength(1);
  });

  it('should delete bookmark without collection', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create bookmark without collection
    const bookmarkWithoutCollection = {
      user_id: 1,
      collection_id: null,
      title: 'Uncategorized Bookmark',
      url: 'https://example.org',
      description: 'A bookmark without collection'
    };

    await db.insert(bookmarksTable).values(bookmarkWithoutCollection).execute();

    const result = await deleteBookmark(deleteInput);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify bookmark is deleted
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, 1))
      .execute();

    expect(bookmarks).toHaveLength(0);
  });

  it('should throw error when bookmark does not exist', async () => {
    const nonExistentInput: DeleteEntityInput = {
      id: 999
    };

    await expect(deleteBookmark(nonExistentInput))
      .rejects.toThrow(/bookmark with id 999 not found/i);
  });

  it('should handle multiple bookmarks correctly', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test collection
    await db.insert(collectionsTable).values(testCollection).execute();

    // Create multiple bookmarks
    await db.insert(bookmarksTable).values([
      { ...testBookmark, id: 1 },
      { ...testBookmark, id: 2, title: 'Second Bookmark', url: 'https://example2.com' }
    ]).execute();

    // Delete first bookmark
    const result = await deleteBookmark({ id: 1 });

    expect(result.success).toBe(true);

    // Verify only first bookmark is deleted
    const remainingBookmarks = await db.select()
      .from(bookmarksTable)
      .execute();

    expect(remainingBookmarks).toHaveLength(1);
    expect(remainingBookmarks[0].title).toBe('Second Bookmark');
  });
});
