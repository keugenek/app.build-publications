import { db } from '../db';
import { booksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Book } from '../schema';

/**
 * Deletes a book by its ID and returns the deleted record.
 * If the book does not exist, returns null.
 */
export const deleteBook = async (id: number): Promise<Book | null> => {
  try {
    const result = await db
      .delete(booksTable)
      .where(eq(booksTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // The returned row matches the Book Zod schema shape.
    return result[0];
  } catch (error) {
    console.error('Delete book failed:', error);
    throw error;
  }
};
