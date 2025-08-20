import { db } from '../db';
import { ipAddressAllocationsTable } from '../db/schema';
import { type UpdateIpAddressAllocationInput, type IpAddressAllocation } from '../schema';
import { eq } from 'drizzle-orm';

export const updateIpAddressAllocation = async (input: UpdateIpAddressAllocationInput): Promise<IpAddressAllocation> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof ipAddressAllocationsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.ip_address !== undefined) {
      updateData.ip_address = input.ip_address;
    }
    if (input.purpose !== undefined) {
      updateData.purpose = input.purpose;
    }
    if (input.assigned_hardware_id !== undefined) {
      updateData.assigned_hardware_id = input.assigned_hardware_id;
    }
    if (input.assigned_software_id !== undefined) {
      updateData.assigned_software_id = input.assigned_software_id;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    // Update the IP address allocation record
    const result = await db.update(ipAddressAllocationsTable)
      .set(updateData)
      .where(eq(ipAddressAllocationsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`IP address allocation with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('IP address allocation update failed:', error);
    throw error;
  }
};
