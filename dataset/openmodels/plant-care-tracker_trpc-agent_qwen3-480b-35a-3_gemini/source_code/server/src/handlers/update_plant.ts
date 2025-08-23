import { type UpdatePlantInput, type Plant } from '../schema';
import { db } from '../db/index';
import { plantsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const updatePlant = async (input: UpdatePlantInput): Promise<Plant> => {
  try {
    // Build update object with only defined fields
    const updateData: Partial<typeof plantsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.lastWateredDate !== undefined) {
      updateData.lastWateredDate = input.lastWateredDate;
    }
    if (input.lightLevel !== undefined) {
      updateData.lightLevel = input.lightLevel;
    }
    if (input.humidity !== undefined) {
      updateData.humidity = input.humidity;
    }

    const [updatedPlant] = await db.update(plantsTable)
      .set(updateData)
      .where(eq(plantsTable.id, input.id))
      .returning();
    
    if (!updatedPlant) {
      throw new Error(`Plant with id ${input.id} not found`);
    }
    
    return updatedPlant;
  } catch (error) {
    console.error('Plant update failed:', error);
    throw error;
  }
};
