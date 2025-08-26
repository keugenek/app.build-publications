import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput, type HardwareAsset } from '../schema';

export async function createHardwareAsset(input: CreateHardwareAssetInput): Promise<HardwareAsset> {
  try {
    // Insert hardware asset record
    const result = await db.insert(hardwareAssetsTable)
      .values({
        name: input.name,
        type: input.type,
        make: input.make,
        model: input.model,
        location: input.location
      })
      .returning()
      .execute();

    const hardwareAsset = result[0];
    return hardwareAsset;
  } catch (error) {
    console.error('Hardware asset creation failed:', error);
    throw error;
  }
}
