import { db } from '../db';
import { ipAllocationsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteIpAllocation(params: IdParam): Promise<{ success: boolean }> {
  try {
    // Delete the IP allocation with the specified ID
    const result = await db.delete(ipAllocationsTable)
      .where(eq(ipAllocationsTable.id, params.id))
      .execute();

    // Return success status based on whether any rows were affected
    return { success: true };
  } catch (error) {
    console.error('IP allocation deletion failed:', error);
    throw error;
  }
}
