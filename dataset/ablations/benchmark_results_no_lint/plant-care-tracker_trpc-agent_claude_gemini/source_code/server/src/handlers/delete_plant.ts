import { db } from '../db';
import { plantsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeletePlantInput } from '../schema';

export async function deletePlant(input: DeletePlantInput): Promise<{ success: boolean; id: number }> {
  try {
    // First, check if the plant exists
    const existingPlant = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, input.id))
      .execute();

    if (existingPlant.length === 0) {
      throw new Error(`Plant with ID ${input.id} not found`);
    }

    // Delete the plant
    const result = await db.delete(plantsTable)
      .where(eq(plantsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Failed to delete plant with ID ${input.id}`);
    }

    return {
      success: true,
      id: input.id
    };
  } catch (error) {
    console.error('Plant deletion failed:', error);
    throw error;
  }
}
