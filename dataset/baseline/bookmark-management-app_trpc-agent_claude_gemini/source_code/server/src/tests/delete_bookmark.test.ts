import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, bookmarksTable, tagsTable, bookmarkTagsTable, collectionsTable } from '../db/schema';
import { deleteBookmark } from '../handlers/delete_bookmark';
import { eq, and } from 'drizzle-orm';

describe('deleteBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a bookmark successfully', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test bookmark
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'A test bookmark',
        user_id: userId,
        collection_id: null
      })
      .returning()
      .execute();
    const bookmarkId = bookmarkResult[0].id;

    // Delete the bookmark
    const result = await deleteBookmark(bookmarkId, userId);

    expect(result).toBe(true);

    // Verify bookmark was deleted from database
    const remainingBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmarkId))
      .execute();

    expect(remainingBookmarks).toHaveLength(0);
  });

  it('should delete associated tag relationships', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test tags
    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'tech', user_id: userId },
        { name: 'tutorial', user_id: userId }
      ])
      .returning()
      .execute();
    const tagIds = tagResults.map(tag => tag.id);

    // Create test bookmark
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'A test bookmark',
        user_id: userId,
        collection_id: null
      })
      .returning()
      .execute();
    const bookmarkId = bookmarkResult[0].id;

    // Create bookmark-tag associations
    await db.insert(bookmarkTagsTable)
      .values([
        { bookmark_id: bookmarkId, tag_id: tagIds[0] },
        { bookmark_id: bookmarkId, tag_id: tagIds[1] }
      ])
      .execute();

    // Verify associations exist
    const initialAssociations = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();
    expect(initialAssociations).toHaveLength(2);

    // Delete the bookmark
    const result = await deleteBookmark(bookmarkId, userId);

    expect(result).toBe(true);

    // Verify tag associations were deleted
    const remainingAssociations = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();

    expect(remainingAssociations).toHaveLength(0);

    // Verify tags themselves still exist
    const remainingTags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.user_id, userId))
      .execute();

    expect(remainingTags).toHaveLength(2);
  });

  it('should return false for non-existent bookmark', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Try to delete non-existent bookmark
    const result = await deleteBookmark(999, userId);

    expect(result).toBe(false);
  });

  it('should return false when bookmark belongs to different user', async () => {
    // Create test users
    const userResults = await db.insert(usersTable)
      .values([
        {
          username: 'user1',
          email: 'user1@example.com',
          password_hash: 'hashed_password1'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password_hash: 'hashed_password2'
        }
      ])
      .returning()
      .execute();
    const user1Id = userResults[0].id;
    const user2Id = userResults[1].id;

    // Create bookmark owned by user1
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'User 1 Bookmark',
        description: 'A bookmark belonging to user 1',
        user_id: user1Id,
        collection_id: null
      })
      .returning()
      .execute();
    const bookmarkId = bookmarkResult[0].id;

    // Try to delete as user2
    const result = await deleteBookmark(bookmarkId, user2Id);

    expect(result).toBe(false);

    // Verify bookmark still exists
    const remainingBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmarkId))
      .execute();

    expect(remainingBookmarks).toHaveLength(1);
    expect(remainingBookmarks[0].user_id).toBe(user1Id);
  });

  it('should handle bookmark in collection correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        name: 'Test Collection',
        description: 'A test collection',
        user_id: userId
      })
      .returning()
      .execute();
    const collectionId = collectionResult[0].id;

    // Create test bookmark in collection
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'A test bookmark in collection',
        user_id: userId,
        collection_id: collectionId
      })
      .returning()
      .execute();
    const bookmarkId = bookmarkResult[0].id;

    // Delete the bookmark
    const result = await deleteBookmark(bookmarkId, userId);

    expect(result).toBe(true);

    // Verify bookmark was deleted
    const remainingBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmarkId))
      .execute();

    expect(remainingBookmarks).toHaveLength(0);

    // Verify collection still exists
    const remainingCollections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collectionId))
      .execute();

    expect(remainingCollections).toHaveLength(1);
  });

  it('should validate user ownership before deleting tag associations', async () => {
    // Create test users
    const userResults = await db.insert(usersTable)
      .values([
        {
          username: 'user1',
          email: 'user1@example.com',
          password_hash: 'hashed_password1'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password_hash: 'hashed_password2'
        }
      ])
      .returning()
      .execute();
    const user1Id = userResults[0].id;
    const user2Id = userResults[1].id;

    // Create tags for user1
    const tagResult = await db.insert(tagsTable)
      .values({
        name: 'user1tag',
        user_id: user1Id
      })
      .returning()
      .execute();
    const tagId = tagResult[0].id;

    // Create bookmark for user1
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'User 1 Bookmark',
        description: 'A bookmark belonging to user 1',
        user_id: user1Id,
        collection_id: null
      })
      .returning()
      .execute();
    const bookmarkId = bookmarkResult[0].id;

    // Create bookmark-tag association
    await db.insert(bookmarkTagsTable)
      .values({
        bookmark_id: bookmarkId,
        tag_id: tagId
      })
      .execute();

    // Try to delete as user2 (should fail and not affect associations)
    const result = await deleteBookmark(bookmarkId, user2Id);

    expect(result).toBe(false);

    // Verify bookmark and tag association still exist
    const remainingBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmarkId))
      .execute();

    const remainingAssociations = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();

    expect(remainingBookmarks).toHaveLength(1);
    expect(remainingAssociations).toHaveLength(1);
  });
});
