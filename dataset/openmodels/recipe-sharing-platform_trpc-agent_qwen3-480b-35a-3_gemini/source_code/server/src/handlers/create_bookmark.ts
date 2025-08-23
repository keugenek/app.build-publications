import { db } from '../db';
import { bookmarksTable } from '../db/schema';
import { type CreateBookmarkInput, type Bookmark } from '../schema';

export const createBookmark = async (input: CreateBookmarkInput): Promise<Bookmark> => {
  try {
    // Insert bookmark record
    const result = await db.insert(bookmarksTable)
      .values({
        recipeId: input.recipeId,
        userId: input.userId
      })
      .returning()
      .execute();

    const bookmark = result[0];
    return {
      ...bookmark,
      createdAt: bookmark.createdAt
    };
  } catch (error) {
    console.error('Bookmark creation failed:', error);
    throw error;
  }
};
