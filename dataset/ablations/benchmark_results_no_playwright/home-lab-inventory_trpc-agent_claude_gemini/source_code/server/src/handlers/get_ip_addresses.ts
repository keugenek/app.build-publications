import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { type IpAddress } from '../schema';

export const getIpAddresses = async (): Promise<IpAddress[]> => {
  try {
    // Query all IP addresses from the database
    const result = await db.select()
      .from(ipAddressesTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch IP addresses:', error);
    throw error;
  }
};
