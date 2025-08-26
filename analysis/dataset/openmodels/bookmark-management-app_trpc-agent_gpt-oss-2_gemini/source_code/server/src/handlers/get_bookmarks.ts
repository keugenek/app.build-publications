import { db } from '../db';
import { bookmarks } from '../db/schema';
import type { Bookmark } from '../schema';

/** Fetch all bookmarks from the database. */
export const getBookmarks = async (): Promise<Bookmark[]> => {
  try {
    const rows = await db.select().from(bookmarks).execute();
    // Map DB rows to the Bookmark Zod schema shape
    return rows.map((row) => ({
      id: row.id,
      url: row.url,
      title: row.title,
      description: row.description ?? null,
      created_at: row.created_at,
      user_id: row.user_id ?? null,
    }));
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error);
    throw error;
  }
};
