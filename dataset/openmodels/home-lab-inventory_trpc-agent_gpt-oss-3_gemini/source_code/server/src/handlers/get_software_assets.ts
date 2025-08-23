import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type SoftwareAsset } from '../schema';

/**
 * Handler to fetch all software assets from the database.
 * Returns an array of {@link SoftwareAsset} objects.
 * Numeric conversions are not required for this table, but any
 * future numeric columns should follow the conversion rules.
 */
export const getSoftwareAssets = async (): Promise<SoftwareAsset[]> => {
  try {
    const rows = await db.select().from(softwareAssetsTable).execute();
    // Directly return rows; the schema already defines correct types.
    // If numeric columns are added later, remember to convert them using parseFloat.
    return rows.map((row) => ({
      ...row,
    }));
  } catch (error) {
    console.error('Failed to fetch software assets:', error);
    throw error;
  }
};
