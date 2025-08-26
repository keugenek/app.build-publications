import { db } from '../db';
import { connectionRequestsTable, userProfilesTable } from '../db/schema';
import { type ConnectionRequest, type UserProfile } from '../schema';
import { eq } from 'drizzle-orm';

// Extended types to include related profile information
export type ConnectionRequestWithProfile = ConnectionRequest & {
  receiver_profile?: Pick<UserProfile, 'name' | 'skill_level' | 'location'>;
  requester_profile?: Pick<UserProfile, 'name' | 'skill_level' | 'location'>;
};

export const getUserConnectionRequests = async (userId: number): Promise<{
  sent: ConnectionRequestWithProfile[];
  received: ConnectionRequestWithProfile[];
}> => {
  try {
    // Fetch sent connection requests with receiver profile information
    const sentRequestsResult = await db.select({
      // Connection request fields
      id: connectionRequestsTable.id,
      requester_id: connectionRequestsTable.requester_id,
      receiver_id: connectionRequestsTable.receiver_id,
      status: connectionRequestsTable.status,
      message: connectionRequestsTable.message,
      created_at: connectionRequestsTable.created_at,
      updated_at: connectionRequestsTable.updated_at,
      // Receiver profile information
      receiver_name: userProfilesTable.name,
      receiver_skill_level: userProfilesTable.skill_level,
      receiver_location: userProfilesTable.location
    })
    .from(connectionRequestsTable)
    .innerJoin(userProfilesTable, eq(connectionRequestsTable.receiver_id, userProfilesTable.id))
    .where(eq(connectionRequestsTable.requester_id, userId))
    .execute();

    // Fetch received connection requests with requester profile information
    const receivedRequestsResult = await db.select({
      // Connection request fields
      id: connectionRequestsTable.id,
      requester_id: connectionRequestsTable.requester_id,
      receiver_id: connectionRequestsTable.receiver_id,
      status: connectionRequestsTable.status,
      message: connectionRequestsTable.message,
      created_at: connectionRequestsTable.created_at,
      updated_at: connectionRequestsTable.updated_at,
      // Requester profile information
      requester_name: userProfilesTable.name,
      requester_skill_level: userProfilesTable.skill_level,
      requester_location: userProfilesTable.location
    })
    .from(connectionRequestsTable)
    .innerJoin(userProfilesTable, eq(connectionRequestsTable.requester_id, userProfilesTable.id))
    .where(eq(connectionRequestsTable.receiver_id, userId))
    .execute();

    // Transform sent requests to include receiver info
    const sent: ConnectionRequestWithProfile[] = sentRequestsResult.map(result => ({
      id: result.id,
      requester_id: result.requester_id,
      receiver_id: result.receiver_id,
      status: result.status,
      message: result.message,
      created_at: result.created_at,
      updated_at: result.updated_at,
      receiver_profile: {
        name: result.receiver_name,
        skill_level: result.receiver_skill_level,
        location: result.receiver_location
      }
    }));

    // Transform received requests to include requester info
    const received: ConnectionRequestWithProfile[] = receivedRequestsResult.map(result => ({
      id: result.id,
      requester_id: result.requester_id,
      receiver_id: result.receiver_id,
      status: result.status,
      message: result.message,
      created_at: result.created_at,
      updated_at: result.updated_at,
      requester_profile: {
        name: result.requester_name,
        skill_level: result.requester_skill_level,
        location: result.requester_location
      }
    }));

    return {
      sent,
      received
    };
  } catch (error) {
    console.error('Failed to fetch user connection requests:', error);
    throw error;
  }
};
