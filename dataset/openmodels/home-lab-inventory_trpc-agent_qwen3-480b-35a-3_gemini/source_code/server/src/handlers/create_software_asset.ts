import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type CreateSoftwareAssetInput, type SoftwareAsset } from '../schema';

export const createSoftwareAsset = async (input: CreateSoftwareAssetInput): Promise<SoftwareAsset> => {
  try {
    // Insert software asset record
    const result = await db.insert(softwareAssetsTable)
      .values({
        name: input.name,
        type: input.type,
        operatingSystem: input.operatingSystem,
        host: input.host
      })
      .returning()
      .execute();

    // Return the created software asset
    const softwareAsset = result[0];
    return {
      ...softwareAsset,
      created_at: new Date(softwareAsset.created_at) // Ensure it's a Date object
    };
  } catch (error) {
    console.error('Software asset creation failed:', error);
    throw error;
  }
};
