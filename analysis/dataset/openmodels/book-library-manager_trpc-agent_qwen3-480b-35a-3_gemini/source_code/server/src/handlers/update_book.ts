import { type UpdateBookInput, type Book } from '../schema';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const updateBook = async (input: UpdateBookInput): Promise<Book> => {
  try {
    // Update the book in the database
    const result = await db.update(booksTable).set({
      title: input.title,
      author: input.author,
      genre: input.genre,
      status: input.status,
      updated_at: new Date()
    }).where(eq(booksTable.id, input.id)).returning();
    
    // Check if book was found and updated
    if (result.length === 0) {
      throw new Error(`Book with id ${input.id} not found`);
    }
    
    // Return the updated book
    return result[0];
  } catch (error) {
    console.error('Book update failed:', error);
    throw error;
  }
};
