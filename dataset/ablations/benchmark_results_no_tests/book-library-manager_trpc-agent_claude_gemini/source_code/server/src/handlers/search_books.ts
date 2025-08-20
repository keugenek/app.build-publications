import { db } from '../db';
import { booksTable } from '../db/schema';
import { type SearchBooksInput, type Book } from '../schema';
import { and, eq, ilike, desc, type SQL } from 'drizzle-orm';

export const searchBooks = async (input: SearchBooksInput): Promise<Book[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Case-insensitive partial matches for title, author, and genre
    if (input.title) {
      conditions.push(ilike(booksTable.title, `%${input.title}%`));
    }

    if (input.author) {
      conditions.push(ilike(booksTable.author, `%${input.author}%`));
    }

    if (input.genre) {
      conditions.push(ilike(booksTable.genre, `%${input.genre}%`));
    }

    // Exact match for reading_status
    if (input.reading_status) {
      conditions.push(eq(booksTable.reading_status, input.reading_status));
    }

    // Build the complete query
    const baseQuery = db.select().from(booksTable);
    
    const queryWithFilters = conditions.length > 0
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    // Apply ordering and execute
    const results = await queryWithFilters
      .orderBy(desc(booksTable.created_at))
      .execute();

    // Return results (no numeric conversions needed for this schema)
    return results;
  } catch (error) {
    console.error('Book search failed:', error);
    throw error;
  }
};
