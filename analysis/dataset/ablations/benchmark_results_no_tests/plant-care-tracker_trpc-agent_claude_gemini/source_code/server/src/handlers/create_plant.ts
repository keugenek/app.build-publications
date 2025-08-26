import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type CreatePlantInput, type Plant } from '../schema';

export const createPlant = async (input: CreatePlantInput): Promise<Plant> => {
  try {
    // Insert plant record
    const result = await db.insert(plantsTable)
      .values({
        name: input.name,
        last_watered: input.last_watered
      })
      .returning()
      .execute();

    const plant = result[0];
    return plant;
  } catch (error) {
    console.error('Plant creation failed:', error);
    throw error;
  }
};
