import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { type GetByIdInput, type IpAddress } from '../schema';
import { eq } from 'drizzle-orm';

export async function getIpAddressById(input: GetByIdInput): Promise<IpAddress | null> {
  try {
    const result = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Failed to get IP address by ID:', error);
    throw error;
  }
}
