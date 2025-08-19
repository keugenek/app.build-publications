import { db } from '../db';
import { booksTable } from '../db/schema';
import { type SearchBooksInput, type Book } from '../schema';
import { and, or, ilike, eq, desc, type SQL } from 'drizzle-orm';

export const searchBooks = async (input: SearchBooksInput): Promise<Book[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // General text search across title, author, and genre
    if (input.query) {
      const searchPattern = `%${input.query}%`;
      conditions.push(
        or(
          ilike(booksTable.title, searchPattern),
          ilike(booksTable.author, searchPattern),
          ilike(booksTable.genre, searchPattern)
        )!
      );
    }

    // Specific field filters
    if (input.title) {
      conditions.push(ilike(booksTable.title, `%${input.title}%`));
    }

    if (input.author) {
      conditions.push(ilike(booksTable.author, `%${input.author}%`));
    }

    if (input.genre) {
      conditions.push(ilike(booksTable.genre, `%${input.genre}%`));
    }

    if (input.reading_status) {
      conditions.push(eq(booksTable.reading_status, input.reading_status));
    }

    // Apply pagination
    const limit = input.limit ?? 50;
    const offset = input.offset ?? 0;

    // Build complete query in one statement to avoid TypeScript issues
    const results = conditions.length > 0
      ? await db.select()
          .from(booksTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(booksTable.created_at))
          .limit(limit)
          .offset(offset)
          .execute()
      : await db.select()
          .from(booksTable)
          .orderBy(desc(booksTable.created_at))
          .limit(limit)
          .offset(offset)
          .execute();

    // Return results (no numeric conversions needed for this schema)
    return results;
  } catch (error) {
    console.error('Book search failed:', error);
    throw error;
  }
};
