import { db } from '../db';
import { eq } from 'drizzle-orm';
import { hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type CreateSoftwareAssetInput, type SoftwareAsset } from '../schema';

/**
 * Creates a software asset linked to an existing hardware asset.
 * Validates the host hardware asset exists before insertion to satisfy foreign key constraints.
 */
export const createSoftwareAsset = async (
  input: CreateSoftwareAssetInput,
): Promise<SoftwareAsset> => {
  try {
    // Verify that the host hardware asset exists
    const host = await db
      .select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, input.host_id))
      .execute();

    if (host.length === 0) {
      throw new Error('Hardware asset not found');
    }

    // Insert the new software asset
    const result = await db
      .insert(softwareAssetsTable)
      .values({
        name: input.name,
        type: input.type,
        host_id: input.host_id,
        // Use undefined to let column be nullable if description is null
        description: input.description ?? undefined,
      })
      .returning()
      .execute();

    const asset = result[0];
    // Ensure description is null when not provided
    return {
      id: asset.id,
      name: asset.name,
      type: asset.type,
      host_id: asset.host_id,
      description: asset.description ?? null,
      created_at: asset.created_at,
    } as SoftwareAsset;
  } catch (error) {
    console.error('Failed to create software asset:', error);
    throw error;
  }
};
