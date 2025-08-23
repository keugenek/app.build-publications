import { eq } from 'drizzle-orm';
import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type SoftwareAsset } from '../schema';

export const getSoftwareAsset = async (id: number): Promise<SoftwareAsset | null> => {
  try {
    const result = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const softwareAsset = result[0];
    return {
      ...softwareAsset,
      created_at: new Date(softwareAsset.created_at)
    };
  } catch (error) {
    console.error('Failed to fetch software asset:', error);
    throw error;
  }
};
