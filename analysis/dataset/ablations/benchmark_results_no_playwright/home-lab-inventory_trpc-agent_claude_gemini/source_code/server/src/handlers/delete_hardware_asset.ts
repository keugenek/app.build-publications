import { db } from '../db';
import { hardwareAssetsTable, softwareAssetsTable, ipAddressesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteHardwareAsset(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // Check if hardware asset exists
    const existingAsset = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, input.id))
      .execute();

    if (existingAsset.length === 0) {
      throw new Error(`Hardware asset with ID ${input.id} not found`);
    }

    // Check for related software assets that would become orphaned
    const relatedSoftwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.hardware_asset_id, input.id))
      .execute();

    // Check for related IP addresses that would become orphaned
    const relatedIpAddresses = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.hardware_asset_id, input.id))
      .execute();

    // Delete related records first to maintain referential integrity
    if (relatedIpAddresses.length > 0) {
      await db.delete(ipAddressesTable)
        .where(eq(ipAddressesTable.hardware_asset_id, input.id))
        .execute();
    }

    if (relatedSoftwareAssets.length > 0) {
      // For each software asset, also delete its IP addresses
      for (const softwareAsset of relatedSoftwareAssets) {
        await db.delete(ipAddressesTable)
          .where(eq(ipAddressesTable.software_asset_id, softwareAsset.id))
          .execute();
      }

      // Delete the software assets
      await db.delete(softwareAssetsTable)
        .where(eq(softwareAssetsTable.hardware_asset_id, input.id))
        .execute();
    }

    // Finally, delete the hardware asset
    await db.delete(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Hardware asset deletion failed:', error);
    throw error;
  }
}
