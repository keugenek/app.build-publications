import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type UpdateHardwareAssetInput, type HardwareAsset } from '../schema';
import { eq } from 'drizzle-orm';

export const updateHardwareAsset = async (input: UpdateHardwareAssetInput): Promise<HardwareAsset> => {
  try {
    // Build the update object with only provided fields
    const updateData: Partial<typeof hardwareAssetsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.type !== undefined) {
      updateData.type = input.type;
    }
    if (input.make !== undefined) {
      updateData.make = input.make;
    }
    if (input.model !== undefined) {
      updateData.model = input.model;
    }
    if (input.location !== undefined) {
      updateData.location = input.location;
    }

    // Update the hardware asset
    const result = await db.update(hardwareAssetsTable)
      .set(updateData)
      .where(eq(hardwareAssetsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Hardware asset with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Hardware asset update failed:', error);
    throw error;
  }
};
