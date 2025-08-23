import { type CreatePlantInput, type Plant } from '../schema';
import { db } from '../db';
import { plantsTable } from '../db/schema';

/**
 * Handler to create a new plant record.
 * Inserts the plant into the database and derives its mood based on the
 * `last_watered` timestamp. A plant is considered `Thirsty` if it hasn't been
 * watered for more than 7 days; otherwise it is `Happy`.
 */
export async function createPlant(input: CreatePlantInput): Promise<Plant> {
  try {
    // Use provided last_watered or default to now
    const lastWatered = input.last_watered ?? new Date();

    // Insert the new plant into the database and return the inserted row
    const [record] = await db
      .insert(plantsTable)
      .values({
        name: input.name,
        type: input.type,
        last_watered: lastWatered,
      })
      .returning()
      .execute();

    // Determine mood based on watering date
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const mood: Plant['mood'] =
      record.last_watered.getTime() < Date.now() - sevenDaysMs ? 'Thirsty' : 'Happy';

    // Return the full Plant object (including derived mood)
    return {
      id: record.id,
      name: record.name,
      type: record.type,
      last_watered: record.last_watered,
      mood,
    };
  } catch (error) {
    console.error('Failed to create plant:', error);
    throw error;
  }
}
