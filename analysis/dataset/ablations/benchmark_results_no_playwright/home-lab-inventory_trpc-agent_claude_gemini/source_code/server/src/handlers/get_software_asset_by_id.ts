import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type GetByIdInput, type SoftwareAsset } from '../schema';
import { eq } from 'drizzle-orm';

export async function getSoftwareAssetById(input: GetByIdInput): Promise<SoftwareAsset | null> {
  try {
    const results = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const softwareAsset = results[0];
    return {
      id: softwareAsset.id,
      name: softwareAsset.name,
      type: softwareAsset.type,
      description: softwareAsset.description,
      hardware_asset_id: softwareAsset.hardware_asset_id,
      created_at: softwareAsset.created_at,
      updated_at: softwareAsset.updated_at
    };
  } catch (error) {
    console.error('Software asset fetch failed:', error);
    throw error;
  }
}
