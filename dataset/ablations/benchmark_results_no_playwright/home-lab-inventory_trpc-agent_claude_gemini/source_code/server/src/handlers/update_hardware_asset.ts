import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type UpdateHardwareAssetInput, type HardwareAsset } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateHardwareAsset(input: UpdateHardwareAssetInput): Promise<HardwareAsset> {
  try {
    // Check if the hardware asset exists
    const existingAsset = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, input.id))
      .execute();

    if (existingAsset.length === 0) {
      throw new Error(`Hardware asset with ID ${input.id} not found`);
    }

    // Prepare update data - only include fields that are provided
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.type !== undefined) {
      updateData.type = input.type;
    }
    if (input.manufacturer !== undefined) {
      updateData.manufacturer = input.manufacturer;
    }
    if (input.model !== undefined) {
      updateData.model = input.model;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Update the hardware asset
    const result = await db.update(hardwareAssetsTable)
      .set(updateData)
      .where(eq(hardwareAssetsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Hardware asset update failed:', error);
    throw error;
  }
}
