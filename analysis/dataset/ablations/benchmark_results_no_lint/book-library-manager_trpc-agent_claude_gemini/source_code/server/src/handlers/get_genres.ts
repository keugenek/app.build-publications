import { db } from '../db';
import { booksTable } from '../db/schema';
import { sql } from 'drizzle-orm';

export const getGenres = async (): Promise<string[]> => {
  try {
    // Query for distinct genres ordered alphabetically
    const result = await db
      .selectDistinct({ genre: booksTable.genre })
      .from(booksTable)
      .orderBy(booksTable.genre)
      .execute();

    // Extract genre strings from the result objects
    return result.map(row => row.genre);
  } catch (error) {
    console.error('Failed to fetch genres:', error);
    throw error;
  }
};
