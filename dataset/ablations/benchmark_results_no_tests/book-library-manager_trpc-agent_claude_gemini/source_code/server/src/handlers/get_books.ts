import { db } from '../db';
import { booksTable } from '../db/schema';
import { type Book } from '../schema';
import { desc } from 'drizzle-orm';

export const getBooks = async (): Promise<Book[]> => {
  try {
    // Query all books ordered by creation date (newest first)
    const results = await db.select()
      .from(booksTable)
      .orderBy(desc(booksTable.created_at))
      .execute();

    // Return results - no numeric conversions needed for this schema
    return results;
  } catch (error) {
    console.error('Get books failed:', error);
    throw error;
  }
};
