import { db } from '../db';
import { booksTable } from '../db/schema';
import { type Book, type FilterBooksInput } from '../schema';
import { eq, desc, and, or, ilike, type SQL } from 'drizzle-orm';

export const getBooks = async (filter?: FilterBooksInput): Promise<Book[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter?.search) {
      // Case-insensitive search in title or author
      conditions.push(
        or(
          ilike(booksTable.title, `%${filter.search}%`),
          ilike(booksTable.author, `%${filter.search}%`)
        )!
      );
    }

    if (filter?.genre) {
      // Exact match for genre
      conditions.push(eq(booksTable.genre, filter.genre));
    }

    if (filter?.reading_status) {
      // Exact match for reading status
      conditions.push(eq(booksTable.reading_status, filter.reading_status));
    }

    // Build query with conditions
    const query = conditions.length > 0
      ? db.select()
          .from(booksTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(booksTable.created_at))
      : db.select()
          .from(booksTable)
          .orderBy(desc(booksTable.created_at));

    const results = await query.execute();

    // Convert to Book schema format
    return results.map(book => ({
      ...book,
      created_at: new Date(book.created_at),
      updated_at: new Date(book.updated_at)
    }));
  } catch (error) {
    console.error('Books retrieval failed:', error);
    throw error;
  }
};

export const getAllBooks = async (): Promise<Book[]> => {
  try {
    const results = await db.select()
      .from(booksTable)
      .orderBy(desc(booksTable.created_at))
      .execute();

    // Convert to Book schema format
    return results.map(book => ({
      ...book,
      created_at: new Date(book.created_at),
      updated_at: new Date(book.updated_at)
    }));
  } catch (error) {
    console.error('Books retrieval failed:', error);
    throw error;
  }
};
