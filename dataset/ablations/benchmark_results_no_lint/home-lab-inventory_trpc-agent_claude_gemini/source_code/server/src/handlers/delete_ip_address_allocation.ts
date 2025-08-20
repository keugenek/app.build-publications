import { db } from '../db';
import { ipAddressAllocationsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteIpAddressAllocation = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    // Delete the IP address allocation record
    const result = await db.delete(ipAddressAllocationsTable)
      .where(eq(ipAddressAllocationsTable.id, input.id))
      .returning()
      .execute();

    // Check if any record was actually deleted
    const success = result.length > 0;
    
    return { success };
  } catch (error) {
    console.error('IP address allocation deletion failed:', error);
    throw error;
  }
};
