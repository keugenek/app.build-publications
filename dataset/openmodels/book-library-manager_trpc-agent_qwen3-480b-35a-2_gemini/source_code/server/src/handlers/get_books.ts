import { db } from '../db';
import { booksTable } from '../db/schema';
import { type Book, type SearchBooksInput } from '../schema';
import { and, ilike, eq } from 'drizzle-orm';
import { sql, type SQL } from 'drizzle-orm';

export const getBooks = async (input?: SearchBooksInput): Promise<Book[]> => {
  try {
    const conditions: SQL<unknown>[] = [];

    if (input?.query) {
      conditions.push(
        sql`(${ilike(booksTable.title, '%' + input.query + '%')} OR ${ilike(booksTable.author, '%' + input.query + '%')})`
      );
    }

    if (input?.status) {
      conditions.push(eq(booksTable.status, input.status));
    }

    if (input?.genre) {
      conditions.push(eq(booksTable.genre, input.genre));
    }

    let query;
    if (conditions.length > 0) {
      query = db.select().from(booksTable).where(and(...conditions));
    } else {
      query = db.select().from(booksTable);
    }

    const results = await query.orderBy(booksTable.created_at).execute();

    return results.map(book => ({
      ...book,
      created_at: book.created_at,
      updated_at: book.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch books:', error);
    throw error;
  }
};
