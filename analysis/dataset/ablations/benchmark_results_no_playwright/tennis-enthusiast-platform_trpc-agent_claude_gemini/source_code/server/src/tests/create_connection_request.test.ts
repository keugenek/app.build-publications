import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable, connectionRequestsTable } from '../db/schema';
import { type CreateConnectionRequestInput } from '../schema';
import { createConnectionRequest } from '../handlers/create_connection_request';
import { eq, and } from 'drizzle-orm';

describe('createConnectionRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let requester: { id: number };
  let receiver: { id: number };

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(userProfilesTable)
      .values([
        {
          name: 'John Doe',
          bio: 'Tennis enthusiast',
          skill_level: 'Intermediate',
          location: 'New York'
        },
        {
          name: 'Jane Smith',
          bio: 'Loves playing tennis',
          skill_level: 'Advanced',
          location: 'Los Angeles'
        }
      ])
      .returning()
      .execute();

    requester = users[0];
    receiver = users[1];
  });

  const testInput: CreateConnectionRequestInput = {
    receiver_id: 0, // Will be set in each test
    message: 'Hi! Would you like to play tennis together?'
  };

  it('should create a connection request successfully', async () => {
    const input = { ...testInput, receiver_id: receiver.id };
    const result = await createConnectionRequest(requester.id, input);

    // Validate response
    expect(result.requester_id).toEqual(requester.id);
    expect(result.receiver_id).toEqual(receiver.id);
    expect(result.status).toEqual('pending');
    expect(result.message).toEqual('Hi! Would you like to play tennis together?');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save connection request to database', async () => {
    const input = { ...testInput, receiver_id: receiver.id };
    const result = await createConnectionRequest(requester.id, input);

    // Verify in database
    const requests = await db.select()
      .from(connectionRequestsTable)
      .where(eq(connectionRequestsTable.id, result.id))
      .execute();

    expect(requests).toHaveLength(1);
    expect(requests[0].requester_id).toEqual(requester.id);
    expect(requests[0].receiver_id).toEqual(receiver.id);
    expect(requests[0].status).toEqual('pending');
    expect(requests[0].message).toEqual('Hi! Would you like to play tennis together?');
  });

  it('should create connection request with null message', async () => {
    const input = { receiver_id: receiver.id, message: null };
    const result = await createConnectionRequest(requester.id, input);

    expect(result.message).toBeNull();
    expect(result.requester_id).toEqual(requester.id);
    expect(result.receiver_id).toEqual(receiver.id);
    expect(result.status).toEqual('pending');
  });

  it('should throw error when requester does not exist', async () => {
    const input = { ...testInput, receiver_id: receiver.id };
    const nonExistentRequesterId = 9999;

    await expect(
      createConnectionRequest(nonExistentRequesterId, input)
    ).rejects.toThrow(/requester not found/i);
  });

  it('should throw error when receiver does not exist', async () => {
    const input = { receiver_id: 9999, message: 'Hello!' };

    await expect(
      createConnectionRequest(requester.id, input)
    ).rejects.toThrow(/receiver not found/i);
  });

  it('should throw error when trying to connect to yourself', async () => {
    const input = { ...testInput, receiver_id: requester.id };

    await expect(
      createConnectionRequest(requester.id, input)
    ).rejects.toThrow(/cannot send connection request to yourself/i);
  });

  it('should throw error when connection request already pending', async () => {
    const input = { ...testInput, receiver_id: receiver.id };

    // Create first request
    await createConnectionRequest(requester.id, input);

    // Try to create duplicate request
    await expect(
      createConnectionRequest(requester.id, input)
    ).rejects.toThrow(/connection request already pending/i);
  });

  it('should throw error when users are already connected', async () => {
    // Create an accepted connection request
    await db.insert(connectionRequestsTable)
      .values({
        requester_id: requester.id,
        receiver_id: receiver.id,
        status: 'accepted',
        message: 'Previous request'
      })
      .execute();

    const input = { ...testInput, receiver_id: receiver.id };

    await expect(
      createConnectionRequest(requester.id, input)
    ).rejects.toThrow(/users are already connected/i);
  });

  it('should throw error when reverse pending request exists', async () => {
    // Create request from receiver to requester
    await db.insert(connectionRequestsTable)
      .values({
        requester_id: receiver.id,
        receiver_id: requester.id,
        status: 'pending',
        message: 'Reverse request'
      })
      .execute();

    const input = { ...testInput, receiver_id: receiver.id };

    await expect(
      createConnectionRequest(requester.id, input)
    ).rejects.toThrow(/connection request already exists from this user/i);
  });

  it('should throw error when reverse accepted request exists', async () => {
    // Create accepted request from receiver to requester
    await db.insert(connectionRequestsTable)
      .values({
        requester_id: receiver.id,
        receiver_id: requester.id,
        status: 'accepted',
        message: 'Accepted reverse request'
      })
      .execute();

    const input = { ...testInput, receiver_id: receiver.id };

    await expect(
      createConnectionRequest(requester.id, input)
    ).rejects.toThrow(/users are already connected/i);
  });

  it('should allow creating request after previous was declined', async () => {
    // Create declined request
    await db.insert(connectionRequestsTable)
      .values({
        requester_id: requester.id,
        receiver_id: receiver.id,
        status: 'declined',
        message: 'Previous declined request'
      })
      .execute();

    const input = { ...testInput, receiver_id: receiver.id };
    const result = await createConnectionRequest(requester.id, input);

    expect(result.requester_id).toEqual(requester.id);
    expect(result.receiver_id).toEqual(receiver.id);
    expect(result.status).toEqual('pending');
    expect(result.message).toEqual('Hi! Would you like to play tennis together?');

    // Verify both requests exist in database
    const requests = await db.select()
      .from(connectionRequestsTable)
      .where(
        and(
          eq(connectionRequestsTable.requester_id, requester.id),
          eq(connectionRequestsTable.receiver_id, receiver.id)
        )
      )
      .execute();

    expect(requests).toHaveLength(2);
    expect(requests.some(r => r.status === 'declined')).toBe(true);
    expect(requests.some(r => r.status === 'pending')).toBe(true);
  });

  it('should allow creating request after reverse was declined', async () => {
    // Create declined reverse request
    await db.insert(connectionRequestsTable)
      .values({
        requester_id: receiver.id,
        receiver_id: requester.id,
        status: 'declined',
        message: 'Declined reverse request'
      })
      .execute();

    const input = { ...testInput, receiver_id: receiver.id };
    const result = await createConnectionRequest(requester.id, input);

    expect(result.requester_id).toEqual(requester.id);
    expect(result.receiver_id).toEqual(receiver.id);
    expect(result.status).toEqual('pending');
  });
});
