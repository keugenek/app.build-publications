import { type CreateHardwareAssetInput, type UpdateHardwareAssetInput, type DeleteHardwareAssetInput, type HardwareAsset } from '../schema';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Handler for creating a hardware asset.
 * Inserts a new record into the hardware_assets table and returns the created asset.
 */
export const createHardwareAsset = async (input: CreateHardwareAssetInput): Promise<HardwareAsset> => {
  try {
    const result = await db
      .insert(hardwareAssetsTable)
      .values({
        name: input.name,
        type: input.type,
        make: input.make,
        model: input.model,
        serial_number: input.serial_number,
        location: input.location,
      })
      .returning()
      .execute();
    const asset = result[0];
    return asset as HardwareAsset;
  } catch (error) {
    console.error('Failed to create hardware asset:', error);
    throw error;
  }
};

/**
 * Handler for fetching all hardware assets.
 * Returns an array of all hardware asset records.
 */
export const getHardwareAssets = async (): Promise<HardwareAsset[]> => {
  try {
    const results = await db.select().from(hardwareAssetsTable).execute();
    return results as HardwareAsset[];
  } catch (error) {
    console.error('Failed to get hardware assets:', error);
    throw error;
  }
};

/**
 * Handler for updating a hardware asset.
 * Updates only the provided fields and returns the updated asset.
 */
export const updateHardwareAsset = async (input: UpdateHardwareAssetInput): Promise<HardwareAsset> => {
  try {
    const updateValues: Partial<HardwareAsset> = {};
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.type !== undefined) updateValues.type = input.type as any;
    if (input.make !== undefined) updateValues.make = input.make;
    if (input.model !== undefined) updateValues.model = input.model;
    if (input.serial_number !== undefined) updateValues.serial_number = input.serial_number;
    if (input.location !== undefined) updateValues.location = input.location;

    const result = await db
      .update(hardwareAssetsTable)
      .set(updateValues)
      .where(eq(hardwareAssetsTable.id, input.id))
      .returning()
      .execute();
    const updated = result[0];
    return updated as HardwareAsset;
  } catch (error) {
    console.error('Failed to update hardware asset:', error);
    throw error;
  }
};

/**
 * Handler for deleting a hardware asset.
 * Returns a success flag when the record is removed.
 */
export const deleteHardwareAsset = async (input: DeleteHardwareAssetInput): Promise<{ success: boolean }> => {
  try {
    await db.delete(hardwareAssetsTable).where(eq(hardwareAssetsTable.id, input.id)).execute();
    return { success: true };
  } catch (error) {
    console.error('Failed to delete hardware asset:', error);
    throw error;
  }
};
