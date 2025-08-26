import { db } from '../db';
import { booksTable } from '../db/schema';
import { type GetBookInput, type Book } from '../schema';
import { eq } from 'drizzle-orm';

export const getBook = async (input: GetBookInput): Promise<Book | null> => {
  try {
    // Query for a single book by ID
    const results = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, input.id))
      .execute();

    // Return the book if found, null otherwise
    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Book retrieval failed:', error);
    throw error;
  }
};
