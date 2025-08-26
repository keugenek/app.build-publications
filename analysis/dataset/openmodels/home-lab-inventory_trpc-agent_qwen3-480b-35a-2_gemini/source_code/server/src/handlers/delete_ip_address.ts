import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteIpAddress = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(ipAddressesTable)
      .where(eq(ipAddressesTable.id, id))
      .returning()
      .execute();
    
    return result.length > 0;
  } catch (error) {
    console.error('Failed to delete IP address:', error);
    throw error;
  }
};
