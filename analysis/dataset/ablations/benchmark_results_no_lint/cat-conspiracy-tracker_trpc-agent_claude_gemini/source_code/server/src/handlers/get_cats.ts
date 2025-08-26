import { db } from '../db';
import { catsTable } from '../db/schema';
import { type Cat } from '../schema';

export const getCats = async (): Promise<Cat[]> => {
  try {
    // Fetch all cats from the database
    const result = await db.select()
      .from(catsTable)
      .execute();

    // Return the cats - no numeric conversions needed for this table
    return result;
  } catch (error) {
    console.error('Failed to fetch cats:', error);
    throw error;
  }
};
