import { type DeleteBookInput } from '../schema';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteBook = async (input: DeleteBookInput): Promise<boolean> => {
  try {
    // First check if the book exists
    const existingBooks = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, input.id))
      .limit(1);
    
    // If no book found with that ID, return false
    if (existingBooks.length === 0) {
      return false;
    }
    
    // Delete the book from the database
    await db.delete(booksTable).where(eq(booksTable.id, input.id));
    
    // Return true to indicate successful deletion
    return true;
  } catch (error) {
    console.error('Book deletion failed:', error);
    throw error;
  }
};
