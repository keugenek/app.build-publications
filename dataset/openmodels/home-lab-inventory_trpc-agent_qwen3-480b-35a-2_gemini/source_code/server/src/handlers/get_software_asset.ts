import { eq } from 'drizzle-orm';
import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type SoftwareAsset } from '../schema';

export const getSoftwareAsset = async (id: number): Promise<SoftwareAsset | null> => {
  try {
    const result = await db
      .select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, id))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    const softwareAsset = result[0];
    return {
      id: softwareAsset.id,
      name: softwareAsset.name,
      type: softwareAsset.type as 'VM' | 'container',
      description: softwareAsset.description,
      host_id: softwareAsset.host_id,
      created_at: softwareAsset.created_at,
    };
  } catch (error) {
    console.error('Failed to fetch software asset:', error);
    throw error;
  }
};
