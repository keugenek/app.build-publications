import { db } from '../db';
import { bookmarks } from '../db/schema';
import { type CreateBookmarkInput, type Bookmark } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Creates a new bookmark record in the database.
 * If a `userId` is provided in the context, it will be associated with the bookmark.
 */
export const createBookmark = async (
  input: CreateBookmarkInput,
  ctx: any = {}
): Promise<Bookmark> => {
  try {
    const result = await db
      .insert(bookmarks)
      .values({
        url: input.url,
        title: input.title,
        description: input.description ?? null,
        // If userId is supplied, associate it; otherwise leave null (nullable column)
        user_id: ctx.userId ?? null,
      })
      .returning()
      .execute();

    // Drizzle returns an array; we expect a single inserted row
    const bookmark = result[0];
    return bookmark as Bookmark;
  } catch (error) {
    console.error('Bookmark creation failed:', error);
    throw error;
  }
};
