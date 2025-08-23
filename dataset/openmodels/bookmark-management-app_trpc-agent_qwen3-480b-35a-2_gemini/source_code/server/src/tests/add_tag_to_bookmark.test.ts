import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, bookmarksTable, tagsTable, bookmarkTagsTable } from '../db/schema';
import { type AddTagToBookmarkInput } from '../schema';
import { addTagToBookmark } from '../handlers/add_tag_to_bookmark';
import { eq, and } from 'drizzle-orm';

describe('addTagToBookmark', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Create a bookmark
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        user_id: userId,
        url: 'https://example.com',
        title: 'Example Bookmark',
        description: 'An example bookmark for testing'
      })
      .returning()
      .execute();
    
    // Create a tag
    const tagResult = await db.insert(tagsTable)
      .values({
        user_id: userId,
        name: 'Test Tag'
      })
      .returning()
      .execute();
    
    // Store IDs for tests
    (global as any).testUserId = userId;
    (global as any).testBookmarkId = bookmarkResult[0].id;
    (global as any).testTagId = tagResult[0].id;
  });
  
  afterEach(resetDB);

  it('should create a bookmark-tag association', async () => {
    const input: AddTagToBookmarkInput = {
      bookmark_id: (global as any).testBookmarkId,
      tag_id: (global as any).testTagId
    };

    const result = await addTagToBookmark(input);

    // Validate the result
    expect(result).toBeDefined();
    expect(result.bookmark_id).toEqual((global as any).testBookmarkId);
    expect(result.tag_id).toEqual((global as any).testTagId);
  });

  it('should save the bookmark-tag association to database', async () => {
    const input: AddTagToBookmarkInput = {
      bookmark_id: (global as any).testBookmarkId,
      tag_id: (global as any).testTagId
    };

    await addTagToBookmark(input);

    // Query the database to confirm the association was saved
    const associations = await db.select()
      .from(bookmarkTagsTable)
      .where(
        and(
          eq(bookmarkTagsTable.bookmark_id, (global as any).testBookmarkId),
          eq(bookmarkTagsTable.tag_id, (global as any).testTagId)
        )
      )
      .execute();

    expect(associations).toHaveLength(1);
    expect(associations[0].bookmark_id).toEqual((global as any).testBookmarkId);
    expect(associations[0].tag_id).toEqual((global as any).testTagId);
  });

  it('should throw an error when trying to add a non-existent tag to a bookmark', async () => {
    const input: AddTagToBookmarkInput = {
      bookmark_id: (global as any).testBookmarkId,
      tag_id: 99999 // Non-existent tag ID
    };

    // This should throw a foreign key constraint error
    await expect(addTagToBookmark(input)).rejects.toThrow();
  });

  it('should throw an error when trying to add a tag to a non-existent bookmark', async () => {
    const input: AddTagToBookmarkInput = {
      bookmark_id: 99999, // Non-existent bookmark ID
      tag_id: (global as any).testTagId
    };

    // This should throw a foreign key constraint error
    await expect(addTagToBookmark(input)).rejects.toThrow();
  });
});
