import { db } from '../db';
import { booksTable } from '../db/schema';
import { type DeleteBookInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteBook = async (input: DeleteBookInput): Promise<boolean> => {
  try {
    const result = await db.delete(booksTable)
      .where(eq(booksTable.id, input.id))
      .execute();
    
    // Return true if a row was deleted, false otherwise
    // rowCount can be null, so we default to 0
    return (result.rowCount || 0) > 0;
  } catch (error) {
    console.error('Book deletion failed:', error);
    throw error;
  }
};
