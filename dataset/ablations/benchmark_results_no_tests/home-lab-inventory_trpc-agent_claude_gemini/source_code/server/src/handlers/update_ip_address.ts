import { db } from '../db';
import { ipAddressesTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type UpdateIpAddressInput, type IpAddress } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateIpAddress(input: UpdateIpAddressInput): Promise<IpAddress | null> {
  try {
    // First verify the IP address exists
    const existing = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      return null;
    }

    // If updating assignment references, verify they exist
    if (input.hardware_asset_id !== undefined && input.hardware_asset_id !== null) {
      const hardwareExists = await db.select()
        .from(hardwareAssetsTable)
        .where(eq(hardwareAssetsTable.id, input.hardware_asset_id))
        .execute();
      
      if (hardwareExists.length === 0) {
        throw new Error(`Hardware asset with id ${input.hardware_asset_id} not found`);
      }
    }

    if (input.software_asset_id !== undefined && input.software_asset_id !== null) {
      const softwareExists = await db.select()
        .from(softwareAssetsTable)
        .where(eq(softwareAssetsTable.id, input.software_asset_id))
        .execute();
      
      if (softwareExists.length === 0) {
        throw new Error(`Software asset with id ${input.software_asset_id} not found`);
      }
    }

    // Build the update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.ip_address !== undefined) {
      updateData.ip_address = input.ip_address;
    }
    if (input.subnet !== undefined) {
      updateData.subnet = input.subnet;
    }
    if (input.assignment_type !== undefined) {
      updateData.assignment_type = input.assignment_type;
    }
    if (input.hardware_asset_id !== undefined) {
      updateData.hardware_asset_id = input.hardware_asset_id;
    }
    if (input.software_asset_id !== undefined) {
      updateData.software_asset_id = input.software_asset_id;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.is_reserved !== undefined) {
      updateData.is_reserved = input.is_reserved;
    }

    // Update the IP address record
    const result = await db.update(ipAddressesTable)
      .set(updateData)
      .where(eq(ipAddressesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('IP address update failed:', error);
    throw error;
  }
}
