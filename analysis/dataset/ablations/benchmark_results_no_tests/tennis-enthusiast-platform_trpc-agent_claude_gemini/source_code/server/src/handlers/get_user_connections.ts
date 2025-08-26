import { db } from '../db';
import { connectionsTable } from '../db/schema';
import { type Connection } from '../schema';
import { or, eq } from 'drizzle-orm';

export const getUserConnections = async (userId: number): Promise<Connection[]> => {
  try {
    // Query for connections where the user is either the requester or the target
    const results = await db.select()
      .from(connectionsTable)
      .where(
        or(
          eq(connectionsTable.requester_id, userId),
          eq(connectionsTable.target_id, userId)
        )
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch user connections:', error);
    throw error;
  }
};
