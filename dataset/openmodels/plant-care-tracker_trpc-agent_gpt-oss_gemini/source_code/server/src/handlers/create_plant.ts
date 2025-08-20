import { type CreatePlantInput, type Plant } from '../schema';
import { db } from '../db';
import { plantsTable } from '../db/schema';
// No external date library used; simple JS Date arithmetic will compute mood.

/**
 * Creates a new plant record in the database and computes its mood based on the
 * `last_watered_at` timestamp. The mood is derived: "happy" if the plant was
 * watered within the last 7 days, otherwise "thirsty".
 */
export const createPlant = async (input: CreatePlantInput): Promise<Plant> => {
  try {
    const now = new Date();
    const lastWatered = input.last_watered_at ?? now;
    // Insert plant record
    const result = await db
      .insert(plantsTable)
      .values({
        name: input.name,
        species: input.species,
        last_watered_at: lastWatered,
      })
      .returning()
      .execute();

    const plantRow = result[0];
    // Compute mood based on last watered date vs now
    const diffDays = Math.floor(
      (now.getTime() - (plantRow.last_watered_at as Date).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const mood: Plant['mood'] = diffDays > 7 ? 'thirsty' : 'happy';

    return {
      id: plantRow.id,
      name: plantRow.name,
      species: plantRow.species,
      last_watered_at: plantRow.last_watered_at as Date,
      created_at: plantRow.created_at as Date,
      mood,
    };
  } catch (error) {
    console.error('Plant creation failed:', error);
    throw error;
  }
};
