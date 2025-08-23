import { db } from '../db';
import { bookmarksTable } from '../db/schema';
import { type CreateBookmarkInput, type Bookmark } from '../schema';

export const createBookmark = async (input: CreateBookmarkInput): Promise<Bookmark> => {
  try {
    const result = await db.insert(bookmarksTable)
      .values({
        user_id: input.user_id,
        url: input.url,
        title: input.title,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Bookmark creation failed:', error);
    throw error;
  }
};
