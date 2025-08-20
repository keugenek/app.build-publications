import { db } from '../db';
import { booksTable } from '../db/schema';
import { type DeleteBookInput, type SuccessResponse } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteBook = async (input: DeleteBookInput): Promise<SuccessResponse> => {
  try {
    // First check if the book exists
    const existingBook = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, input.id))
      .execute();

    if (existingBook.length === 0) {
      throw new Error(`Book with ID ${input.id} not found`);
    }

    // Delete the book
    await db.delete(booksTable)
      .where(eq(booksTable.id, input.id))
      .execute();

    return {
      success: true,
      message: `Book with ID ${input.id} has been deleted successfully`
    };
  } catch (error) {
    console.error('Book deletion failed:', error);
    throw error;
  }
};
