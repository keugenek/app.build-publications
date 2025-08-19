import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { type UpdateSoftwareAssetInput, type SoftwareAsset } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSoftwareAsset = async (input: UpdateSoftwareAssetInput): Promise<SoftwareAsset> => {
  try {
    // If host_id is provided, validate that the hardware asset exists
    if (input.host_id !== undefined && input.host_id !== null) {
      const hostExists = await db.select()
        .from(hardwareAssetsTable)
        .where(eq(hardwareAssetsTable.id, input.host_id))
        .execute();
      
      if (hostExists.length === 0) {
        throw new Error(`Hardware asset with id ${input.host_id} not found`);
      }
    }

    // Build the update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.type !== undefined) {
      updateData.type = input.type;
    }
    if (input.host_id !== undefined) {
      updateData.host_id = input.host_id;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Update the software asset
    const result = await db.update(softwareAssetsTable)
      .set(updateData)
      .where(eq(softwareAssetsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Software asset with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Software asset update failed:', error);
    throw error;
  }
};
