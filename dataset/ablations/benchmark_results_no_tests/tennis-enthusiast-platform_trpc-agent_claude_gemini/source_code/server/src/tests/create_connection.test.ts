import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { connectionsTable, userProfilesTable } from '../db/schema';
import { type CreateConnectionInput } from '../schema';
import { createConnection } from '../handlers/create_connection';
import { eq, and } from 'drizzle-orm';

// Test user profiles to use in tests
const testUser1 = {
  name: 'Alice Johnson',
  skill_level: 'Intermediate' as const,
  city: 'San Francisco',
  state: 'California',
  bio: 'Looking for tennis partners in SF!'
};

const testUser2 = {
  name: 'Bob Smith',
  skill_level: 'Advanced' as const,
  city: 'San Francisco',
  state: 'California',
  bio: 'Experienced player seeking competitive matches'
};

const testUser3 = {
  name: 'Carol Davis',
  skill_level: 'Beginner' as const,
  city: 'Oakland',
  state: 'California',
  bio: 'New to tennis, excited to learn!'
};

describe('createConnection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a connection between two users', async () => {
    // Create test users
    const users = await db.insert(userProfilesTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    const user1Id = users[0].id;
    const user2Id = users[1].id;

    const input: CreateConnectionInput = {
      requester_id: user1Id,
      target_id: user2Id
    };

    const result = await createConnection(input);

    // Verify connection properties
    expect(result.requester_id).toBe(user1Id);
    expect(result.target_id).toBe(user2Id);
    expect(result.status).toBe('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save connection to database', async () => {
    // Create test users
    const users = await db.insert(userProfilesTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    const user1Id = users[0].id;
    const user2Id = users[1].id;

    const input: CreateConnectionInput = {
      requester_id: user1Id,
      target_id: user2Id
    };

    const result = await createConnection(input);

    // Verify connection was saved to database
    const connections = await db.select()
      .from(connectionsTable)
      .where(eq(connectionsTable.id, result.id))
      .execute();

    expect(connections).toHaveLength(1);
    expect(connections[0].requester_id).toBe(user1Id);
    expect(connections[0].target_id).toBe(user2Id);
    expect(connections[0].status).toBe('pending');
    expect(connections[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when requester does not exist', async () => {
    // Create only target user
    const users = await db.insert(userProfilesTable)
      .values([testUser2])
      .returning()
      .execute();

    const user2Id = users[0].id;
    const nonExistentUserId = 99999;

    const input: CreateConnectionInput = {
      requester_id: nonExistentUserId,
      target_id: user2Id
    };

    await expect(createConnection(input)).rejects.toThrow(/requester with id.*does not exist/i);
  });

  it('should throw error when target user does not exist', async () => {
    // Create only requester user
    const users = await db.insert(userProfilesTable)
      .values([testUser1])
      .returning()
      .execute();

    const user1Id = users[0].id;
    const nonExistentUserId = 99999;

    const input: CreateConnectionInput = {
      requester_id: user1Id,
      target_id: nonExistentUserId
    };

    await expect(createConnection(input)).rejects.toThrow(/target user with id.*does not exist/i);
  });

  it('should prevent self-connection', async () => {
    // Create test user
    const users = await db.insert(userProfilesTable)
      .values([testUser1])
      .returning()
      .execute();

    const userId = users[0].id;

    const input: CreateConnectionInput = {
      requester_id: userId,
      target_id: userId
    };

    await expect(createConnection(input)).rejects.toThrow(/cannot create connection with yourself/i);
  });

  it('should prevent duplicate connections', async () => {
    // Create test users
    const users = await db.insert(userProfilesTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    const user1Id = users[0].id;
    const user2Id = users[1].id;

    const input: CreateConnectionInput = {
      requester_id: user1Id,
      target_id: user2Id
    };

    // Create first connection
    await createConnection(input);

    // Attempt to create duplicate connection
    await expect(createConnection(input)).rejects.toThrow(/connection already exists/i);
  });

  it('should prevent reverse duplicate connections', async () => {
    // Create test users
    const users = await db.insert(userProfilesTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    const user1Id = users[0].id;
    const user2Id = users[1].id;

    // Create connection from user1 to user2
    const input1: CreateConnectionInput = {
      requester_id: user1Id,
      target_id: user2Id
    };
    await createConnection(input1);

    // Attempt to create reverse connection from user2 to user1
    const input2: CreateConnectionInput = {
      requester_id: user2Id,
      target_id: user1Id
    };

    await expect(createConnection(input2)).rejects.toThrow(/connection already exists/i);
  });

  it('should allow multiple connections from same requester to different targets', async () => {
    // Create test users
    const users = await db.insert(userProfilesTable)
      .values([testUser1, testUser2, testUser3])
      .returning()
      .execute();

    const user1Id = users[0].id;
    const user2Id = users[1].id;
    const user3Id = users[2].id;

    // Create connection from user1 to user2
    const input1: CreateConnectionInput = {
      requester_id: user1Id,
      target_id: user2Id
    };
    const connection1 = await createConnection(input1);

    // Create connection from user1 to user3
    const input2: CreateConnectionInput = {
      requester_id: user1Id,
      target_id: user3Id
    };
    const connection2 = await createConnection(input2);

    // Verify both connections exist
    expect(connection1.requester_id).toBe(user1Id);
    expect(connection1.target_id).toBe(user2Id);
    expect(connection2.requester_id).toBe(user1Id);
    expect(connection2.target_id).toBe(user3Id);

    // Verify in database
    const connections = await db.select()
      .from(connectionsTable)
      .where(eq(connectionsTable.requester_id, user1Id))
      .execute();

    expect(connections).toHaveLength(2);
    const targetIds = connections.map(conn => conn.target_id).sort();
    expect(targetIds).toEqual([user2Id, user3Id].sort());
  });
});
