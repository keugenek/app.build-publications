import { type Book } from '../schema';
import { db } from '../db';
import { booksTable } from '../db/schema';

// Fetch all books from the database.
export const getBooks = async (): Promise<Book[]> => {
  // Query the database for all books
  const rows = await db.select().from(booksTable).execute();
  // Drizzle returns rows matching the DB schema; map to Zod Book type if needed
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    author: row.author,
    genre: row.genre,
    reading_status: row.reading_status,
    created_at: row.created_at
  }));

  
};
