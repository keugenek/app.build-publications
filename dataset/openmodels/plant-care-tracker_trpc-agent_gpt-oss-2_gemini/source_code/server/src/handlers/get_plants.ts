import { db } from '../db';
import { plants } from '../db/schema';
import { type Plant } from '../schema';

/**
 * Handler to fetch all plants.
 * In a real implementation this would query the database.
 */
export const getPlants = async (): Promise<Plant[]> => {
  const records = await db.select().from(plants).execute();
  return records as Plant[];
};
