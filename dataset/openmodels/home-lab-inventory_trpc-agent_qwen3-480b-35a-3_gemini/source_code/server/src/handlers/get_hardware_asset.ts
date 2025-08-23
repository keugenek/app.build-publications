import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
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
      ...asset,
      created_at: new Date(asset.created_at)
    };
  } catch (error) {
    console.error('Failed to fetch hardware asset:', error);
    throw error;
  }
};
