import { db } from '../db';
import { ipAllocationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
  type CreateIPAllocationInput,
  type UpdateIPAllocationInput,
  type DeleteIPAllocationInput,
  type IPAllocation,
} from '../schema';

/** Handler for creating an IP allocation. */
export const createIPAllocation = async (
  input: CreateIPAllocationInput,
): Promise<IPAllocation> => {
  try {
    const result = await db
      .insert(ipAllocationsTable)
      .values({
        ip_address: input.ip_address,
        allocation_target_type: input.allocation_target_type,
        allocation_target_id: input.allocation_target_id,
        subnet: input.subnet,
        status: input.status,
      })
      .returning()
      .execute();
    // Returning array, take first row
    return result[0];
  } catch (error) {
    console.error('Failed to create IP allocation:', error);
    throw error;
  }
};

/** Handler for fetching all IP allocations. */
export const getIPAllocations = async (): Promise<IPAllocation[]> => {
  try {
    const rows = await db.select().from(ipAllocationsTable).execute();
    return rows;
  } catch (error) {
    console.error('Failed to fetch IP allocations:', error);
    throw error;
  }
};

/** Handler for updating an IP allocation. */
export const updateIPAllocation = async (
  input: UpdateIPAllocationInput,
): Promise<IPAllocation> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<
      typeof ipAllocationsTable.$inferInsert
    > = {};
    if (input.ip_address !== undefined) updateData.ip_address = input.ip_address;
    if (input.allocation_target_type !== undefined)
      updateData.allocation_target_type = input.allocation_target_type;
    if (input.allocation_target_id !== undefined)
      updateData.allocation_target_id = input.allocation_target_id;
    if (input.subnet !== undefined) updateData.subnet = input.subnet;
    if (input.status !== undefined) updateData.status = input.status;

    const result = await db
      .update(ipAllocationsTable)
      .set(updateData)
      .where(eq(ipAllocationsTable.id, input.id))
      .returning()
      .execute();
    return result[0];
  } catch (error) {
    console.error('Failed to update IP allocation:', error);
    throw error;
  }
};

/** Handler for deleting an IP allocation. */
export const deleteIPAllocation = async (
  input: DeleteIPAllocationInput,
): Promise<{ success: boolean }> => {
  try {
    const result = await db
      .delete(ipAllocationsTable)
      .where(eq(ipAllocationsTable.id, input.id))
      .returning()
      .execute();
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Failed to delete IP allocation:', error);
    throw error;
  }
};
