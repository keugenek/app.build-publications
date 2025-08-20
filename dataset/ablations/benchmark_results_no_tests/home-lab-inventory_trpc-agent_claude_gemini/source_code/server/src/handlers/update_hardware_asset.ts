import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { type UpdateHardwareAssetInput, type HardwareAsset } from '../schema';

export const updateHardwareAsset = async (input: UpdateHardwareAssetInput): Promise<HardwareAsset | null> => {
  try {
    const { id, ...updateData } = input;

    // Build the update object, excluding undefined values
    const updateFields: Record<string, any> = {};
    
    if (updateData.name !== undefined) updateFields['name'] = updateData.name;
    if (updateData.type !== undefined) updateFields['type'] = updateData.type;
    if (updateData.status !== undefined) updateFields['status'] = updateData.status;
    if (updateData.model !== undefined) updateFields['model'] = updateData.model;
    if (updateData.manufacturer !== undefined) updateFields['manufacturer'] = updateData.manufacturer;
    if (updateData.serial_number !== undefined) updateFields['serial_number'] = updateData.serial_number;
    if (updateData.location !== undefined) updateFields['location'] = updateData.location;
    if (updateData.notes !== undefined) updateFields['notes'] = updateData.notes;

    // If no fields to update, return null
    if (Object.keys(updateFields).length === 0) {
      return null;
    }

    // Always update the updated_at timestamp
    updateFields['updated_at'] = sql`now()`;

    // Update the hardware asset
    const result = await db.update(hardwareAssetsTable)
      .set(updateFields)
      .where(eq(hardwareAssetsTable.id, id))
      .returning()
      .execute();

    // Return the updated asset or null if not found
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Hardware asset update failed:', error);
    throw error;
  }
};
