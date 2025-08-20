import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { type CreateSoftwareAssetInput, type SoftwareAsset } from '../schema';
import { eq } from 'drizzle-orm';

export const createSoftwareAsset = async (input: CreateSoftwareAssetInput): Promise<SoftwareAsset> => {
  try {
    // If hardware_asset_id is provided, verify it exists
    if (input.hardware_asset_id !== null && input.hardware_asset_id !== undefined) {
      const hardwareAsset = await db.select()
        .from(hardwareAssetsTable)
        .where(eq(hardwareAssetsTable.id, input.hardware_asset_id))
        .execute();

      if (hardwareAsset.length === 0) {
        throw new Error(`Hardware asset with ID ${input.hardware_asset_id} does not exist`);
      }
    }

    // Insert software asset record
    const result = await db.insert(softwareAssetsTable)
      .values({
        name: input.name,
        type: input.type,
        description: input.description,
        hardware_asset_id: input.hardware_asset_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Software asset creation failed:', error);
    throw error;
  }
};
