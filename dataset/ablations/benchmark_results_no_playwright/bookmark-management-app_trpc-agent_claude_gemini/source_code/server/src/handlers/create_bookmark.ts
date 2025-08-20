import { db } from '../db';
import { bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type CreateBookmarkInput, type Bookmark } from '../schema';

export const createBookmark = async (input: CreateBookmarkInput): Promise<Bookmark> => {
  try {
    // Insert the bookmark record
    const result = await db.insert(bookmarksTable)
      .values({
        user_id: input.user_id,
        collection_id: input.collection_id || null,
        title: input.title,
        url: input.url,
        description: input.description || null
      })
      .returning()
      .execute();

    const bookmark = result[0];

    // If tag_ids are provided, create bookmark-tag relationships
    if (input.tag_ids && input.tag_ids.length > 0) {
      const bookmarkTagRecords = input.tag_ids.map(tag_id => ({
        bookmark_id: bookmark.id,
        tag_id: tag_id
      }));

      await db.insert(bookmarkTagsTable)
        .values(bookmarkTagRecords)
        .execute();
    }

    return bookmark;
  } catch (error) {
    console.error('Bookmark creation failed:', error);
    throw error;
  }
};
