import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { tables } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { type AssignTagToBookmarkInput, type Bookmark } from '../schema';
import { removeTagFromBookmark } from '../handlers/remove_tag_from_bookmark';

/** Helper to create a bookmark */
const createBookmark = async (url: string, title: string): Promise<Bookmark> => {
  const rows = await db
    .insert(tables.bookmarks)
    .values({
      url,
      title,
      description: null,
      user_id: null,
    })
    .returning()
    .execute();
  return rows[0] as Bookmark;
};

/** Helper to create a tag */
const createTag = async (name: string) => {
  const rows = await db
    .insert(tables.tags)
    .values({ name, user_id: null })
    .returning()
    .execute();
  return rows[0];
};

/** Helper to link tag to bookmark */
const linkTag = async (bookmarkId: number, tagId: number) => {
  await db
    .insert(tables.bookmarkTags)
    .values({ bookmark_id: bookmarkId, tag_id: tagId })
    .execute();
};

describe('removeTagFromBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove the tag linking and return the bookmark', async () => {
    // Arrange: create bookmark, tag, and link them
    const bookmark = await createBookmark('https://example.com', 'Example');
    const tag = await createTag('test-tag');
    await linkTag(bookmark.id, tag.id);

    // Ensure link exists before removal
    const preLink = await db
      .select()
      .from(tables.bookmarkTags)
      .where(
        and(
          eq(tables.bookmarkTags.bookmark_id, bookmark.id),
          eq(tables.bookmarkTags.tag_id, tag.id)
        )
      )
      .execute();
    expect(preLink).toHaveLength(1);

    const input: AssignTagToBookmarkInput = {
      bookmark_id: bookmark.id,
      tag_id: tag.id,
    };

    // Act
    const result = await removeTagFromBookmark(input);

    // Assert: returned bookmark matches original
    expect(result.id).toBe(bookmark.id);
    expect(result.url).toBe('https://example.com');
    expect(result.title).toBe('Example');

    // Assert: link no longer exists
    const postLink = await db
      .select()
      .from(tables.bookmarkTags)
      .where(
        and(
          eq(tables.bookmarkTags.bookmark_id, bookmark.id),
          eq(tables.bookmarkTags.tag_id, tag.id)
        )
      )
      .execute();
    expect(postLink).toHaveLength(0);
  });
});
