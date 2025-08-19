import { db } from '../db';
import { hardwareAssetsTable, softwareAssetsTable, ipAllocationsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteHardwareAsset(params: IdParam): Promise<{ success: boolean }> {
  try {
    // First check if the hardware asset exists
    const existingAsset = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, params.id))
      .execute();

    if (existingAsset.length === 0) {
      throw new Error(`Hardware asset with ID ${params.id} not found`);
    }

    // Handle cascade deletion for related records
    // 1. Update software assets that reference this hardware asset (set host_id to null)
    await db.update(softwareAssetsTable)
      .set({ host_id: null })
      .where(eq(softwareAssetsTable.host_id, params.id))
      .execute();

    // 2. Delete IP allocations that reference this hardware asset
    await db.delete(ipAllocationsTable)
      .where(eq(ipAllocationsTable.hardware_asset_id, params.id))
      .execute();

    // 3. Finally delete the hardware asset itself
    await db.delete(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, params.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Hardware asset deletion failed:', error);
    throw error;
  }
}
