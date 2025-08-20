import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { type IpAddress } from '../schema';

export const getIpAddresses = async (): Promise<IpAddress[]> => {
  try {
    const results = await db.select()
      .from(ipAddressesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch IP addresses:', error);
    throw error;
  }
};
