import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type UpdatePlantInput, type Plant } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePlant = async (input: UpdatePlantInput): Promise<Plant> => {
  try {
    // Build the update data object dynamically based on provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.species !== undefined) updateData.species = input.species;
    if (input.lastWatered !== undefined) updateData.lastWatered = input.lastWatered;
    if (input.lightExposure !== undefined) updateData.lightExposure = input.lightExposure;
    if (input.createdAt !== undefined) updateData.createdAt = input.createdAt;

    // Perform the update operation
    const result = await db.update(plantsTable)
      .set(updateData)
      .where(eq(plantsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Plant with id ${input.id} not found`);
    }

    // Return the updated plant
    return {
      id: result[0].id,
      name: result[0].name,
      species: result[0].species,
      lastWatered: result[0].lastWatered,
      lightExposure: result[0].lightExposure,
      createdAt: result[0].createdAt
    };
  } catch (error) {
    console.error('Plant update failed:', error);
    throw error;
  }
};
