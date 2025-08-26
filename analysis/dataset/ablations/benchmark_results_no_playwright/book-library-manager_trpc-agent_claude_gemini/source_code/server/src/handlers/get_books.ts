import { db } from '../db';
import { booksTable } from '../db/schema';
import { type Book, type GetBooksQuery } from '../schema';
import { eq, and, or, ilike, type SQL } from 'drizzle-orm';

export async function getBooks(query?: GetBooksQuery): Promise<Book[]> {
  try {
    // Start with base query
    let dbQuery = db.select().from(booksTable);

    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (query) {
      // Search by title or author (case-insensitive partial match)
      if (query.search) {
        const searchTerm = `%${query.search}%`;
        conditions.push(
          or(
            ilike(booksTable.title, searchTerm),
            ilike(booksTable.author, searchTerm)
          )!
        );
      }

      // Filter by genre (exact match)
      if (query.genre) {
        conditions.push(eq(booksTable.genre, query.genre));
      }

      // Filter by reading status (exact match)
      if (query.reading_status) {
        conditions.push(eq(booksTable.reading_status, query.reading_status));
      }
    }

    // Apply conditions if any exist
    if (conditions.length > 0) {
      const finalQuery = dbQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions));
      const results = await finalQuery.execute();
      return results;
    }

    // Execute query for case with no conditions
    const results = await dbQuery.execute();
    return results;
  } catch (error) {
    console.error('Failed to fetch books:', error);
    throw error;
  }
}
