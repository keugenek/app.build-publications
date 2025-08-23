import { type UpdateBookInput, type Book } from '../schema';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Handler for updating an existing book in the database.
 * It updates only the fields provided in the input and returns the updated record.
 */
export const updateBook = async (input: UpdateBookInput): Promise<Book> => {
  try {
    // Build an object with only the fields that are defined in the input
    const updateData: Partial<import('../db/schema').NewBook> = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.author !== undefined) updateData.author = input.author;
    if (input.genre !== undefined) updateData.genre = input.genre;
    if (input.reading_status !== undefined) updateData.reading_status = input.reading_status;

    // Perform the update query
    const result = await db
      .update(booksTable)
      .set(updateData)
      .where(eq(booksTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Book not found');
    }
    const updated = result[0];
    return updated as Book;
  } catch (error) {
    console.error('Failed to update book:', error);
    throw error;
  }
};
