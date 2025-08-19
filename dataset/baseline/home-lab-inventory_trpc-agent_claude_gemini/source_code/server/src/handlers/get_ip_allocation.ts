import { db } from '../db';
import { ipAllocationsTable } from '../db/schema';
import { type IpAllocation, type IdParam } from '../schema';
import { eq } from 'drizzle-orm';

export async function getIpAllocation(params: IdParam): Promise<IpAllocation | null> {
  try {
    const result = await db.select()
      .from(ipAllocationsTable)
      .where(eq(ipAllocationsTable.id, params.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const allocation = result[0];
    return {
      ...allocation
    };
  } catch (error) {
    console.error('Get IP allocation failed:', error);
    throw error;
  }
}
