import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type HardwareAsset } from '../schema';

export const getHardwareAssets = async (): Promise<HardwareAsset[]> => {
  try {
    const results = await db.select()
      .from(hardwareAssetsTable)
      .execute();

    return results.map(asset => ({
      ...asset,
      description: asset.description ?? null,
      created_at: asset.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch hardware assets:', error);
    throw error;
  }
};
