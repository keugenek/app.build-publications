import { db } from '../db';
import { ipAllocationsTable } from '../db/schema';
import { type IpAllocation } from '../schema';

export const getIpAllocations = async (): Promise<IpAllocation[]> => {
  try {
    const results = await db.select()
      .from(ipAllocationsTable)
      .execute();

    return results.map(allocation => ({
      ...allocation,
      created_at: allocation.created_at,
      updated_at: allocation.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch IP allocations:', error);
    throw error;
  }
};
