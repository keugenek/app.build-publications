import { db } from '../db';
import { eq } from 'drizzle-orm';
import { booksTable } from '../db/schema';
import { type DeleteBookInput, type Book } from '../schema';

/**
 * Delete a book by its ID and return the deleted record.
 * Throws an error if the book does not exist.
 */
export const deleteBook = async (input: DeleteBookInput): Promise<Book> => {
  try {
    // Perform deletion and return the deleted row
    const result = await db
      .delete(booksTable)
      .where(eq(booksTable.id, input.id))
      .returning()
      .execute();

    const deleted = result[0];
    if (!deleted) {
      throw new Error(`Book with id ${input.id} not found`);
    }

    // Shape the result to match the Zod output schema
    return {
      id: deleted.id,
      title: deleted.title,
      author: deleted.author,
      genre: deleted.genre,
      reading_status: deleted.reading_status,
      created_at: deleted.created_at,
    } as Book;
  } catch (error) {
    console.error('Delete book failed:', error);
    throw error;
  }
};
