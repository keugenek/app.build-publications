import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { type IPAddress } from '../schema';
import { eq } from 'drizzle-orm';

export const getIPAddress = async (id: number): Promise<IPAddress | null> => {
  try {
    const result = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, id))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    const ipAddress = result[0];
    return {
      ...ipAddress,
      created_at: new Date(ipAddress.created_at)
    };
  } catch (error) {
    console.error('Failed to fetch IP address:', error);
    throw error;
  }
};
