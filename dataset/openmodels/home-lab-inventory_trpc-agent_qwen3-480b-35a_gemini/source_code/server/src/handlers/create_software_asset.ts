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
        host_id: input.host_id,
        operating_system: input.operating_system,
        description: input.description
      })
      .returning()
      .execute();

    const softwareAsset = result[0];
    return {
      ...softwareAsset,
      host_id: softwareAsset.host_id
    };
  } catch (error) {
    console.error('Software asset creation failed:', error);
    throw error;
  }
};
