import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type DeletePlantInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deletePlant(input: DeletePlantInput): Promise<{ success: boolean }> {
  try {
    // Delete the plant by ID
    const result = await db.delete(plantsTable)
      .where(eq(plantsTable.id, input.id))
      .returning()
      .execute();

    // Return success based on whether a plant was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Plant deletion failed:', error);
    throw error;
  }
}
