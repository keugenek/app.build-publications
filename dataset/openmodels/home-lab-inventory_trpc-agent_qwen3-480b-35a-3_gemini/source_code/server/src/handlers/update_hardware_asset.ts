import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type UpdateHardwareAssetInput, type HardwareAsset } from '../schema';
import { eq } from 'drizzle-orm';

export const updateHardwareAsset = async (input: UpdateHardwareAssetInput): Promise<HardwareAsset | null> => {
  try {
    // Build the update object with only the fields that are provided
    const updateData: Partial<typeof hardwareAssetsTable.$inferInsert> = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.model !== undefined) updateData.model = input.model;
    if (input.serialNumber !== undefined) updateData.serialNumber = input.serialNumber;
    if (input.location !== undefined) updateData.location = input.location;

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

    // If no rows were affected, return null
    if (result.length === 0) {
      return null;
    }

    // Return the updated hardware asset
    return {
      id: result[0].id,
      name: result[0].name,
      type: result[0].type,
      model: result[0].model,
      serialNumber: result[0].serialNumber,
      location: result[0].location,
      created_at: result[0].created_at
    };
  } catch (error) {
    console.error('Hardware asset update failed:', error);
    throw error;
  }
};
