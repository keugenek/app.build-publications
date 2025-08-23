import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { type CreateIPAddressInput, type IPAddress } from '../schema';

export const createIPAddress = async (input: CreateIPAddressInput): Promise<IPAddress> => {
  try {
    // Insert IP address record
    const result = await db.insert(ipAddressesTable)
      .values({
        address: input.address,
        assignedTo: input.assignedTo
      })
      .returning()
      .execute();

    const ipAddress = result[0];
    return {
      ...ipAddress,
      created_at: new Date(ipAddress.created_at)
    };
  } catch (error) {
    console.error('IP address creation failed:', error);
    throw error;
  }
};
