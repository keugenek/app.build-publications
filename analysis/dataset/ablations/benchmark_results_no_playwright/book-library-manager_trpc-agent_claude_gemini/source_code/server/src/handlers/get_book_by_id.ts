import { db } from '../db';
import { booksTable } from '../db/schema';
import { type Book } from '../schema';
import { eq } from 'drizzle-orm';

export const getBookById = async (id: number): Promise<Book | null> => {
  try {
    // Query the database for a book with the given ID
    const result = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, id))
      .execute();

    // Return null if no book found, otherwise return the first result
    if (result.length === 0) {
      return null;
    }

    // Return the book (no numeric conversion needed as all fields are already proper types)
    return result[0];
  } catch (error) {
    console.error('Failed to fetch book by ID:', error);
    throw error;
  }
};
