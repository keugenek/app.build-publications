import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type DeleteEntityInput } from '../schema';
import { deleteTag } from '../handlers/delete_tag';
import { eq } from 'drizzle-orm';

// Test input
const testDeleteInput: DeleteEntityInput = {
  id: 1
};

describe('deleteTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing tag successfully', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a test tag
    const tagResult = await db.insert(tagsTable)
      .values({
        user_id: userId,
        name: 'Test Tag',
        color: '#ff0000'
      })
      .returning()
      .execute();
    
    const tagId = tagResult[0].id;

    // Delete the tag
    const result = await deleteTag({ id: tagId });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify tag no longer exists in database
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, tagId))
      .execute();

    expect(tags).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent tag', async () => {
    const result = await deleteTag({ id: 999 });

    expect(result.success).toBe(false);
  });

  it('should delete tag and cascade delete bookmark-tag associations', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a test tag
    const tagResult = await db.insert(tagsTable)
      .values({
        user_id: userId,
        name: 'Test Tag',
        color: '#ff0000'
      })
      .returning()
      .execute();
    
    const tagId = tagResult[0].id;

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
    
    const bookmarkId = bookmarkResult[0].id;

    // Create bookmark-tag association
    await db.insert(bookmarkTagsTable)
      .values({
        bookmark_id: bookmarkId,
        tag_id: tagId
      })
      .execute();

    // Verify the association exists
    const associationsBefore = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.tag_id, tagId))
      .execute();
    
    expect(associationsBefore).toHaveLength(1);

    // Delete the tag
    const result = await deleteTag({ id: tagId });

    expect(result.success).toBe(true);

    // Verify tag is deleted
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, tagId))
      .execute();

    expect(tags).toHaveLength(0);

    // Verify bookmark-tag associations are cascade deleted
    const associationsAfter = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.tag_id, tagId))
      .execute();
    
    expect(associationsAfter).toHaveLength(0);

    // Verify bookmark still exists (only the association was deleted)
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmarkId))
      .execute();
    
    expect(bookmarks).toHaveLength(1);
  });

  it('should handle multiple bookmark-tag associations correctly', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a test tag
    const tagResult = await db.insert(tagsTable)
      .values({
        user_id: userId,
        name: 'Popular Tag',
        color: '#00ff00'
      })
      .returning()
      .execute();
    
    const tagId = tagResult[0].id;

    // Create multiple bookmarks
    const bookmark1 = await db.insert(bookmarksTable)
      .values({
        user_id: userId,
        title: 'Bookmark 1',
        url: 'https://example1.com'
      })
      .returning()
      .execute();

    const bookmark2 = await db.insert(bookmarksTable)
      .values({
        user_id: userId,
        title: 'Bookmark 2',
        url: 'https://example2.com'
      })
      .returning()
      .execute();

    // Associate tag with multiple bookmarks
    await db.insert(bookmarkTagsTable)
      .values([
        {
          bookmark_id: bookmark1[0].id,
          tag_id: tagId
        },
        {
          bookmark_id: bookmark2[0].id,
          tag_id: tagId
        }
      ])
      .execute();

    // Verify associations exist
    const associationsBefore = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.tag_id, tagId))
      .execute();
    
    expect(associationsBefore).toHaveLength(2);

    // Delete the tag
    const result = await deleteTag({ id: tagId });

    expect(result.success).toBe(true);

    // Verify all associations are cascade deleted
    const associationsAfter = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.tag_id, tagId))
      .execute();
    
    expect(associationsAfter).toHaveLength(0);

    // Verify both bookmarks still exist
    const bookmarksAfter = await db.select()
      .from(bookmarksTable)
      .execute();
    
    expect(bookmarksAfter).toHaveLength(2);
  });
});
