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
        description: input.description,
        host_id: input.host_id
      })
      .returning()
      .execute();

    const softwareAsset = result[0];
    return softwareAsset;
  } catch (error) {
    console.error('Software asset creation failed:', error);
    throw error;
  }
};
