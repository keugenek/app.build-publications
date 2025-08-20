import { db } from '../db';
import { booksTable } from '../db/schema';
import { sql } from 'drizzle-orm';

export async function getGenres(): Promise<string[]> {
  try {
    // Get all unique genres from books table, sorted alphabetically
    const result = await db.select({
      genre: booksTable.genre
    })
    .from(booksTable)
    .groupBy(booksTable.genre)
    .orderBy(sql`${booksTable.genre} ASC`)
    .execute();

    // Extract genre strings from the result objects
    return result.map(row => row.genre);
  } catch (error) {
    console.error('Failed to fetch genres:', error);
    throw error;
  }
}
