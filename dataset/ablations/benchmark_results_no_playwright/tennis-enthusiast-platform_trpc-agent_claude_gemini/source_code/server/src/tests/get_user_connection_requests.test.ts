import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable, connectionRequestsTable } from '../db/schema';
import { type CreateUserProfileInput, type CreateConnectionRequestInput } from '../schema';
import { getUserConnectionRequests } from '../handlers/get_user_connection_requests';

// Test user profiles
const testUser1: CreateUserProfileInput = {
  name: 'Alice Johnson',
  bio: 'Tennis enthusiast from downtown',
  skill_level: 'Intermediate',
  location: 'New York, NY'
};

const testUser2: CreateUserProfileInput = {
  name: 'Bob Smith',
  bio: 'Competitive player',
  skill_level: 'Advanced',
  location: 'Los Angeles, CA'
};

const testUser3: CreateUserProfileInput = {
  name: 'Carol Brown',
  bio: 'Weekend player',
  skill_level: 'Beginner',
  location: 'Chicago, IL'
};

describe('getUserConnectionRequests', () => {
  let user1Id: number, user2Id: number, user3Id: number;

  beforeEach(async () => {
    await createDB();

    // Create test users
    const user1Result = await db.insert(userProfilesTable)
      .values(testUser1)
      .returning()
      .execute();
    user1Id = user1Result[0].id;

    const user2Result = await db.insert(userProfilesTable)
      .values(testUser2)
      .returning()
      .execute();
    user2Id = user2Result[0].id;

    const user3Result = await db.insert(userProfilesTable)
      .values(testUser3)
      .returning()
      .execute();
    user3Id = user3Result[0].id;
  });

  afterEach(resetDB);

  it('should return empty arrays when user has no connection requests', async () => {
    const result = await getUserConnectionRequests(user1Id);

    expect(result.sent).toEqual([]);
    expect(result.received).toEqual([]);
  });

  it('should return sent connection requests with receiver profile info', async () => {
    // User1 sends request to User2
    const connectionRequest: CreateConnectionRequestInput = {
      receiver_id: user2Id,
      message: 'Would love to play tennis with you!'
    };

    await db.insert(connectionRequestsTable)
      .values({
        requester_id: user1Id,
        receiver_id: connectionRequest.receiver_id,
        message: connectionRequest.message,
        status: 'pending'
      })
      .execute();

    const result = await getUserConnectionRequests(user1Id);

    expect(result.sent).toHaveLength(1);
    expect(result.received).toHaveLength(0);

    const sentRequest = result.sent[0];
    expect(sentRequest.requester_id).toEqual(user1Id);
    expect(sentRequest.receiver_id).toEqual(user2Id);
    expect(sentRequest.message).toEqual('Would love to play tennis with you!');
    expect(sentRequest.status).toEqual('pending');
    expect(sentRequest.receiver_profile).toBeDefined();
    expect(sentRequest.receiver_profile?.name).toEqual('Bob Smith');
    expect(sentRequest.receiver_profile?.skill_level).toEqual('Advanced');
    expect(sentRequest.receiver_profile?.location).toEqual('Los Angeles, CA');
    expect(sentRequest.created_at).toBeInstanceOf(Date);
    expect(sentRequest.updated_at).toBeInstanceOf(Date);
  });

  it('should return received connection requests with requester profile info', async () => {
    // User2 sends request to User1
    await db.insert(connectionRequestsTable)
      .values({
        requester_id: user2Id,
        receiver_id: user1Id,
        message: 'Let\'s play a match!',
        status: 'pending'
      })
      .execute();

    const result = await getUserConnectionRequests(user1Id);

    expect(result.sent).toHaveLength(0);
    expect(result.received).toHaveLength(1);

    const receivedRequest = result.received[0];
    expect(receivedRequest.requester_id).toEqual(user2Id);
    expect(receivedRequest.receiver_id).toEqual(user1Id);
    expect(receivedRequest.message).toEqual('Let\'s play a match!');
    expect(receivedRequest.status).toEqual('pending');
    expect(receivedRequest.requester_profile).toBeDefined();
    expect(receivedRequest.requester_profile?.name).toEqual('Bob Smith');
    expect(receivedRequest.requester_profile?.skill_level).toEqual('Advanced');
    expect(receivedRequest.requester_profile?.location).toEqual('Los Angeles, CA');
  });

  it('should return both sent and received requests for a user', async () => {
    // User1 sends request to User2
    await db.insert(connectionRequestsTable)
      .values({
        requester_id: user1Id,
        receiver_id: user2Id,
        message: 'Want to practice together?',
        status: 'pending'
      })
      .execute();

    // User3 sends request to User1
    await db.insert(connectionRequestsTable)
      .values({
        requester_id: user3Id,
        receiver_id: user1Id,
        message: 'Looking for a tennis partner',
        status: 'pending'
      })
      .execute();

    const result = await getUserConnectionRequests(user1Id);

    expect(result.sent).toHaveLength(1);
    expect(result.received).toHaveLength(1);

    // Check sent request
    const sentRequest = result.sent[0];
    expect(sentRequest.requester_id).toEqual(user1Id);
    expect(sentRequest.receiver_id).toEqual(user2Id);
    expect(sentRequest.receiver_profile?.name).toEqual('Bob Smith');

    // Check received request
    const receivedRequest = result.received[0];
    expect(receivedRequest.requester_id).toEqual(user3Id);
    expect(receivedRequest.receiver_id).toEqual(user1Id);
    expect(receivedRequest.requester_profile?.name).toEqual('Carol Brown');
    expect(receivedRequest.requester_profile?.skill_level).toEqual('Beginner');
  });

  it('should handle requests with different statuses', async () => {
    // Create requests with different statuses
    await db.insert(connectionRequestsTable)
      .values([
        {
          requester_id: user1Id,
          receiver_id: user2Id,
          message: 'Pending request',
          status: 'pending'
        },
        {
          requester_id: user1Id,
          receiver_id: user3Id,
          message: 'Accepted request',
          status: 'accepted'
        }
      ])
      .execute();

    // User2 sends declined request to User1
    await db.insert(connectionRequestsTable)
      .values({
        requester_id: user2Id,
        receiver_id: user1Id,
        message: 'Declined request',
        status: 'declined'
      })
      .execute();

    const result = await getUserConnectionRequests(user1Id);

    expect(result.sent).toHaveLength(2);
    expect(result.received).toHaveLength(1);

    // Check different statuses are preserved
    const pendingRequest = result.sent.find(req => req.status === 'pending');
    const acceptedRequest = result.sent.find(req => req.status === 'accepted');
    const declinedRequest = result.received.find(req => req.status === 'declined');

    expect(pendingRequest).toBeDefined();
    expect(acceptedRequest).toBeDefined();
    expect(declinedRequest).toBeDefined();
  });

  it('should handle requests with null messages', async () => {
    // Create request with null message
    await db.insert(connectionRequestsTable)
      .values({
        requester_id: user1Id,
        receiver_id: user2Id,
        message: null,
        status: 'pending'
      })
      .execute();

    const result = await getUserConnectionRequests(user1Id);

    expect(result.sent).toHaveLength(1);
    expect(result.sent[0].message).toBeNull();
    expect(result.sent[0].receiver_profile?.name).toEqual('Bob Smith');
  });

  it('should only return requests for the specified user', async () => {
    // Create requests involving different users
    await db.insert(connectionRequestsTable)
      .values([
        {
          requester_id: user1Id,
          receiver_id: user2Id,
          message: 'User1 to User2',
          status: 'pending'
        },
        {
          requester_id: user2Id,
          receiver_id: user3Id,
          message: 'User2 to User3 (should not appear)',
          status: 'pending'
        },
        {
          requester_id: user3Id,
          receiver_id: user1Id,
          message: 'User3 to User1',
          status: 'pending'
        }
      ])
      .execute();

    const result = await getUserConnectionRequests(user1Id);

    expect(result.sent).toHaveLength(1);
    expect(result.received).toHaveLength(1);

    // Verify correct requests are returned
    expect(result.sent[0].receiver_profile?.name).toEqual('Bob Smith');
    expect(result.received[0].requester_profile?.name).toEqual('Carol Brown');
  });
});
