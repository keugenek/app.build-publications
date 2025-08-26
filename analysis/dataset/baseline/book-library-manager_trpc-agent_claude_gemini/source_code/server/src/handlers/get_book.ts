import { db } from '../db';
import { booksTable } from '../db/schema';
import { type GetBookInput, type Book } from '../schema';
import { eq } from 'drizzle-orm';

export const getBook = async (input: GetBookInput): Promise<Book | null> => {
  try {
    // Query the database for the book by ID
    const results = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, input.id))
      .execute();

    // Return null if no book found
    if (results.length === 0) {
      return null;
    }

    // Return the book (no numeric conversion needed for this schema)
    return results[0];
  } catch (error) {
    console.error('Get book failed:', error);
    throw error;
  }
};
