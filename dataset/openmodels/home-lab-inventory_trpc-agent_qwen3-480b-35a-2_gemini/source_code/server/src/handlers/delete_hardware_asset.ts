import { db } from '../db';
import { hardwareAssetsTable, softwareAssetsTable, ipAddressesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteHardwareAsset = async (id: number): Promise<boolean> => {
  try {
    // First, check if the hardware asset exists
    const existingAsset = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, id))
      .execute();

    if (existingAsset.length === 0) {
      return false; // Asset not found
    }

    // Check if there are any software assets that depend on this hardware asset
    const dependentSoftwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.host_id, id))
      .execute();

    if (dependentSoftwareAssets.length > 0) {
      throw new Error(`Cannot delete hardware asset with ID ${id} because it has dependent software assets`);
    }

    // Check if there are any IP addresses assigned to this hardware asset
    const assignedIpAddresses = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.hardware_asset_id, id))
      .execute();

    if (assignedIpAddresses.length > 0) {
      throw new Error(`Cannot delete hardware asset with ID ${id} because it has assigned IP addresses`);
    }

    // If we've passed all checks, delete the hardware asset
    const result = await db.delete(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, id))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Hardware asset deletion failed:', error);
    throw error;
  }
};
