import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type HardwareAsset, type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const getHardwareAsset = async (input: DeleteInput): Promise<HardwareAsset | null> => {
  try {
    // Query for the hardware asset by ID
    const results = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, input.id))
      .execute();

    // Return the first result or null if not found
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Hardware asset retrieval failed:', error);
    throw error;
  }
};
