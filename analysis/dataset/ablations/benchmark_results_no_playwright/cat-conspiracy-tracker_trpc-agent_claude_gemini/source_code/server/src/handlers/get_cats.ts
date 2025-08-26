import { db } from '../db';
import { catsTable } from '../db/schema';
import { type Cat } from '../schema';

export async function getCats(): Promise<Cat[]> {
  try {
    // Fetch all cats from the database
    const cats = await db.select()
      .from(catsTable)
      .execute();

    return cats;
  } catch (error) {
    console.error('Failed to fetch cats:', error);
    throw error;
  }
}
