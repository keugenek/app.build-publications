import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type WaterPlantInput, type Plant } from '../schema';
import { eq } from 'drizzle-orm';

export const waterPlant = async (input: WaterPlantInput): Promise<Plant> => {
  try {
    // Update the plant's lastWateredDate to current date
    const result = await db.update(plantsTable)
      .set({
        lastWateredDate: new Date()
      })
      .where(eq(plantsTable.id, input.id))
      .returning()
      .execute();

    // Check if plant was found and updated
    if (result.length === 0) {
      throw new Error(`Plant with id ${input.id} not found`);
    }

    // Convert the result to match the Plant schema
    const plant = result[0];
    return {
      id: plant.id,
      name: plant.name,
      lastWateredDate: plant.lastWateredDate,
      mood: plant.lastWateredDate > new Date(Date.now() - 24 * 60 * 60 * 1000) ? 'Happy' : 'Thirsty',
      createdAt: plant.createdAt
    };
  } catch (error) {
    console.error('Water plant operation failed:', error);
    throw error;
  }
};
