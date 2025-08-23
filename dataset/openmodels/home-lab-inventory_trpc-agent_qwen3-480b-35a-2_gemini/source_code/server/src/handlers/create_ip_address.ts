import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { type CreateIpAddressInput, type IpAddress } from '../schema';

export const createIpAddress = async (input: CreateIpAddressInput): Promise<IpAddress> => {
  try {
    // Validate that IP is linked to either hardware or software asset, but not both
    if (input.hardware_asset_id !== null && input.software_asset_id !== null) {
      throw new Error('IP address cannot be linked to both hardware and software assets');
    }
    
    if (input.hardware_asset_id === null && input.software_asset_id === null) {
      throw new Error('IP address must be linked to either hardware or software asset');
    }

    // Insert IP address record
    const result = await db.insert(ipAddressesTable)
      .values({
        ip_address: input.ip_address,
        status: input.status,
        hardware_asset_id: input.hardware_asset_id,
        software_asset_id: input.software_asset_id
      })
      .returning()
      .execute();

    const ipAddress = result[0];
    return {
      ...ipAddress,
      created_at: ipAddress.created_at
    };
  } catch (error) {
    console.error('IP address creation failed:', error);
    throw error;
  }
};
