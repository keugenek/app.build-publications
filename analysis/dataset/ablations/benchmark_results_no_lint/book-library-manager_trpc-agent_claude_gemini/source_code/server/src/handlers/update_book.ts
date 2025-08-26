import { db } from '../db';
import { booksTable } from '../db/schema';
import { type UpdateBookInput, type Book } from '../schema';
import { eq } from 'drizzle-orm';

export const updateBook = async (input: UpdateBookInput): Promise<Book | null> => {
  try {
    // First check if the book exists
    const existingBook = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, input.id))
      .execute();

    if (existingBook.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.author !== undefined) {
      updateData.author = input.author;
    }
    if (input.genre !== undefined) {
      updateData.genre = input.genre;
    }
    if (input.reading_status !== undefined) {
      updateData.reading_status = input.reading_status;
    }

    // Update the book
    const result = await db.update(booksTable)
      .set(updateData)
      .where(eq(booksTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Book update failed:', error);
    throw error;
  }
};
