import { db } from '../db';
import { ipAddressesTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type UpdateIpAddressInput, type IpAddress } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateIpAddress(input: UpdateIpAddressInput): Promise<IpAddress> {
  try {
    // First, verify the IP address exists
    const existingIpAddress = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, input.id))
      .execute();

    if (existingIpAddress.length === 0) {
      throw new Error(`IP address with ID ${input.id} not found`);
    }

    // Verify foreign key constraints if provided
    if (input.hardware_asset_id !== undefined && input.hardware_asset_id !== null) {
      const hardwareAsset = await db.select()
        .from(hardwareAssetsTable)
        .where(eq(hardwareAssetsTable.id, input.hardware_asset_id))
        .execute();

      if (hardwareAsset.length === 0) {
        throw new Error(`Hardware asset with ID ${input.hardware_asset_id} not found`);
      }
    }

    if (input.software_asset_id !== undefined && input.software_asset_id !== null) {
      const softwareAsset = await db.select()
        .from(softwareAssetsTable)
        .where(eq(softwareAssetsTable.id, input.software_asset_id))
        .execute();

      if (softwareAsset.length === 0) {
        throw new Error(`Software asset with ID ${input.software_asset_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.ip_address !== undefined) {
      updateData.ip_address = input.ip_address;
    }
    if (input.subnet_mask !== undefined) {
      updateData.subnet_mask = input.subnet_mask;
    }
    if (input.hardware_asset_id !== undefined) {
      updateData.hardware_asset_id = input.hardware_asset_id;
    }
    if (input.software_asset_id !== undefined) {
      updateData.software_asset_id = input.software_asset_id;
    }

    // Update the IP address record
    const result = await db.update(ipAddressesTable)
      .set(updateData)
      .where(eq(ipAddressesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('IP address update failed:', error);
    throw error;
  }
}
