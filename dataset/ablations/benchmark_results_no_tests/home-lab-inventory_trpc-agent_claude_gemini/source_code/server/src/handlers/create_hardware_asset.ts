import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput, type HardwareAsset } from '../schema';

export const createHardwareAsset = async (input: CreateHardwareAssetInput): Promise<HardwareAsset> => {
  try {
    // Insert hardware asset record
    const result = await db.insert(hardwareAssetsTable)
      .values({
        name: input.name,
        type: input.type,
        status: input.status || 'active',
        model: input.model || null,
        manufacturer: input.manufacturer || null,
        serial_number: input.serial_number || null,
        location: input.location || null,
        notes: input.notes || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Hardware asset creation failed:', error);
    throw error;
  }
};
