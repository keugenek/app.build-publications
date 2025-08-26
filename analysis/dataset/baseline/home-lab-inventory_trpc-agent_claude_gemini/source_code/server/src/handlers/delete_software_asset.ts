import { db } from '../db';
import { softwareAssetsTable, ipAllocationsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteSoftwareAsset(params: IdParam): Promise<{ success: boolean }> {
  try {
    // First, check if the software asset exists
    const existingAsset = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, params.id))
      .execute();

    if (existingAsset.length === 0) {
      throw new Error(`Software asset with ID ${params.id} not found`);
    }

    // Delete related IP allocations first (cascade deletion)
    await db.delete(ipAllocationsTable)
      .where(eq(ipAllocationsTable.software_asset_id, params.id))
      .execute();

    // Delete the software asset
    await db.delete(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, params.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Software asset deletion failed:', error);
    throw error;
  }
}
