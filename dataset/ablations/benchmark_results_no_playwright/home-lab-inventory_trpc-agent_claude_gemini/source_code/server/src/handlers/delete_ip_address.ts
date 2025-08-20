import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteIpAddress(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // Delete the IP address record by ID
    const result = await db.delete(ipAddressesTable)
      .where(eq(ipAddressesTable.id, input.id))
      .returning()
      .execute();

    // Return success status based on whether a record was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('IP address deletion failed:', error);
    throw error;
  }
}
