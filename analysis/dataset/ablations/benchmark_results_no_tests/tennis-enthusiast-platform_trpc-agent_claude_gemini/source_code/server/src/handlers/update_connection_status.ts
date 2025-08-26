import { db } from '../db';
import { connectionsTable } from '../db/schema';
import { type UpdateConnectionStatusInput, type Connection } from '../schema';
import { eq } from 'drizzle-orm';

export const updateConnectionStatus = async (input: UpdateConnectionStatusInput): Promise<Connection> => {
  try {
    // Update the connection status
    const result = await db.update(connectionsTable)
      .set({
        status: input.status
      })
      .where(eq(connectionsTable.id, input.connection_id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Connection with id ${input.connection_id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Connection status update failed:', error);
    throw error;
  }
};
