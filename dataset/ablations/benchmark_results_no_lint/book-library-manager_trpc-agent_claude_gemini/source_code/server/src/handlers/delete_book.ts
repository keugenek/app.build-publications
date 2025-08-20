import { db } from '../db';
import { booksTable } from '../db/schema';
import { type DeleteBookInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteBook = async (input: DeleteBookInput): Promise<{ success: boolean }> => {
  try {
    // Delete the book record by ID
    const result = await db.delete(booksTable)
      .where(eq(booksTable.id, input.id))
      .returning()
      .execute();

    // Return success based on whether a record was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Book deletion failed:', error);
    throw error;
  }
};
