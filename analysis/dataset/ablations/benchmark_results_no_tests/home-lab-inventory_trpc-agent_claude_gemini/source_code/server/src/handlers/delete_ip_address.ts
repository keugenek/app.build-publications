import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { type IdInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteIpAddress = async (input: IdInput): Promise<boolean> => {
  try {
    // Delete the IP address record
    const result = await db.delete(ipAddressesTable)
      .where(eq(ipAddressesTable.id, input.id))
      .returning()
      .execute();

    // Return true if a record was deleted, false if no record was found
    return result.length > 0;
  } catch (error) {
    console.error('IP address deletion failed:', error);
    throw error;
  }
};
