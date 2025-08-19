import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type CreatePlantInput, type PlantWithMood } from '../schema';
import { calculatePlantMood } from './calculate_mood';

export async function createPlant(input: CreatePlantInput): Promise<PlantWithMood> {
  try {
    // Insert plant record
    const result = await db.insert(plantsTable)
      .values({
        name: input.name,
        type: input.type,
        last_watered_date: input.last_watered_date,
        light_exposure: input.light_exposure
      })
      .returning()
      .execute();

    const plant = result[0];
    
    // Calculate mood based on plant data
    const mood = calculatePlantMood(plant);
    
    return {
      ...plant,
      mood
    };
  } catch (error) {
    console.error('Plant creation failed:', error);
    throw error;
  }
}
