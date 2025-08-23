import { type UpdateBookInput, type Book } from '../schema';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { NewBook } from '../db/schema';

// Placeholder handler for updating a book.
export const updateBook = async (input: UpdateBookInput): Promise<Book | null> => {
  try {
    // Build update data object with only provided fields
    const updateData: Partial<NewBook> = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.author !== undefined) updateData.author = input.author;
    if (input.genre !== undefined) updateData.genre = input.genre;
    if (input.reading_status !== undefined) updateData.reading_status = input.reading_status;

    // If no fields to update, return null early
    if (Object.keys(updateData).length === 0) {
      return null;
    }

    const result = await db
      .update(booksTable)
      .set(updateData)
      .where(eq(booksTable.id, input.id))
      .returning()
      .execute();

    // result is an array; return first element or null if not found
    return result[0] ?? null;
  } catch (error) {
    console.error('Book update failed:', error);
    throw error;
  }
};
