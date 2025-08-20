import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type UpdateSoftwareAssetInput, type SoftwareAsset } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateSoftwareAsset(input: UpdateSoftwareAssetInput): Promise<SoftwareAsset | null> {
  try {
    // Extract ID and update fields
    const { id, ...updateFields } = input;

    // Prepare update data, filtering out undefined values
    const updateData: Record<string, any> = {};
    Object.entries(updateFields).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    // Add updated_at timestamp
    updateData['updated_at'] = new Date();

    // If no fields to update, return null
    if (Object.keys(updateData).length === 1) { // Only updated_at
      return null;
    }

    // Update the software asset
    const result = await db.update(softwareAssetsTable)
      .set(updateData)
      .where(eq(softwareAssetsTable.id, id))
      .returning()
      .execute();

    // Return the updated record or null if not found
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Software asset update failed:', error);
    throw error;
  }
}
