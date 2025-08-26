import { db } from '../db';
import { bookmarks } from '../db/schema';
import { type Bookmark } from '../schema';
import { like, or } from 'drizzle-orm';

/**
 * Search bookmarks by a query string.
 *
 * Performs a case‑insensitive substring match against the `url`, `title`,
 * and `description` fields using the SQL `LIKE` operator. Returns all
 * matching bookmarks.
 */
export const searchBookmarks = async (query: string): Promise<Bookmark[]> => {
  // Guard against empty queries – returning everything would be unexpected.
  if (!query) return [];

  const pattern = `%${query}%`;

  const results = await db
    .select()
    .from(bookmarks)
    .where(
      or(
        like(bookmarks.url, pattern),
        like(bookmarks.title, pattern),
        like(bookmarks.description, pattern)
      )
    )
    .execute();

  return results;
};
