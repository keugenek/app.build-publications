import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput, type HardwareAsset } from '../schema';

/**
 * Creates a hardware asset record in the database.
 * Returns the created hardware asset with proper type conversions.
 */
export const createHardwareAsset = async (
  input: CreateHardwareAssetInput,
): Promise<HardwareAsset> => {
  try {
    const result = await db
      .insert(hardwareAssetsTable)
      .values({
        name: input.name,
        type: input.type,
        description: input.description, // nullable field, can be null
      })
      .returning()
      .execute();

    // The insert returns an array with the inserted row(s)
    const asset = result[0];
    return {
      ...asset,
      // Ensure created_at is a Date instance (drizzle returns Date for timestamp)
      created_at: new Date(asset.created_at),
    } as HardwareAsset;
  } catch (error) {
    console.error('Hardware asset creation failed:', error);
    throw error;
  }
};
