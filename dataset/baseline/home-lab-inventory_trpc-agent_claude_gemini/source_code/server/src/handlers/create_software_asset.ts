import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { type CreateSoftwareAssetInput, type SoftwareAsset } from '../schema';
import { eq } from 'drizzle-orm';

export const createSoftwareAsset = async (input: CreateSoftwareAssetInput): Promise<SoftwareAsset> => {
  try {
    // If host_id is provided, validate that the hardware asset exists
    if (input.host_id !== null && input.host_id !== undefined) {
      const hostAssets = await db.select()
        .from(hardwareAssetsTable)
        .where(eq(hardwareAssetsTable.id, input.host_id))
        .execute();

      if (hostAssets.length === 0) {
        throw new Error(`Hardware asset with id ${input.host_id} not found`);
      }
    }

    // Insert software asset record
    const result = await db.insert(softwareAssetsTable)
      .values({
        name: input.name,
        type: input.type,
        host_id: input.host_id,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Software asset creation failed:', error);
    throw error;
  }
};
