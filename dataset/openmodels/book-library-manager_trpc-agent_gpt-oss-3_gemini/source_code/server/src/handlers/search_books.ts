import { type SearchBooksInput, type Book } from '../schema';

import { db } from '../db';
import { booksTable } from '../db/schema';
import { and, eq } from 'drizzle-orm';

// Search books based on optional filters. Returns matching books.
export const searchBooks = async (input: SearchBooksInput): Promise<Book[]> => {
  // Initialize base query
  let query: any = db.select().from(booksTable);

  // Collect conditions for optional filters
  const conditions = [] as any[];
  if (input.title !== undefined) {
    conditions.push(eq(booksTable.title, input.title));
  }
  if (input.author !== undefined) {
    conditions.push(eq(booksTable.author, input.author));
  }
  if (input.genre !== undefined) {
    conditions.push(eq(booksTable.genre, input.genre));
  }
  if (input.reading_status !== undefined) {
    conditions.push(eq(booksTable.reading_status, input.reading_status));
  }

  // Apply where clause if any conditions exist
  if (conditions.length === 1) {
    query = query.where(conditions[0]);
  } else if (conditions.length > 1) {
    query = query.where(and(...conditions)); // Spread operator per rules
  }

  // Execute and return results
  const results = await query.execute();
  return results;
};
