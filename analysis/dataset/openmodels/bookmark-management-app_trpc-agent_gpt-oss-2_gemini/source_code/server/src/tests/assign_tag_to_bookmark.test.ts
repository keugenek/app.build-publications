import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookmarks, tags, bookmarkTags } from '../db/schema';
import { assignTagToBookmark } from '../handlers/assign_tag_to_bookmark';
import { eq } from 'drizzle-orm';

describe('assignTagToBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should associate a tag with a bookmark and return the bookmark', async () => {
    // Insert a bookmark
    const [bookmark] = await db
      .insert(bookmarks)
      .values({
        url: 'https://example.com',
        title: 'Example',
        description: null,
        user_id: null,
      })
      .returning()
      .execute();

    // Insert a tag
    const [tag] = await db
      .insert(tags)
      .values({
        name: 'test-tag',
        user_id: null,
      })
      .returning()
      .execute();

    // Perform assignment
    const result = await assignTagToBookmark({
      bookmark_id: bookmark.id,
      tag_id: tag.id,
    });

    // Verify returned bookmark matches inserted data
    expect(result.id).toBe(bookmark.id);
    expect(result.url).toBe('https://example.com');
    expect(result.title).toBe('Example');
    expect(result.description).toBeNull();

    // Verify linking table entry exists
    const links = await db
      .select()
      .from(bookmarkTags)
      .where(eq(bookmarkTags.bookmark_id, bookmark.id))
      .execute();

    expect(links).toHaveLength(1);
    expect(links[0].tag_id).toBe(tag.id);
  });

  it('should throw an error if the bookmark does not exist', async () => {
    // Insert a tag only
    const [tag] = await db
      .insert(tags)
      .values({ name: 'orphan-tag', user_id: null })
      .returning()
      .execute();

    // Use a non-existent bookmark id
    const invalidBookmarkId = 9999;

    await expect(
      assignTagToBookmark({ bookmark_id: invalidBookmarkId, tag_id: tag.id })
    ).rejects.toThrow(/Bookmark with id 9999 not found/);
  });
});
