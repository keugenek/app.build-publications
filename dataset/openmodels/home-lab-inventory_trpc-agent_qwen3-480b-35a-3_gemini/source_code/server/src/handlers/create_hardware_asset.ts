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
        model: input.model,
        serialNumber: input.serialNumber,
        location: input.location
      })
      .returning()
      .execute();

    const hardwareAsset = result[0];
    return {
      ...hardwareAsset,
      created_at: new Date(hardwareAsset.created_at)
    };
  } catch (error) {
    console.error('Hardware asset creation failed:', error);
    throw error;
  }
};
