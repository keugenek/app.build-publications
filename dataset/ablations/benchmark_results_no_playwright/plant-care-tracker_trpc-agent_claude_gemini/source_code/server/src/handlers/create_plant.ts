import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type CreatePlantInput, type Plant } from '../schema';

export const createPlant = async (input: CreatePlantInput): Promise<Plant> => {
  try {
    // Use current date/time if last_watered is not provided
    const lastWatered = input.last_watered || new Date();

    // Insert plant record
    const result = await db.insert(plantsTable)
      .values({
        name: input.name,
        last_watered: lastWatered
      })
      .returning()
      .execute();

    // Return the created plant
    return result[0];
  } catch (error) {
    console.error('Plant creation failed:', error);
    throw error;
  }
};
