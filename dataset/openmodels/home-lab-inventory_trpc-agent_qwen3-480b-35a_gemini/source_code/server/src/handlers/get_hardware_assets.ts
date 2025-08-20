import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type HardwareAsset } from '../schema';

export const getHardwareAssets = async (): Promise<HardwareAsset[]> => {
  try {
    const results = await db.select()
      .from(hardwareAssetsTable)
      .execute();

    // Map the results to match the Zod schema
    return results.map(asset => ({
      ...asset,
      created_at: new Date(asset.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch hardware assets:', error);
    throw error;
  }
};
