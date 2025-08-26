import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type HardwareAsset } from '../schema';

/**
 * Fetch all hardware assets from the database.
 * Returns an array of {@link HardwareAsset} objects.
 */
export const getHardwareAssets = async (): Promise<HardwareAsset[]> => {
  try {
    // Build base query
    let query = db.select().from(hardwareAssetsTable);
    // Execute and return results directly – Drizzle returns proper Date objects for timestamps
    const results = await query.execute();
    return results;
  } catch (error) {
    console.error('Failed to fetch hardware assets:', error);
    throw error;
  }
};
