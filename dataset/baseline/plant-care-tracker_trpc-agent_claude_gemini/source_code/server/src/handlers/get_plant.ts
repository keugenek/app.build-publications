import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type GetPlantInput, type PlantWithMood } from '../schema';
import { calculatePlantMood } from './calculate_mood';
import { eq } from 'drizzle-orm';

export async function getPlant(input: GetPlantInput): Promise<PlantWithMood | null> {
  try {
    // Query the database for the plant by ID
    const results = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, input.id))
      .execute();

    // Return null if no plant found
    if (results.length === 0) {
      return null;
    }

    const plant = results[0];

    // Calculate the plant's mood based on watering and light conditions
    const mood = calculatePlantMood(plant);

    // Return the plant with its calculated mood
    return {
      ...plant,
      mood
    };
  } catch (error) {
    console.error('Failed to get plant:', error);
    throw error;
  }
}
