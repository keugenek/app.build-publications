import { db } from '../db';
import { connectionRequestsTable } from '../db/schema';
import { type RespondToConnectionRequestInput, type ConnectionRequest } from '../schema';
import { eq, and } from 'drizzle-orm';

export const respondToConnectionRequest = async (userId: number, input: RespondToConnectionRequestInput): Promise<ConnectionRequest | null> => {
  try {
    // First, verify that the request exists and the user is the receiver
    const existingRequest = await db.select()
      .from(connectionRequestsTable)
      .where(
        and(
          eq(connectionRequestsTable.id, input.request_id),
          eq(connectionRequestsTable.receiver_id, userId),
          eq(connectionRequestsTable.status, 'pending')
        )
      )
      .execute();

    if (existingRequest.length === 0) {
      // Request not found, not authorized, or already responded to
      return null;
    }

    // Update the request status and updated_at timestamp
    const result = await db.update(connectionRequestsTable)
      .set({
        status: input.status,
        updated_at: new Date()
      })
      .where(eq(connectionRequestsTable.id, input.request_id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Connection request response failed:', error);
    throw error;
  }
};
