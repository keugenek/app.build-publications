import { db } from '../db';
import { ipAllocationsTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type UpdateIpAllocationInput, type IpAllocation } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export async function updateIpAllocation(input: UpdateIpAllocationInput): Promise<IpAllocation> {
  try {
    // Check if the IP allocation exists
    const existingAllocation = await db.select()
      .from(ipAllocationsTable)
      .where(eq(ipAllocationsTable.id, input.id))
      .execute();

    if (existingAllocation.length === 0) {
      throw new Error(`IP allocation with ID ${input.id} not found`);
    }

    // If IP address is being updated, check for uniqueness
    if (input.ip_address) {
      const duplicateIp = await db.select()
        .from(ipAllocationsTable)
        .where(
          and(
            eq(ipAllocationsTable.ip_address, input.ip_address),
            ne(ipAllocationsTable.id, input.id)
          )
        )
        .execute();

      if (duplicateIp.length > 0) {
        throw new Error(`IP address ${input.ip_address} is already allocated`);
      }
    }

    // Validate hardware_asset_id exists if provided
    if (input.hardware_asset_id !== undefined && input.hardware_asset_id !== null) {
      const hardwareAsset = await db.select()
        .from(hardwareAssetsTable)
        .where(eq(hardwareAssetsTable.id, input.hardware_asset_id))
        .execute();

      if (hardwareAsset.length === 0) {
        throw new Error(`Hardware asset with ID ${input.hardware_asset_id} not found`);
      }
    }

    // Validate software_asset_id exists if provided
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

    if (input.asset_name !== undefined) {
      updateData.asset_name = input.asset_name;
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

    // Update the IP allocation
    const result = await db.update(ipAllocationsTable)
      .set(updateData)
      .where(eq(ipAllocationsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('IP allocation update failed:', error);
    throw error;
  }
}
