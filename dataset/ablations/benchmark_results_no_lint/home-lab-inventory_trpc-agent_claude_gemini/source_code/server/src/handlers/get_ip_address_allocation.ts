import { db } from '../db';
import { ipAddressAllocationsTable } from '../db/schema';
import { type IpAddressAllocation, type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const getIpAddressAllocation = async (input: DeleteInput): Promise<IpAddressAllocation | null> => {
  try {
    const results = await db.select()
      .from(ipAddressAllocationsTable)
      .where(eq(ipAddressAllocationsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const allocation = results[0];
    return {
      ...allocation
    };
  } catch (error) {
    console.error('IP address allocation retrieval failed:', error);
    throw error;
  }
};
