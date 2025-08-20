import { db } from '../db';
import { softwareAssetsTable, ipAddressesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteSoftwareAsset(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // First, update any IP addresses that reference this software asset to remove the reference
    await db.update(ipAddressesTable)
      .set({ software_asset_id: null })
      .where(eq(ipAddressesTable.software_asset_id, input.id))
      .execute();

    // Then delete the software asset
    const result = await db.delete(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, input.id))
      .returning()
      .execute();

    // Return success status based on whether a record was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Software asset deletion failed:', error);
    throw error;
  }
}
