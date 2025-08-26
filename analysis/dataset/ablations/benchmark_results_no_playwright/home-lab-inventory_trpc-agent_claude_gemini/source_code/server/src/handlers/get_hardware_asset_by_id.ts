import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type GetByIdInput, type HardwareAsset } from '../schema';
import { eq } from 'drizzle-orm';

export async function getHardwareAssetById(input: GetByIdInput): Promise<HardwareAsset | null> {
  try {
    // Query the hardware asset by ID
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
}
