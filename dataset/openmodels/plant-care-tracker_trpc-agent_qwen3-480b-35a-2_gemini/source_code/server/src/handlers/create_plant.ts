import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type CreatePlantInput, type Plant } from '../schema';

export const createPlant = async (input: CreatePlantInput): Promise<Plant> => {
  try {
    // Insert plant record
    const result = await db.insert(plantsTable)
      .values({
        name: input.name,
        species: input.species,
        lastWatered: input.lastWatered,
        lightExposure: input.lightExposure
      })
      .returning()
      .execute();

    const plant = result[0];
    return {
      ...plant,
      lastWatered: new Date(plant.lastWatered),
      createdAt: new Date(plant.createdAt)
    };
  } catch (error) {
    console.error('Plant creation failed:', error);
    throw error;
  }
};
