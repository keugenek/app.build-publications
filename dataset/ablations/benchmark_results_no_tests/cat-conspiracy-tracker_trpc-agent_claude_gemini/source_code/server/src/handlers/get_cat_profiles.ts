import { db } from '../db';
import { catProfilesTable } from '../db/schema';
import { type CatProfile } from '../schema';

export async function getCatProfiles(): Promise<CatProfile[]> {
  try {
    const results = await db.select()
      .from(catProfilesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch cat profiles:', error);
    throw error;
  }
}
