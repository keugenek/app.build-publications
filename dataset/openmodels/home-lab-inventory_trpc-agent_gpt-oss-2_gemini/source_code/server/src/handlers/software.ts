import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { CreateSoftwareAssetInput, UpdateSoftwareAssetInput, DeleteSoftwareAssetInput, SoftwareAsset } from '../schema';

/** Handler for creating a software asset. */
export const createSoftwareAsset = async (input: CreateSoftwareAssetInput): Promise<SoftwareAsset> => {
  try {
    // Ensure host hardware exists to satisfy foreign key constraint (optional explicit check)
    const host = await db
      .select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, input.host_hardware_id))
      .execute();
    if (host.length === 0) {
      throw new Error(`Host hardware with id ${input.host_hardware_id} does not exist`);
    }

    const result = await db
      .insert(softwareAssetsTable)
      .values({
        name: input.name,
        type: input.type,
        host_hardware_id: input.host_hardware_id,
        operating_system: input.operating_system,
        purpose: input.purpose,
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Failed to create software asset:', error);
    throw error;
  }
};

/** Handler for fetching all software assets. */
export const getSoftwareAssets = async (): Promise<SoftwareAsset[]> => {
  try {
    const assets = await db.select().from(softwareAssetsTable).execute();
    return assets;
  } catch (error) {
    console.error('Failed to fetch software assets:', error);
    throw error;
  }
};

/** Handler for updating a software asset. */
export const updateSoftwareAsset = async (input: UpdateSoftwareAssetInput): Promise<SoftwareAsset> => {
  try {
    // Build update object with only defined fields
    const updateData: Partial<Omit<SoftwareAsset, 'id' | 'created_at'>> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.host_hardware_id !== undefined) updateData.host_hardware_id = input.host_hardware_id;
    if (input.operating_system !== undefined) updateData.operating_system = input.operating_system;
    if (input.purpose !== undefined) updateData.purpose = input.purpose;

    const result = await db
      .update(softwareAssetsTable)
      .set(updateData)
      .where(eq(softwareAssetsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Software asset with id ${input.id} not found`);
    }
    return result[0];
  } catch (error) {
    console.error('Failed to update software asset:', error);
    throw error;
  }
};

/** Handler for deleting a software asset. */
export const deleteSoftwareAsset = async (input: DeleteSoftwareAssetInput): Promise<{ success: boolean }> => {
  try {
    const result = await db
      .delete(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, input.id))
      .returning()
      .execute();
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Failed to delete software asset:', error);
    throw error;
  }
};
