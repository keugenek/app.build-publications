import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { type IPAddress } from '../schema';

export const getIPAddresses = async (): Promise<IPAddress[]> => {
  try {
    const results = await db.select()
      .from(ipAddressesTable)
      .execute();

    // Convert timestamp to Date objects and ensure proper typing
    return results.map(ipAddress => ({
      id: ipAddress.id,
      address: ipAddress.address,
      assignedTo: ipAddress.assignedTo,
      created_at: new Date(ipAddress.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch IP addresses:', error);
    throw error;
  }
};
