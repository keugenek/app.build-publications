import { db } from '../db';
import { booksTable } from '../db/schema';
import { type Book } from '../schema';
import { type GetBookInput } from '../schema';
import { eq } from 'drizzle-orm';

export const getBook = async (input: GetBookInput): Promise<Book | null> => {
  try {
    const result = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, input.id))
      .execute();
    
    if (result.length === 0) {
      return null;
    }
    
    const book = result[0];
    return {
      ...book,
      created_at: new Date(book.created_at),
      updated_at: new Date(book.updated_at)
    };
  } catch (error) {
    console.error('Failed to fetch book:', error);
    throw error;
  }
};
