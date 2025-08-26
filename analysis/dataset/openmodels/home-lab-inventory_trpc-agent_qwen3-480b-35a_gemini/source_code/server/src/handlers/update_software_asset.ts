import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type UpdateSoftwareAssetInput, type SoftwareAsset } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSoftwareAsset = async (input: UpdateSoftwareAssetInput): Promise<SoftwareAsset> => {
  try {
    // Build the update object with only the provided fields
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.host_id !== undefined) updateData.host_id = input.host_id;
    if (input.operating_system !== undefined) updateData.operating_system = input.operating_system;
    if (input.description !== undefined) updateData.description = input.description;

    // Update the software asset record
    const result = await db.update(softwareAssetsTable)
      .set(updateData)
      .where(eq(softwareAssetsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Software asset with id ${input.id} not found`);
    }

    // Return the updated software asset
    return result[0];
  } catch (error) {
    console.error('Software asset update failed:', error);
    throw error;
  }
};
