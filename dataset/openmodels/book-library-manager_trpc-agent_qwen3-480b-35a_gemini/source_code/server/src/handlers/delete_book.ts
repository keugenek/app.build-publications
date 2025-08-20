import { db } from '../db';
import { booksTable } from '../db/schema';
import { type DeleteBookInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteBook = async (input: DeleteBookInput): Promise<boolean> => {
  try {
    // Delete the book with the specified ID
    const result = await db.delete(booksTable)
      .where(eq(booksTable.id, input.id))
      .returning({ id: booksTable.id })
      .execute();

    // Return true if a book was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Book deletion failed:', error);
    throw error;
  }
};
