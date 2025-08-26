import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type SoftwareAsset } from '../schema';

export const getSoftwareAssets = async (): Promise<SoftwareAsset[]> => {
  try {
    const results = await db.select()
      .from(softwareAssetsTable)
      .execute();

    // Map results to ensure proper types and handle date conversion
    return results.map(asset => ({
      ...asset,
      created_at: new Date(asset.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch software assets:', error);
    throw error;
  }
};
