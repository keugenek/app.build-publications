import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateSoftwareAssetInput, type SoftwareAsset } from '../schema';

export const updateSoftwareAsset = async (input: UpdateSoftwareAssetInput): Promise<SoftwareAsset | null> => {
  try {
    // First, check if the software asset exists
    const existingAsset = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, input.id))
      .execute();

    if (existingAsset.length === 0) {
      return null;
    }

    // If host_id is provided, verify that the hardware asset exists
    if (input.host_id !== undefined) {
      const hardwareAsset = await db.select()
        .from(hardwareAssetsTable)
        .where(eq(hardwareAssetsTable.id, input.host_id))
        .execute();

      if (hardwareAsset.length === 0) {
        throw new Error(`Hardware asset with id ${input.host_id} not found`);
      }
    }

    // Build the update object with only provided fields
    const updateData: Partial<typeof softwareAssetsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.type !== undefined) {
      updateData.type = input.type;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.host_id !== undefined) {
      updateData.host_id = input.host_id;
    }

    // Update the software asset
    const result = await db.update(softwareAssetsTable)
      .set(updateData)
      .where(eq(softwareAssetsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert the result to match the schema type
    const updatedAsset: SoftwareAsset = {
      id: result[0].id,
      name: result[0].name,
      type: result[0].type as 'VM' | 'container',
      description: result[0].description,
      host_id: result[0].host_id,
      created_at: result[0].created_at,
    };

    return updatedAsset;
  } catch (error) {
    console.error('Software asset update failed:', error);
    throw error;
  }
};
