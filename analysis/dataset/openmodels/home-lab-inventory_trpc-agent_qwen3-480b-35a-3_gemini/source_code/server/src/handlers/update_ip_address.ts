import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { type UpdateIPAddressInput, type IPAddress } from '../schema';
import { eq } from 'drizzle-orm';

export const updateIPAddress = async (input: UpdateIPAddressInput): Promise<IPAddress | null> => {
  try {
    // Build the update data object with only the provided fields
    const updateData: Partial<typeof ipAddressesTable.$inferInsert> = {};
    
    if (input.address !== undefined) {
      updateData.address = input.address;
    }
    
    if (input.assignedTo !== undefined) {
      updateData.assignedTo = input.assignedTo;
    }

    // If no fields to update, return null
    if (Object.keys(updateData).length === 0) {
      return null;
    }

    // Update the IP address record
    const result = await db.update(ipAddressesTable)
      .set(updateData)
      .where(eq(ipAddressesTable.id, input.id))
      .returning()
      .execute();

    // If no rows were affected, return null
    if (result.length === 0) {
      return null;
    }

    // Return the updated IP address
    return {
      ...result[0],
    };
  } catch (error) {
    console.error('IP address update failed:', error);
    throw error;
  }
};
