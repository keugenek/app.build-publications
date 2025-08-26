import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type HardwareAsset, type IdParam } from '../schema';
import { eq } from 'drizzle-orm';

export async function getHardwareAsset(params: IdParam): Promise<HardwareAsset | null> {
  try {
    const result = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, params.id))
      .execute();

    // Return the first result or null if no asset found
    return result[0] || null;
  } catch (error) {
    console.error('Failed to get hardware asset:', error);
    throw error;
  }
}
