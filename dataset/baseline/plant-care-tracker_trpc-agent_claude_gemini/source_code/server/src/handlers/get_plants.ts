import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type PlantWithMood } from '../schema';
import { calculatePlantMood } from './calculate_mood';

export async function getPlants(): Promise<PlantWithMood[]> {
  try {
    // Fetch all plants from the database
    const plants = await db.select()
      .from(plantsTable)
      .execute();

    // Transform plants and calculate mood for each
    return plants.map(plant => ({
      ...plant,
      mood: calculatePlantMood(plant)
    }));
  } catch (error) {
    console.error('Failed to get plants:', error);
    throw error;
  }
}
