import { type CreatePlantInput, type Plant } from '../schema';
import { db } from '../db';
import { plants } from '../db/schema';

/**
 * Handler to create a new plant record.
 * In a real implementation this would persist the plant in the database.
 */
export const createPlant = async (input: CreatePlantInput): Promise<Plant> => {
  // Insert into DB, letting the DB set default last_watered if not provided
  const [record] = await db
    .insert(plants)
    .values({
      name: input.name,
      species: input.species,
      // If last_watered is undefined, omit to use DB default (now)
      ...(input.last_watered ? { last_watered: input.last_watered } : {}),
    })
    .returning()
    .execute();

  // The returned record matches the Plant type
  return record as Plant;
};
