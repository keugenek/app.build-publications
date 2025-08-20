import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type UpdatePlantWateredInput, type Plant } from '../schema';
import { eq } from 'drizzle-orm';

export async function updatePlantWatered(input: UpdatePlantWateredInput): Promise<Plant> {
  try {
    // Update the plant's last_watered date and return the updated record
    const result = await db.update(plantsTable)
      .set({
        last_watered: input.last_watered
      })
      .where(eq(plantsTable.id, input.id))
      .returning()
      .execute();

    // Check if plant was found and updated
    if (result.length === 0) {
      throw new Error(`Plant with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Plant watering update failed:', error);
    throw error;
  }
}
