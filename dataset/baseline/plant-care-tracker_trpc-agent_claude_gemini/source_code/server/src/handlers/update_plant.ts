import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type UpdatePlantInput, type PlantWithMood } from '../schema';
import { calculatePlantMood } from './calculate_mood';
import { eq } from 'drizzle-orm';

export async function updatePlant(input: UpdatePlantInput): Promise<PlantWithMood | null> {
  try {
    // First, check if the plant exists
    const existingPlant = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, input.id))
      .limit(1)
      .execute();

    if (existingPlant.length === 0) {
      return null; // Plant not found
    }

    // Prepare update data - only include fields that are provided
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.type !== undefined) {
      updateData.type = input.type;
    }
    if (input.last_watered_date !== undefined) {
      updateData.last_watered_date = input.last_watered_date;
    }
    if (input.light_exposure !== undefined) {
      updateData.light_exposure = input.light_exposure;
    }

    // Update the plant
    const result = await db.update(plantsTable)
      .set(updateData)
      .where(eq(plantsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null; // Update failed
    }

    const updatedPlant = result[0];

    // Calculate mood and return plant with mood
    const mood = calculatePlantMood(updatedPlant);
    
    return {
      ...updatedPlant,
      mood
    };
  } catch (error) {
    console.error('Plant update failed:', error);
    throw error;
  }
}
