import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { type IpAddress } from '../schema';

export const getIpAddresses = async (): Promise<IpAddress[]> => {
  try {
    const results = await db.select()
      .from(ipAddressesTable)
      .execute();

    // Convert and return IP addresses
    return results.map(ip => ({
      ...ip,
      id: ip.id,
      ip_address: ip.ip_address,
      status: ip.status as 'allocated' | 'free',
      hardware_asset_id: ip.hardware_asset_id,
      software_asset_id: ip.software_asset_id,
      created_at: ip.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch IP addresses:', error);
    throw error;
  }
};
