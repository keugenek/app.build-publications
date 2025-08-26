import { db } from '../db';
import { booksTable } from '../db/schema';
import { type UpdateBookInput, type Book } from '../schema';
import { eq } from 'drizzle-orm';

export const updateBook = async (input: UpdateBookInput): Promise<Book | null> => {
  try {
    // Extract id from input and create update object with only provided fields
    const { id, ...updateFields } = input;
    
    // If no fields to update, return null
    if (Object.keys(updateFields).length === 0) {
      return null;
    }

    // Update the book and return the updated record
    // updated_at will be automatically updated due to defaultNow() in schema
    const result = await db.update(booksTable)
      .set({
        ...updateFields,
        updated_at: new Date() // Explicitly set updated_at timestamp
      })
      .where(eq(booksTable.id, id))
      .returning()
      .execute();

    // Return the updated book or null if no book was found
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Book update failed:', error);
    throw error;
  }
};
