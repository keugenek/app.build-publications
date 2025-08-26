import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteSoftwareAsset = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    // Delete software asset record by ID
    const result = await db.delete(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, input.id))
      .returning()
      .execute();

    // Check if any rows were deleted
    if (result.length === 0) {
      throw new Error(`Software asset with ID ${input.id} not found`);
    }

    return { success: true };
  } catch (error) {
    console.error('Software asset deletion failed:', error);
    throw error;
  }
};
