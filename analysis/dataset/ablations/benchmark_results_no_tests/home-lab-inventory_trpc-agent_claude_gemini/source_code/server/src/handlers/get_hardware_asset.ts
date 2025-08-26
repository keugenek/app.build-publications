import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type IdInput, type HardwareAsset } from '../schema';

export const getHardwareAsset = async (input: IdInput): Promise<HardwareAsset | null> => {
  try {
    const result = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, input.id))
      .execute();

    // Return null if no hardware asset found
    if (result.length === 0) {
      return null;
    }

    // Return the first (and only) result
    return result[0];
  } catch (error) {
    console.error('Failed to get hardware asset:', error);
    throw error;
  }
};
