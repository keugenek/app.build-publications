import { db } from '../db';
import { booksTable } from '../db/schema';
import { type GetBookInput, type Book } from '../schema';
import { eq } from 'drizzle-orm';

export const getBook = async (input: GetBookInput): Promise<Book | null> => {
  try {
    // Query the database for a book with the given ID
    const results = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, input.id))
      .execute();

    // Return the book if found, or null if not found
    if (results.length === 0) {
      return null;
    }

    const book = results[0];
    return {
      ...book,
      // Convert timestamp fields to Date objects for proper schema compliance
      created_at: new Date(book.created_at),
      updated_at: new Date(book.updated_at)
    };
  } catch (error) {
    console.error('Book retrieval failed:', error);
    throw error;
  }
};
