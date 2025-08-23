import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type UpdateHardwareAssetInput, type HardwareAsset } from '../schema';
import { eq } from 'drizzle-orm';

export const updateHardwareAsset = async (input: UpdateHardwareAssetInput): Promise<HardwareAsset | null> => {
  try {
    // Build the update object with only provided fields
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.description !== undefined) updateData.description = input.description;

    // If no fields to update, return null
    if (Object.keys(updateData).length === 0) {
      return null;
    }

    // Update the hardware asset
    const result = await db.update(hardwareAssetsTable)
      .set(updateData)
      .where(eq(hardwareAssetsTable.id, input.id))
      .returning()
      .execute();

    // If no rows were updated, return null
    if (result.length === 0) {
      return null;
    }

    // Return the updated hardware asset
    return {
      id: result[0].id,
      name: result[0].name,
      type: result[0].type,
      description: result[0].description,
      created_at: result[0].created_at
    };
  } catch (error) {
    console.error('Hardware asset update failed:', error);
    throw error;
  }
};
