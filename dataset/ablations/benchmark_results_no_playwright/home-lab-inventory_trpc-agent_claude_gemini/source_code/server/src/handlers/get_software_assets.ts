import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type SoftwareAsset } from '../schema';

export const getSoftwareAssets = async (): Promise<SoftwareAsset[]> => {
  try {
    // Query all software assets from the database
    const results = await db.select()
      .from(softwareAssetsTable)
      .execute();

    // Return the results - no numeric conversions needed for this table
    return results;
  } catch (error) {
    console.error('Failed to fetch software assets:', error);
    throw error;
  }
};
