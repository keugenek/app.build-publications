import { db } from '../db';
import { catsTable } from '../db/schema';
import { type Cat } from '../schema';

export const getCats = async (): Promise<Cat[]> => {
  try {
    const result = await db.select()
      .from(catsTable)
      .execute();
    
    // Map the database result to match the Zod schema
    return result.map(cat => ({
      ...cat,
      created_at: new Date(cat.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch cats:', error);
    throw error;
  }
};
