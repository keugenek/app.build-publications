import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { 
  type CreateIPAddressInput, 
  type UpdateIPAddressInput, 
  type IPAddress 
} from '../schema';

export const createIPAddress = async (input: CreateIPAddressInput): Promise<IPAddress> => {
  try {
    const result = await db.insert(ipAddressesTable)
      .values({
        ip_address: input.ip_address,
        device_type: input.device_type,
        device_id: input.device_id,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('IP address creation failed:', error);
    throw error;
  }
};

export const getIPAddresses = async (): Promise<IPAddress[]> => {
  try {
    const result = await db.select()
      .from(ipAddressesTable)
      .execute();
    
    return result;
  } catch (error) {
    console.error('Fetching IP addresses failed:', error);
    throw error;
  }
};

export const getIPAddressById = async (id: number): Promise<IPAddress | null> => {
  try {
    const result = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, id))
      .execute();
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Fetching IP address by ID failed:', error);
    throw error;
  }
};

export const updateIPAddress = async (input: UpdateIPAddressInput): Promise<IPAddress> => {
  try {
    const updateData: any = {};
    if (input.ip_address !== undefined) updateData.ip_address = input.ip_address;
    if (input.device_type !== undefined) updateData.device_type = input.device_type;
    if (input.device_id !== undefined) updateData.device_id = input.device_id;
    if (input.description !== undefined) updateData.description = input.description;

    const result = await db.update(ipAddressesTable)
      .set(updateData)
      .where(eq(ipAddressesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`IP address with ID ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('IP address update failed:', error);
    throw error;
  }
};

export const deleteIPAddress = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(ipAddressesTable)
      .where(eq(ipAddressesTable.id, id))
      .execute();
    
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('IP address deletion failed:', error);
    throw error;
  }
};
