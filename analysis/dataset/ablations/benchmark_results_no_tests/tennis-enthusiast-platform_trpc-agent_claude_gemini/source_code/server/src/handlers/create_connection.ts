import { db } from '../db';
import { connectionsTable, userProfilesTable } from '../db/schema';
import { type CreateConnectionInput, type Connection } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createConnection = async (input: CreateConnectionInput): Promise<Connection> => {
  try {
    // Verify both users exist
    const [requester, target] = await Promise.all([
      db.select()
        .from(userProfilesTable)
        .where(eq(userProfilesTable.id, input.requester_id))
        .execute(),
      db.select()
        .from(userProfilesTable)
        .where(eq(userProfilesTable.id, input.target_id))
        .execute()
    ]);

    if (requester.length === 0) {
      throw new Error(`Requester with ID ${input.requester_id} does not exist`);
    }

    if (target.length === 0) {
      throw new Error(`Target user with ID ${input.target_id} does not exist`);
    }

    // Prevent self-connection
    if (input.requester_id === input.target_id) {
      throw new Error('Cannot create connection with yourself');
    }

    // Check if connection already exists (in either direction)
    const existingConnections = await db.select()
      .from(connectionsTable)
      .where(
        and(
          eq(connectionsTable.requester_id, input.requester_id),
          eq(connectionsTable.target_id, input.target_id)
        )
      )
      .execute();

    if (existingConnections.length > 0) {
      throw new Error('Connection already exists between these users');
    }

    // Check reverse direction as well
    const reverseConnections = await db.select()
      .from(connectionsTable)
      .where(
        and(
          eq(connectionsTable.requester_id, input.target_id),
          eq(connectionsTable.target_id, input.requester_id)
        )
      )
      .execute();

    if (reverseConnections.length > 0) {
      throw new Error('Connection already exists between these users');
    }

    // Create the connection
    const result = await db.insert(connectionsTable)
      .values({
        requester_id: input.requester_id,
        target_id: input.target_id,
        status: 'pending'
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Connection creation failed:', error);
    throw error;
  }
};
