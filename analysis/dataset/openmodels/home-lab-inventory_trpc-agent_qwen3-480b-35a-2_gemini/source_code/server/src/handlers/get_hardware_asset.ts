import { eq } from 'drizzle-orm';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type HardwareAsset } from '../schema';

export const getHardwareAsset = async (id: number): Promise<HardwareAsset | null> => {
  try {
    const result = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const asset = result[0];
    return {
      id: asset.id,
      name: asset.name,
      type: asset.type as 'server' | 'switch',
      description: asset.description,
      created_at: asset.created_at
    };
  } catch (error) {
    console.error('Failed to fetch hardware asset:', error);
    throw error;
  }
};
