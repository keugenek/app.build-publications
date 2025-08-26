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
        hardware_asset_id: input.hardware_asset_id,
        operating_system: input.operating_system,
        purpose: input.purpose,
        resource_allocation: input.resource_allocation,
        ip_address_id: input.ip_address_id
      })
      .returning()
      .execute();

    // Return the created software asset
    const softwareAsset = result[0];
    return softwareAsset;
  } catch (error) {
    console.error('Software asset creation failed:', error);
    throw error;
  }
};
