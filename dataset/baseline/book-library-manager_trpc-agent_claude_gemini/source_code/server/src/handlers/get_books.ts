import { db } from '../db';
import { booksTable } from '../db/schema';
import { type Book } from '../schema';
import { desc } from 'drizzle-orm';

export const getBooks = async (): Promise<Book[]> => {
  try {
    const results = await db.select()
      .from(booksTable)
      .orderBy(desc(booksTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Get books failed:', error);
    throw error;
  }
};
