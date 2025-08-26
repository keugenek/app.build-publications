import { type CreateIPAllocationInput, type IPAllocation } from '../schema';
import { db } from '../db';
import { ipAllocationsTable } from '../db/schema';

/**
 * Creates a new IP allocation in the database.
 * All numeric and nullable fields are handled appropriately.
 */
export const createIPAllocation = async (
  input: CreateIPAllocationInput,
): Promise<IPAllocation> => {
  try {
    // Insert the IP allocation record
    const result = await db
      .insert(ipAllocationsTable)
      .values({
        ip_address: input.ip_address,
        description: input.description ?? null,
        hardware_asset_id: input.hardware_asset_id ?? null,
        software_asset_id: input.software_asset_id ?? null,
      })
      .returning()
      .execute();

    // Drizzle returns an array with a single inserted row
    const allocation = result[0];
    return {
      ...allocation,
      // Ensure created_at is a Date instance
      created_at:
        allocation.created_at instanceof Date
          ? allocation.created_at
          : new Date(allocation.created_at as any),
    } as IPAllocation;
  } catch (error) {
    console.error('IP allocation creation failed:', error);
    throw error;
  }
};
