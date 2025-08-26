import { type Book } from '../schema';
import { db } from '../db';
import { booksTable } from '../db/schema';

/**
 * Placeholder handler for fetching all books.
 * In a real implementation this would query the database.
 */
export const getBooks = async (): Promise<Book[]> => {
    const results = await db.select().from(booksTable).execute();

  // Map database rows to the Book output schema
  return results.map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    genre: row.genre,
    reading_status: row.reading_status,
    created_at: row.created_at,
  }));
};
