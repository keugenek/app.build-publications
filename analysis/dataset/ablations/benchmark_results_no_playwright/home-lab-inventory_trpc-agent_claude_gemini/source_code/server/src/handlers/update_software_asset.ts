import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { type UpdateSoftwareAssetInput, type SoftwareAsset } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSoftwareAsset = async (input: UpdateSoftwareAssetInput): Promise<SoftwareAsset> => {
  try {
    // First, verify the software asset exists
    const existingSoftwareAsset = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, input.id))
      .execute();

    if (existingSoftwareAsset.length === 0) {
      throw new Error(`Software asset with ID ${input.id} not found`);
    }

    // If hardware_asset_id is provided, verify it exists
    if (input.hardware_asset_id !== undefined && input.hardware_asset_id !== null) {
      const existingHardwareAsset = await db.select()
        .from(hardwareAssetsTable)
        .where(eq(hardwareAssetsTable.id, input.hardware_asset_id))
        .execute();

      if (existingHardwareAsset.length === 0) {
        throw new Error(`Hardware asset with ID ${input.hardware_asset_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.type !== undefined) {
      updateData.type = input.type;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.hardware_asset_id !== undefined) {
      updateData.hardware_asset_id = input.hardware_asset_id;
    }

    // Update the software asset
    const result = await db.update(softwareAssetsTable)
      .set(updateData)
      .where(eq(softwareAssetsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Software asset update failed:', error);
    throw error;
  }
};
