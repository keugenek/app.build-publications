import { type Book, type FilterBooksInput } from '../schema';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { ilike, eq, and, or, SQL } from 'drizzle-orm';

export const getBooks = async (filter?: FilterBooksInput): Promise<Book[]> => {
  try {
    // Build filters array
    const conditions: SQL<unknown>[] = [];
    
    if (filter?.search) {
      conditions.push(
        or(
          ilike(booksTable.title, `%${filter.search}%`),
          ilike(booksTable.author, `%${filter.search}%`)
        )!
      );
    }
    
    if (filter?.genre) {
      conditions.push(eq(booksTable.genre, filter.genre));
    }
    
    if (filter?.status) {
      conditions.push(eq(booksTable.status, filter.status));
    }
    
    // Build and execute query
    if (conditions.length > 0) {
      const result = await db.select()
        .from(booksTable)
        .where(and(...conditions))
        .orderBy(booksTable.created_at)
        .execute();
      return result;
    } else {
      const result = await db.select()
        .from(booksTable)
        .orderBy(booksTable.created_at)
        .execute();
      return result;
    }
  } catch (error) {
    console.error('Failed to fetch books:', error);
    throw error;
  }
};
