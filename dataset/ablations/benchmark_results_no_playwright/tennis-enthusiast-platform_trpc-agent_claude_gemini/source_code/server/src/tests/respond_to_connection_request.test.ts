import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable, connectionRequestsTable } from '../db/schema';
import { type RespondToConnectionRequestInput } from '../schema';
import { respondToConnectionRequest } from '../handlers/respond_to_connection_request';
import { eq } from 'drizzle-orm';

// Test users data
const testUser1 = {
  name: 'Alice Tennis',
  bio: 'Intermediate player looking for practice partners',
  skill_level: 'Intermediate' as const,
  location: 'New York'
};

const testUser2 = {
  name: 'Bob Tennis',
  bio: 'Advanced player seeking competitive matches',
  skill_level: 'Advanced' as const,
  location: 'Boston'
};

const testUser3 = {
  name: 'Charlie Tennis',
  bio: null,
  skill_level: 'Beginner' as const,
  location: 'Chicago'
};

describe('respondToConnectionRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should accept a pending connection request', async () => {
    // Create test users
    const [requester, receiver] = await db.insert(userProfilesTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create a connection request
    const [connectionRequest] = await db.insert(connectionRequestsTable)
      .values({
        requester_id: requester.id,
        receiver_id: receiver.id,
        status: 'pending',
        message: 'Would love to play tennis together!'
      })
      .returning()
      .execute();

    const input: RespondToConnectionRequestInput = {
      request_id: connectionRequest.id,
      status: 'accepted'
    };

    const result = await respondToConnectionRequest(receiver.id, input);

    // Verify response
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(connectionRequest.id);
    expect(result!.status).toEqual('accepted');
    expect(result!.requester_id).toEqual(requester.id);
    expect(result!.receiver_id).toEqual(receiver.id);
    expect(result!.message).toEqual('Would love to play tennis together!');
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > connectionRequest.updated_at).toBe(true);
  });

  it('should decline a pending connection request', async () => {
    // Create test users
    const [requester, receiver] = await db.insert(userProfilesTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create a connection request
    const [connectionRequest] = await db.insert(connectionRequestsTable)
      .values({
        requester_id: requester.id,
        receiver_id: receiver.id,
        status: 'pending',
        message: null
      })
      .returning()
      .execute();

    const input: RespondToConnectionRequestInput = {
      request_id: connectionRequest.id,
      status: 'declined'
    };

    const result = await respondToConnectionRequest(receiver.id, input);

    // Verify response
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(connectionRequest.id);
    expect(result!.status).toEqual('declined');
    expect(result!.message).toBeNull();
  });

  it('should update the database correctly', async () => {
    // Create test users
    const [requester, receiver] = await db.insert(userProfilesTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create a connection request
    const [connectionRequest] = await db.insert(connectionRequestsTable)
      .values({
        requester_id: requester.id,
        receiver_id: receiver.id,
        status: 'pending',
        message: 'Tennis match request'
      })
      .returning()
      .execute();

    const input: RespondToConnectionRequestInput = {
      request_id: connectionRequest.id,
      status: 'accepted'
    };

    await respondToConnectionRequest(receiver.id, input);

    // Verify database was updated
    const updatedRequest = await db.select()
      .from(connectionRequestsTable)
      .where(eq(connectionRequestsTable.id, connectionRequest.id))
      .execute();

    expect(updatedRequest).toHaveLength(1);
    expect(updatedRequest[0].status).toEqual('accepted');
    expect(updatedRequest[0].updated_at).toBeInstanceOf(Date);
    expect(updatedRequest[0].updated_at > connectionRequest.updated_at).toBe(true);
  });

  it('should return null if request does not exist', async () => {
    // Create test user
    const [receiver] = await db.insert(userProfilesTable)
      .values([testUser2])
      .returning()
      .execute();

    const input: RespondToConnectionRequestInput = {
      request_id: 99999, // Non-existent request ID
      status: 'accepted'
    };

    const result = await respondToConnectionRequest(receiver.id, input);

    expect(result).toBeNull();
  });

  it('should return null if user is not the receiver', async () => {
    // Create test users
    const [requester, receiver, unauthorizedUser] = await db.insert(userProfilesTable)
      .values([testUser1, testUser2, testUser3])
      .returning()
      .execute();

    // Create a connection request
    const [connectionRequest] = await db.insert(connectionRequestsTable)
      .values({
        requester_id: requester.id,
        receiver_id: receiver.id,
        status: 'pending',
        message: 'Tennis request'
      })
      .returning()
      .execute();

    const input: RespondToConnectionRequestInput = {
      request_id: connectionRequest.id,
      status: 'accepted'
    };

    // Try to respond with unauthorized user
    const result = await respondToConnectionRequest(unauthorizedUser.id, input);

    expect(result).toBeNull();

    // Verify original request is unchanged
    const unchangedRequest = await db.select()
      .from(connectionRequestsTable)
      .where(eq(connectionRequestsTable.id, connectionRequest.id))
      .execute();

    expect(unchangedRequest[0].status).toEqual('pending');
  });

  it('should return null if request is already accepted', async () => {
    // Create test users
    const [requester, receiver] = await db.insert(userProfilesTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create an already accepted connection request
    const [connectionRequest] = await db.insert(connectionRequestsTable)
      .values({
        requester_id: requester.id,
        receiver_id: receiver.id,
        status: 'accepted', // Already accepted
        message: 'Already processed request'
      })
      .returning()
      .execute();

    const input: RespondToConnectionRequestInput = {
      request_id: connectionRequest.id,
      status: 'declined'
    };

    const result = await respondToConnectionRequest(receiver.id, input);

    expect(result).toBeNull();

    // Verify request status is unchanged
    const unchangedRequest = await db.select()
      .from(connectionRequestsTable)
      .where(eq(connectionRequestsTable.id, connectionRequest.id))
      .execute();

    expect(unchangedRequest[0].status).toEqual('accepted');
  });

  it('should return null if request is already declined', async () => {
    // Create test users
    const [requester, receiver] = await db.insert(userProfilesTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create an already declined connection request
    const [connectionRequest] = await db.insert(connectionRequestsTable)
      .values({
        requester_id: requester.id,
        receiver_id: receiver.id,
        status: 'declined', // Already declined
        message: 'Already processed request'
      })
      .returning()
      .execute();

    const input: RespondToConnectionRequestInput = {
      request_id: connectionRequest.id,
      status: 'accepted'
    };

    const result = await respondToConnectionRequest(receiver.id, input);

    expect(result).toBeNull();

    // Verify request status is unchanged
    const unchangedRequest = await db.select()
      .from(connectionRequestsTable)
      .where(eq(connectionRequestsTable.id, connectionRequest.id))
      .execute();

    expect(unchangedRequest[0].status).toEqual('declined');
  });

  it('should handle requester trying to respond to their own request', async () => {
    // Create test users
    const [requester, receiver] = await db.insert(userProfilesTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create a connection request
    const [connectionRequest] = await db.insert(connectionRequestsTable)
      .values({
        requester_id: requester.id,
        receiver_id: receiver.id,
        status: 'pending',
        message: 'Tennis match request'
      })
      .returning()
      .execute();

    const input: RespondToConnectionRequestInput = {
      request_id: connectionRequest.id,
      status: 'accepted'
    };

    // Requester trying to respond to their own request
    const result = await respondToConnectionRequest(requester.id, input);

    expect(result).toBeNull();

    // Verify request is still pending
    const unchangedRequest = await db.select()
      .from(connectionRequestsTable)
      .where(eq(connectionRequestsTable.id, connectionRequest.id))
      .execute();

    expect(unchangedRequest[0].status).toEqual('pending');
  });
});
