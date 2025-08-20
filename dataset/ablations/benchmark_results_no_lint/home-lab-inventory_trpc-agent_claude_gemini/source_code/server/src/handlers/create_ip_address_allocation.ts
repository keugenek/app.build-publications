import { db } from '../db';
import { ipAddressAllocationsTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type CreateIpAddressAllocationInput, type IpAddressAllocation } from '../schema';
import { eq } from 'drizzle-orm';

export const createIpAddressAllocation = async (input: CreateIpAddressAllocationInput): Promise<IpAddressAllocation> => {
  try {
    // Validate foreign key references if they are provided
    if (input.assigned_hardware_id) {
      const hardwareAsset = await db.select()
        .from(hardwareAssetsTable)
        .where(eq(hardwareAssetsTable.id, input.assigned_hardware_id))
        .execute();
      
      if (hardwareAsset.length === 0) {
        throw new Error(`Hardware asset with ID ${input.assigned_hardware_id} does not exist`);
      }
    }

    if (input.assigned_software_id) {
      const softwareAsset = await db.select()
        .from(softwareAssetsTable)
        .where(eq(softwareAssetsTable.id, input.assigned_software_id))
        .execute();
      
      if (softwareAsset.length === 0) {
        throw new Error(`Software asset with ID ${input.assigned_software_id} does not exist`);
      }
    }

    // Insert IP address allocation record
    const result = await db.insert(ipAddressAllocationsTable)
      .values({
        ip_address: input.ip_address,
        purpose: input.purpose,
        assigned_hardware_id: input.assigned_hardware_id,
        assigned_software_id: input.assigned_software_id,
        status: input.status
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('IP address allocation creation failed:', error);
    throw error;
  }
};
