import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteHardwareAsset = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    // Check if the hardware asset exists before attempting to delete
    const existingAsset = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, input.id))
      .execute();

    if (existingAsset.length === 0) {
      throw new Error(`Hardware asset with id ${input.id} not found`);
    }

    // Delete the hardware asset
    const result = await db.delete(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Hardware asset deletion failed:', error);
    throw error;
  }
};
