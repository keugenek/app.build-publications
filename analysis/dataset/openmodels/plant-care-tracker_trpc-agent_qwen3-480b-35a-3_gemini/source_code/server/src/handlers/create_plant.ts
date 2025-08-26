import { type CreatePlantInput, type Plant } from '../schema';
import { db } from '../db';
import { plantsTable } from '../db/schema';

export const createPlant = async (input: CreatePlantInput): Promise<Plant> => {
  try {
    // Validate input using Zod schema
    const [newPlant] = await db.insert(plantsTable)
      .values({
        name: input.name,
        lastWateredDate: input.lastWateredDate,
        lightLevel: input.lightLevel,
        humidity: input.humidity,
      })
      .returning();
    
    return {
      ...newPlant,
      created_at: new Date(newPlant.created_at)
    };
  } catch (error) {
    console.error('Plant creation failed:', error);
    throw error;
  }
};
