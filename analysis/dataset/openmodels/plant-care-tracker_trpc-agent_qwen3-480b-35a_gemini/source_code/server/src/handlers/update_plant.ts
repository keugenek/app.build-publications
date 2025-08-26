import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type UpdatePlantInput, type Plant } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePlant = async (input: UpdatePlantInput): Promise<Plant> => {
  try {
    // Build the update data object dynamically based on provided fields
    const updateData: Partial<typeof plantsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.lastWateredDate !== undefined) {
      updateData.lastWateredDate = input.lastWateredDate;
    }

    // Update plant record
    const result = await db.update(plantsTable)
      .set(updateData)
      .where(eq(plantsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Plant with id ${input.id} not found`);
    }

    // Calculate mood based on last watered date
    const plant = result[0];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const mood = new Date(plant.lastWateredDate) > oneWeekAgo ? 'Happy' : 'Thirsty';

    return {
      ...plant,
      // Convert dates to ensure proper types
      lastWateredDate: new Date(plant.lastWateredDate),
      createdAt: new Date(plant.createdAt),
      mood
    };
  } catch (error) {
    console.error('Plant update failed:', error);
    throw error;
  }
};
