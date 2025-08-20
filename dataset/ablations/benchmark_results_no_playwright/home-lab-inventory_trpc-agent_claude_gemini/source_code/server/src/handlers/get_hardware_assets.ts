import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type HardwareAsset } from '../schema';

export async function getHardwareAssets(): Promise<HardwareAsset[]> {
  try {
    const results = await db.select()
      .from(hardwareAssetsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch hardware assets:', error);
    throw error;
  }
}
