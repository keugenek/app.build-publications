import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type UpdateSoftwareAssetInput, type SoftwareAsset } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSoftwareAsset = async (input: UpdateSoftwareAssetInput): Promise<SoftwareAsset | null> => {
  try {
    // Build the update object with only the fields that are provided
    const updateData: Partial<typeof softwareAssetsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.type !== undefined) {
      updateData.type = input.type;
    }
    if (input.operatingSystem !== undefined) {
      updateData.operatingSystem = input.operatingSystem;
    }
    if (input.host !== undefined) {
      updateData.host = input.host;
    }

    // Update the software asset
    const result = await db.update(softwareAssetsTable)
      .set(updateData)
      .where(eq(softwareAssetsTable.id, input.id))
      .returning()
      .execute();

    // Return the updated record or null if not found
    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Software asset update failed:', error);
    throw error;
  }
};
