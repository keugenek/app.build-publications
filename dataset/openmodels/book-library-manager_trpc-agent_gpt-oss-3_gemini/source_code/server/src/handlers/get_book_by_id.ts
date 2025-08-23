import { type Book } from '../schema';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { eq } from 'drizzle-orm';

// Placeholder handler for fetching a single book by ID.
export const getBookById = async (id: number): Promise<Book | null> => {
  try {
    const result = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, id))
      .execute();
    if (result.length === 0) {
      return null;
    }
    // result[0] matches Book type, no numeric conversion needed
    return result[0] as Book;
  } catch (error) {
    console.error('Failed to get book by id:', error);
    throw error;
  }

  

};
