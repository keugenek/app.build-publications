import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { deleteTag } from '../handlers/delete_tag';
import { eq } from 'drizzle-orm';

describe('deleteTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a tag successfully', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a test tag
    const tagResult = await db.insert(tagsTable)
      .values({
        user_id: userId,
        name: 'Test Tag',
        color: '#FF0000'
      })
      .returning()
      .execute();
    
    const tagId = tagResult[0].id;

    // Delete the tag
    const result = await deleteTag(tagId, userId);

    expect(result).toBe(true);

    // Verify tag is deleted from database
    const remainingTags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, tagId))
      .execute();

    expect(remainingTags).toHaveLength(0);
  });

  it('should delete tag and clean up bookmark-tag relationships', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a test tag
    const tagResult = await db.insert(tagsTable)
      .values({
        user_id: userId,
        name: 'Test Tag',
        color: '#FF0000'
      })
      .returning()
      .execute();
    
    const tagId = tagResult[0].id;

    // Create a test bookmark
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        user_id: userId,
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'A test bookmark'
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

    // Verify relationship exists before deletion
    const relationshipsBefore = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.tag_id, tagId))
      .execute();

    expect(relationshipsBefore).toHaveLength(1);

    // Delete the tag
    const result = await deleteTag(tagId, userId);

    expect(result).toBe(true);

    // Verify tag is deleted
    const remainingTags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, tagId))
      .execute();

    expect(remainingTags).toHaveLength(0);

    // Verify bookmark-tag relationships are cleaned up
    const relationshipsAfter = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.tag_id, tagId))
      .execute();

    expect(relationshipsAfter).toHaveLength(0);

    // Verify bookmark still exists (only the relationship should be deleted)
    const remainingBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmarkId))
      .execute();

    expect(remainingBookmarks).toHaveLength(1);
  });

  it('should return false when tag does not exist', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const nonExistentTagId = 99999;

    const result = await deleteTag(nonExistentTagId, userId);

    expect(result).toBe(false);
  });

  it('should return false when tag belongs to different user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword',
        display_name: 'User One'
      })
      .returning()
      .execute();
    
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword',
        display_name: 'User Two'
      })
      .returning()
      .execute();
    
    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create a tag for user1
    const tagResult = await db.insert(tagsTable)
      .values({
        user_id: user1Id,
        name: 'User1 Tag',
        color: '#FF0000'
      })
      .returning()
      .execute();
    
    const tagId = tagResult[0].id;

    // Try to delete tag as user2
    const result = await deleteTag(tagId, user2Id);

    expect(result).toBe(false);

    // Verify tag still exists
    const remainingTags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, tagId))
      .execute();

    expect(remainingTags).toHaveLength(1);
  });

  it('should handle multiple bookmark relationships correctly', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a test tag
    const tagResult = await db.insert(tagsTable)
      .values({
        user_id: userId,
        name: 'Popular Tag',
        color: '#00FF00'
      })
      .returning()
      .execute();
    
    const tagId = tagResult[0].id;

    // Create multiple test bookmarks
    const bookmark1Result = await db.insert(bookmarksTable)
      .values({
        user_id: userId,
        url: 'https://example1.com',
        title: 'Bookmark 1',
        description: 'First bookmark'
      })
      .returning()
      .execute();

    const bookmark2Result = await db.insert(bookmarksTable)
      .values({
        user_id: userId,
        url: 'https://example2.com',
        title: 'Bookmark 2',
        description: 'Second bookmark'
      })
      .returning()
      .execute();
    
    const bookmark1Id = bookmark1Result[0].id;
    const bookmark2Id = bookmark2Result[0].id;

    // Create multiple bookmark-tag relationships
    await db.insert(bookmarkTagsTable)
      .values([
        { bookmark_id: bookmark1Id, tag_id: tagId },
        { bookmark_id: bookmark2Id, tag_id: tagId }
      ])
      .execute();

    // Verify relationships exist
    const relationshipsBefore = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.tag_id, tagId))
      .execute();

    expect(relationshipsBefore).toHaveLength(2);

    // Delete the tag
    const result = await deleteTag(tagId, userId);

    expect(result).toBe(true);

    // Verify all relationships are cleaned up
    const relationshipsAfter = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.tag_id, tagId))
      .execute();

    expect(relationshipsAfter).toHaveLength(0);

    // Verify both bookmarks still exist
    const remainingBookmarks = await db.select()
      .from(bookmarksTable)
      .execute();

    expect(remainingBookmarks).toHaveLength(2);
  });
});
