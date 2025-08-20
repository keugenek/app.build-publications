import { db } from '../db';
import { userProfilesTable, connectionRequestsTable } from '../db/schema';
import { type CreateConnectionRequestInput, type ConnectionRequest } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createConnectionRequest = async (requesterId: number, input: CreateConnectionRequestInput): Promise<ConnectionRequest> => {
  try {
    // Validate that requester exists
    const requester = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, requesterId))
      .execute();

    if (requester.length === 0) {
      throw new Error('Requester not found');
    }

    // Validate that receiver exists
    const receiver = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, input.receiver_id))
      .execute();

    if (receiver.length === 0) {
      throw new Error('Receiver not found');
    }

    // Prevent self-connection requests
    if (requesterId === input.receiver_id) {
      throw new Error('Cannot send connection request to yourself');
    }

    // Check for existing pending or accepted request in either direction
    const existingRequest = await db.select()
      .from(connectionRequestsTable)
      .where(
        and(
          eq(connectionRequestsTable.requester_id, requesterId),
          eq(connectionRequestsTable.receiver_id, input.receiver_id)
        )
      )
      .execute();

    if (existingRequest.length > 0) {
      const status = existingRequest[0].status;
      if (status === 'pending') {
        throw new Error('Connection request already pending');
      } else if (status === 'accepted') {
        throw new Error('Users are already connected');
      }
      // If status is 'declined', allow creating a new request
    }

    // Check for reverse request (receiver -> requester)
    const reverseRequest = await db.select()
      .from(connectionRequestsTable)
      .where(
        and(
          eq(connectionRequestsTable.requester_id, input.receiver_id),
          eq(connectionRequestsTable.receiver_id, requesterId)
        )
      )
      .execute();

    if (reverseRequest.length > 0) {
      const status = reverseRequest[0].status;
      if (status === 'pending') {
        throw new Error('Connection request already exists from this user');
      } else if (status === 'accepted') {
        throw new Error('Users are already connected');
      }
    }

    // Create the connection request
    const result = await db.insert(connectionRequestsTable)
      .values({
        requester_id: requesterId,
        receiver_id: input.receiver_id,
        message: input.message,
        status: 'pending'
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Connection request creation failed:', error);
    throw error;
  }
};
