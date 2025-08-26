import { db } from '../db';
import { booksTable } from '../db/schema';
import { type Book } from '../schema';

export const getBooks = async (): Promise<Book[]> => {
  try {
    // Fetch all books from the database
    const results = await db.select()
      .from(booksTable)
      .orderBy(booksTable.created_at)
      .execute();

    // Convert date strings to Date objects and return
    return results.map(book => ({
      ...book,
      status: book.status as Book['status'], // Cast status to proper enum type
      created_at: new Date(book.created_at),
      updated_at: new Date(book.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch books:', error);
    throw error;
  }
};
