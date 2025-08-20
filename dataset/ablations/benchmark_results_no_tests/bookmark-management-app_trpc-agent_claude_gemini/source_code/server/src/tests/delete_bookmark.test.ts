import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, bookmarksTable, tagsTable, bookmarkTagsTable, collectionsTable } from '../db/schema';
import { deleteBookmark } from '../handlers/delete_bookmark';
import { eq } from 'drizzle-orm';

describe('deleteBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let otherUserId: number;
  let testBookmarkId: number;
  let testCollectionId: number;
  let testTagId: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'test@example.com',
          password_hash: 'hashed_password',
          display_name: 'Test User'
        },
        {
          email: 'other@example.com',
          password_hash: 'hashed_password',
          display_name: 'Other User'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create test collection
    const collections = await db.insert(collectionsTable)
      .values({
        user_id: testUserId,
        name: 'Test Collection',
        description: 'A test collection'
      })
      .returning()
      .execute();

    testCollectionId = collections[0].id;

    // Create test tag
    const tags = await db.insert(tagsTable)
      .values({
        user_id: testUserId,
        name: 'Test Tag',
        color: '#ff0000'
      })
      .returning()
      .execute();

    testTagId = tags[0].id;

    // Create test bookmark
    const bookmarks = await db.insert(bookmarksTable)
      .values({
        user_id: testUserId,
        collection_id: testCollectionId,
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'A test bookmark'
      })
      .returning()
      .execute();

    testBookmarkId = bookmarks[0].id;

    // Create bookmark-tag relationship
    await db.insert(bookmarkTagsTable)
      .values({
        bookmark_id: testBookmarkId,
        tag_id: testTagId
      })
      .execute();
  });

  it('should delete bookmark and its tag relationships', async () => {
    const result = await deleteBookmark(testBookmarkId, testUserId);

    expect(result).toBe(true);

    // Verify bookmark was deleted
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, testBookmarkId))
      .execute();

    expect(bookmarks).toHaveLength(0);

    // Verify bookmark-tag relationships were deleted
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, testBookmarkId))
      .execute();

    expect(bookmarkTags).toHaveLength(0);

    // Verify tag still exists (should not be deleted)
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, testTagId))
      .execute();

    expect(tags).toHaveLength(1);

    // Verify collection still exists (should not be deleted)
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, testCollectionId))
      .execute();

    expect(collections).toHaveLength(1);
  });

  it('should return false when bookmark does not exist', async () => {
    const nonExistentId = 99999;
    const result = await deleteBookmark(nonExistentId, testUserId);

    expect(result).toBe(false);
  });

  it('should return false when bookmark belongs to different user', async () => {
    const result = await deleteBookmark(testBookmarkId, otherUserId);

    expect(result).toBe(false);

    // Verify bookmark still exists
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, testBookmarkId))
      .execute();

    expect(bookmarks).toHaveLength(1);

    // Verify bookmark-tag relationship still exists
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, testBookmarkId))
      .execute();

    expect(bookmarkTags).toHaveLength(1);
  });

  it('should handle bookmark without tag relationships', async () => {
    // Create a bookmark without any tag relationships
    const bookmarks = await db.insert(bookmarksTable)
      .values({
        user_id: testUserId,
        collection_id: testCollectionId,
        url: 'https://notags.com',
        title: 'No Tags Bookmark',
        description: 'A bookmark with no tags'
      })
      .returning()
      .execute();

    const noTagsBookmarkId = bookmarks[0].id;

    const result = await deleteBookmark(noTagsBookmarkId, testUserId);

    expect(result).toBe(true);

    // Verify bookmark was deleted
    const deletedBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, noTagsBookmarkId))
      .execute();

    expect(deletedBookmarks).toHaveLength(0);
  });

  it('should handle bookmark without collection', async () => {
    // Create a bookmark without a collection
    const bookmarks = await db.insert(bookmarksTable)
      .values({
        user_id: testUserId,
        collection_id: null,
        url: 'https://nocollection.com',
        title: 'No Collection Bookmark',
        description: 'A bookmark with no collection'
      })
      .returning()
      .execute();

    const noCollectionBookmarkId = bookmarks[0].id;

    const result = await deleteBookmark(noCollectionBookmarkId, testUserId);

    expect(result).toBe(true);

    // Verify bookmark was deleted
    const deletedBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, noCollectionBookmarkId))
      .execute();

    expect(deletedBookmarks).toHaveLength(0);
  });

  it('should handle bookmark with multiple tag relationships', async () => {
    // Create additional tags
    const additionalTags = await db.insert(tagsTable)
      .values([
        {
          user_id: testUserId,
          name: 'Tag 2',
          color: '#00ff00'
        },
        {
          user_id: testUserId,
          name: 'Tag 3',
          color: '#0000ff'
        }
      ])
      .returning()
      .execute();

    const tagId2 = additionalTags[0].id;
    const tagId3 = additionalTags[1].id;

    // Add additional tag relationships
    await db.insert(bookmarkTagsTable)
      .values([
        {
          bookmark_id: testBookmarkId,
          tag_id: tagId2
        },
        {
          bookmark_id: testBookmarkId,
          tag_id: tagId3
        }
      ])
      .execute();

    // Verify we have 3 tag relationships
    const initialBookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, testBookmarkId))
      .execute();

    expect(initialBookmarkTags).toHaveLength(3);

    const result = await deleteBookmark(testBookmarkId, testUserId);

    expect(result).toBe(true);

    // Verify all bookmark-tag relationships were deleted
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, testBookmarkId))
      .execute();

    expect(bookmarkTags).toHaveLength(0);

    // Verify all tags still exist
    const tags = await db.select()
      .from(tagsTable)
      .execute();

    expect(tags).toHaveLength(3); // All 3 tags should still exist
  });
});
