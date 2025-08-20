import { db } from '../db';
import { ipAddressAllocationsTable } from '../db/schema';
import { type IpAddressAllocation } from '../schema';

export const getIpAddressAllocations = async (): Promise<IpAddressAllocation[]> => {
  try {
    const results = await db.select()
      .from(ipAddressAllocationsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch IP address allocations:', error);
    throw error;
  }
};
