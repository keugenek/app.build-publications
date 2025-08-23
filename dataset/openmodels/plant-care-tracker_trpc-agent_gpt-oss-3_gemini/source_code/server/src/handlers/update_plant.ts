import type { UpdatePlantInput, Plant, Mood } from '../schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { plantsTable } from '../db/schema';

/**
 * Handler to update the last watered date of a plant.
 * Returns the updated plant with calculated mood.
 */
export async function updatePlant(input: UpdatePlantInput): Promise<Plant> {
  try {
    // Perform the update
    const result = await db
      .update(plantsTable)
      .set({ last_watered: input.last_watered })
      .where(eq(plantsTable.id, input.id))
      .returning()
      .execute();

    const updated = result[0];
    if (!updated) {
      throw new Error(`Plant with id ${input.id} not found`);
    }

    // Determine mood based on last_watered date
    const mood: Mood =
      input.last_watered.getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000 ? 'Thirsty' : 'Happy';

    return {
      ...updated,
      mood,
    } as Plant;
  } catch (error) {
    console.error('Failed to update plant:', error);
    throw error;
  }
}
