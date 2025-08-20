import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type UpdateHardwareAssetInput, type HardwareAsset } from '../schema';
import { eq } from 'drizzle-orm';

export const updateHardwareAsset = async (input: UpdateHardwareAssetInput): Promise<HardwareAsset> => {
  try {
    // Build the update data object with only the provided fields
    const updateData: Partial<HardwareAsset> = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.make !== undefined) updateData.make = input.make;
    if (input.model !== undefined) updateData.model = input.model;
    if (input.serial_number !== undefined) updateData.serial_number = input.serial_number;
    if (input.description !== undefined) updateData.description = input.description;

    // Update the hardware asset record
    const result = await db.update(hardwareAssetsTable)
      .set(updateData)
      .where(eq(hardwareAssetsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Hardware asset with id ${input.id} not found`);
    }

    // Return the updated hardware asset
    return result[0];
  } catch (error) {
    console.error('Hardware asset update failed:', error);
    throw error;
  }
};
