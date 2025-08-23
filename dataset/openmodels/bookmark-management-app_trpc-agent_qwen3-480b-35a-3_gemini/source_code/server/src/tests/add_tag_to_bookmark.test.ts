import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, bookmarksTable, tagsTable, bookmarkTagsTable } from '../db/schema';
import { type AddTagToBookmarkInput } from '../schema';
import { addTagToBookmark } from '../handlers/add_tag_to_bookmark';
import { eq, and } from 'drizzle-orm';

describe('addTagToBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should add a tag to a bookmark', async () => {
    // First create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
      })
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create a bookmark
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        user_id: user.id,
        url: 'https://example.com',
        title: 'Example Bookmark',
        description: 'An example bookmark for testing',
      })
      .returning()
      .execute();
    
    const bookmark = bookmarkResult[0];

    // Create a tag
    const tagResult = await db.insert(tagsTable)
      .values({
        user_id: user.id,
        name: 'test-tag',
      })
      .returning()
      .execute();
    
    const tag = tagResult[0];

    // Prepare input for the handler
    const input: AddTagToBookmarkInput = {
      bookmark_id: bookmark.id,
      tag_id: tag.id,
    };

    // Call the handler
    await addTagToBookmark(input);

    // Verify the association was created
    const associations = await db.select()
      .from(bookmarkTagsTable)
      .where(and(
        eq(bookmarkTagsTable.bookmark_id, bookmark.id),
        eq(bookmarkTagsTable.tag_id, tag.id)
      ))
      .execute();

    expect(associations).toHaveLength(1);
    expect(associations[0].bookmark_id).toEqual(bookmark.id);
    expect(associations[0].tag_id).toEqual(tag.id);
  });

  it('should not create duplicate associations', async () => {
    // First create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test2@example.com',
        password_hash: 'hashed_password',
      })
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create a bookmark
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        user_id: user.id,
        url: 'https://example2.com',
        title: 'Example Bookmark 2',
        description: 'Another example bookmark for testing',
      })
      .returning()
      .execute();
    
    const bookmark = bookmarkResult[0];

    // Create a tag
    const tagResult = await db.insert(tagsTable)
      .values({
        user_id: user.id,
        name: 'test-tag-2',
      })
      .returning()
      .execute();
    
    const tag = tagResult[0];

    // Prepare input for the handler
    const input: AddTagToBookmarkInput = {
      bookmark_id: bookmark.id,
      tag_id: tag.id,
    };

    // Call the handler twice
    await addTagToBookmark(input);
    await addTagToBookmark(input);

    // Verify only one association was created
    const associations = await db.select()
      .from(bookmarkTagsTable)
      .where(and(
        eq(bookmarkTagsTable.bookmark_id, bookmark.id),
        eq(bookmarkTagsTable.tag_id, tag.id)
      ))
      .execute();

    expect(associations).toHaveLength(1);
  });
});
