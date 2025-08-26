import { type Plant } from '../schema';
import { db } from '../db';
import { plantsTable } from '../db/schema';

/**
 * Placeholder implementation for fetching all plants.
 * In a real implementation this would query the database.
 */
export const getPlants = async (): Promise<Plant[]> => {
  try {
    // Fetch all plant records
    const rows = await db.select().from(plantsTable).execute();

    // Derive mood based on last watered date (simple logic)
    const now = new Date();
    const DAY_MS = 24 * 60 * 60 * 1000;
    return rows.map(row => {
      const lastWatered = row.last_watered_at instanceof Date ? row.last_watered_at : new Date(row.last_watered_at as any);
      const diff = now.getTime() - lastWatered.getTime();
      const mood = diff <= 2 * DAY_MS ? 'happy' : 'thirsty';
      return {
        id: row.id,
        name: row.name,
        species: row.species,
        last_watered_at: lastWatered,
        created_at: row.created_at instanceof Date ? row.created_at : new Date(row.created_at as any),
        mood
      } as Plant;
    });
  } catch (error) {
    console.error('Fetching plants failed:', error);
    throw error;
  }
};
