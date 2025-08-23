import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type HardwareAsset } from '../schema';

export const getHardwareAssets = async (): Promise<HardwareAsset[]> => {
  try {
    const results = await db.select()
      .from(hardwareAssetsTable)
      .execute();
    
    // Map database fields to schema fields and convert date strings back to Date objects
    return results.map(asset => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      model: asset.model,
      serialNumber: asset.serialNumber,
      location: asset.location,
      created_at: new Date(asset.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch hardware assets:', error);
    throw error;
  }
};
