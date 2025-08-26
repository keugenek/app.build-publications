import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { deleteBookmark } from '../handlers/delete_bookmark';
import { eq } from 'drizzle-orm';

describe('deleteBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a bookmark and its tag relationships', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        name: 'Test Collection',
        description: 'A collection for testing',
        user_id: userId
      })
      .returning()
      .execute();
    const collectionId = collectionResult[0].id;

    // Create test tag
    const tagResult = await db.insert(tagsTable)
      .values({
        name: 'Test Tag',
        color: '#FF0000',
        user_id: userId
      })
      .returning()
      .execute();
    const tagId = tagResult[0].id;

    // Create test bookmark
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'A bookmark for testing',
        user_id: userId,
        collection_id: collectionId
      })
      .returning()
      .execute();
    const bookmarkId = bookmarkResult[0].id;

    // Create bookmark-tag relationship
    await db.insert(bookmarkTagsTable)
      .values({
        bookmark_id: bookmarkId,
        tag_id: tagId
      })
      .execute();

    // Verify bookmark and relationship exist before deletion
    const beforeBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmarkId))
      .execute();
    const beforeRelationships = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();

    expect(beforeBookmarks).toHaveLength(1);
    expect(beforeRelationships).toHaveLength(1);

    // Delete the bookmark
    await deleteBookmark(bookmarkId, userId);

    // Verify bookmark is deleted
    const afterBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmarkId))
      .execute();
    expect(afterBookmarks).toHaveLength(0);

    // Verify bookmark-tag relationships are deleted
    const afterRelationships = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();
    expect(afterRelationships).toHaveLength(0);

    // Verify tag still exists (should not be deleted)
    const afterTags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, tagId))
      .execute();
    expect(afterTags).toHaveLength(1);
  });

  it('should delete bookmark without tag relationships', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test bookmark without tags
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: null,
        user_id: userId,
        collection_id: null
      })
      .returning()
      .execute();
    const bookmarkId = bookmarkResult[0].id;

    // Delete the bookmark
    await deleteBookmark(bookmarkId, userId);

    // Verify bookmark is deleted
    const afterBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmarkId))
      .execute();
    expect(afterBookmarks).toHaveLength(0);
  });

  it('should throw error when bookmark does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const nonExistentBookmarkId = 99999;

    // Attempt to delete non-existent bookmark
    expect(deleteBookmark(nonExistentBookmarkId, userId))
      .rejects.toThrow(/bookmark not found or access denied/i);
  });

  it('should throw error when trying to delete another users bookmark', async () => {
    // Create first user and their bookmark
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        username: 'user1'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'User1 Bookmark',
        description: 'A bookmark belonging to user1',
        user_id: user1Id,
        collection_id: null
      })
      .returning()
      .execute();
    const bookmarkId = bookmarkResult[0].id;

    // Create second user
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        username: 'user2'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Attempt to delete user1's bookmark as user2
    expect(deleteBookmark(bookmarkId, user2Id))
      .rejects.toThrow(/bookmark not found or access denied/i);

    // Verify bookmark still exists
    const afterBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmarkId))
      .execute();
    expect(afterBookmarks).toHaveLength(1);
  });

  it('should handle bookmark with multiple tag relationships', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create multiple test tags
    const tag1Result = await db.insert(tagsTable)
      .values({
        name: 'Tag 1',
        color: '#FF0000',
        user_id: userId
      })
      .returning()
      .execute();
    const tag1Id = tag1Result[0].id;

    const tag2Result = await db.insert(tagsTable)
      .values({
        name: 'Tag 2',
        color: '#00FF00',
        user_id: userId
      })
      .returning()
      .execute();
    const tag2Id = tag2Result[0].id;

    // Create test bookmark
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'Multi-tag Bookmark',
        description: 'A bookmark with multiple tags',
        user_id: userId,
        collection_id: null
      })
      .returning()
      .execute();
    const bookmarkId = bookmarkResult[0].id;

    // Create multiple bookmark-tag relationships
    await db.insert(bookmarkTagsTable)
      .values([
        { bookmark_id: bookmarkId, tag_id: tag1Id },
        { bookmark_id: bookmarkId, tag_id: tag2Id }
      ])
      .execute();

    // Verify relationships exist before deletion
    const beforeRelationships = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();
    expect(beforeRelationships).toHaveLength(2);

    // Delete the bookmark
    await deleteBookmark(bookmarkId, userId);

    // Verify all relationships are deleted
    const afterRelationships = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();
    expect(afterRelationships).toHaveLength(0);

    // Verify both tags still exist
    const afterTags = await db.select()
      .from(tagsTable)
      .execute();
    expect(afterTags).toHaveLength(2);
  });
});
