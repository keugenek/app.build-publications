import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type SoftwareAsset } from '../schema';

export const getSoftwareAssets = async (): Promise<SoftwareAsset[]> => {
  try {
    // Fetch all software assets from the database
    const results = await db.select()
      .from(softwareAssetsTable)
      .execute();

    // Map database schema to Zod schema
    return results.map(asset => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      operatingSystem: asset.operatingSystem,
      host: asset.host,
      created_at: asset.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch software assets:', error);
    throw error;
  }
};
