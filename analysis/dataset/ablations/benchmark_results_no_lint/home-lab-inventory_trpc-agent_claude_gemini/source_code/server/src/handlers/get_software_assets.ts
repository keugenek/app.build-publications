import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type SoftwareAsset } from '../schema';

export const getSoftwareAssets = async (): Promise<SoftwareAsset[]> => {
  try {
    const results = await db.select()
      .from(softwareAssetsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch software assets:', error);
    throw error;
  }
};
