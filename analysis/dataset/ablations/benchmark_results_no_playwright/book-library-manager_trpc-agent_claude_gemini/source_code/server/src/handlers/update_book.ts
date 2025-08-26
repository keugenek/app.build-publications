import { db } from '../db';
import { booksTable } from '../db/schema';
import { type UpdateBookInput, type Book } from '../schema';
import { eq } from 'drizzle-orm';

export const updateBook = async (input: UpdateBookInput): Promise<Book> => {
  try {
    // First, check if the book exists
    const existingBook = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, input.id))
      .execute();

    if (existingBook.length === 0) {
      throw new Error(`Book with ID ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
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

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Perform the update
    const result = await db.update(booksTable)
      .set(updateData)
      .where(eq(booksTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Book update failed:', error);
    throw error;
  }
};
