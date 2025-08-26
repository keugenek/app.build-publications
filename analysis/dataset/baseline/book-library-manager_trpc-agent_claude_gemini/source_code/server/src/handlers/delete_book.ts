import { db } from '../db';
import { booksTable } from '../db/schema';
import { type DeleteBookInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteBook = async (input: DeleteBookInput): Promise<{ success: boolean }> => {
  try {
    // First, check if the book exists
    const existingBooks = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, input.id))
      .execute();

    if (existingBooks.length === 0) {
      throw new Error(`Book with ID ${input.id} not found`);
    }

    // Delete the book
    await db.delete(booksTable)
      .where(eq(booksTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Book deletion failed:', error);
    throw error;
  }
};
