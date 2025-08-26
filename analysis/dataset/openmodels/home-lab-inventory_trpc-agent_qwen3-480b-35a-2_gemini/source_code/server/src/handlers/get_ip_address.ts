import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type IpAddress } from '../schema';

export const getIpAddress = async (id: number): Promise<IpAddress | null> => {
  try {
    const result = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const ipAddress = result[0];
    return {
      ...ipAddress,
      hardware_asset_id: ipAddress.hardware_asset_id,
      software_asset_id: ipAddress.software_asset_id
    };
  } catch (error) {
    console.error('Failed to fetch IP address:', error);
    throw error;
  }
};
