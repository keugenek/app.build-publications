import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable, connectionsTable } from '../db/schema';
import { getUserConnections } from '../handlers/get_user_connections';

describe('getUserConnections', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no connections', async () => {
    // Create a user with no connections
    const user = await db.insert(userProfilesTable).values({
      name: 'John Doe',
      skill_level: 'Beginner',
      city: 'New York',
      state: 'NY',
      bio: 'Looking for tennis partners'
    }).returning().execute();

    const result = await getUserConnections(user[0].id);
    expect(result).toEqual([]);
  });

  it('should return connections where user is the requester', async () => {
    // Create users
    const users = await db.insert(userProfilesTable).values([
      {
        name: 'Alice Smith',
        skill_level: 'Intermediate',
        city: 'Los Angeles',
        state: 'CA',
        bio: 'Tennis enthusiast'
      },
      {
        name: 'Bob Johnson',
        skill_level: 'Advanced',
        city: 'Chicago',
        state: 'IL',
        bio: 'Competitive player'
      }
    ]).returning().execute();

    const requesterId = users[0].id;
    const targetId = users[1].id;

    // Create connection where first user is requester
    const connection = await db.insert(connectionsTable).values({
      requester_id: requesterId,
      target_id: targetId,
      status: 'pending'
    }).returning().execute();

    const result = await getUserConnections(requesterId);
    
    expect(result).toHaveLength(1);
    expect(result[0].requester_id).toBe(requesterId);
    expect(result[0].target_id).toBe(targetId);
    expect(result[0].status).toBe('pending');
    expect(result[0].id).toBe(connection[0].id);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return connections where user is the target', async () => {
    // Create users
    const users = await db.insert(userProfilesTable).values([
      {
        name: 'Carol Brown',
        skill_level: 'Beginner',
        city: 'Miami',
        state: 'FL',
        bio: 'New to tennis'
      },
      {
        name: 'David Wilson',
        skill_level: 'Intermediate',
        city: 'Denver',
        state: 'CO',
        bio: 'Weekend player'
      }
    ]).returning().execute();

    const requesterId = users[0].id;
    const targetId = users[1].id;

    // Create connection where second user is target
    await db.insert(connectionsTable).values({
      requester_id: requesterId,
      target_id: targetId,
      status: 'accepted'
    }).returning().execute();

    const result = await getUserConnections(targetId);
    
    expect(result).toHaveLength(1);
    expect(result[0].requester_id).toBe(requesterId);
    expect(result[0].target_id).toBe(targetId);
    expect(result[0].status).toBe('accepted');
  });

  it('should return both sent and received connections for a user', async () => {
    // Create three users
    const users = await db.insert(userProfilesTable).values([
      {
        name: 'Eve Davis',
        skill_level: 'Advanced',
        city: 'Seattle',
        state: 'WA',
        bio: 'Professional coach'
      },
      {
        name: 'Frank Miller',
        skill_level: 'Intermediate',
        city: 'Portland',
        state: 'OR',
        bio: 'Club player'
      },
      {
        name: 'Grace Lee',
        skill_level: 'Beginner',
        city: 'San Francisco',
        state: 'CA',
        bio: 'Learning to play'
      }
    ]).returning().execute();

    const userId = users[0].id;
    const user2Id = users[1].id;
    const user3Id = users[2].id;

    // Create connections where user is requester
    await db.insert(connectionsTable).values({
      requester_id: userId,
      target_id: user2Id,
      status: 'pending'
    }).execute();

    // Create connection where user is target
    await db.insert(connectionsTable).values({
      requester_id: user3Id,
      target_id: userId,
      status: 'declined'
    }).execute();

    const result = await getUserConnections(userId);
    
    expect(result).toHaveLength(2);
    
    // Find the connection where user is requester
    const sentConnection = result.find(conn => conn.requester_id === userId);
    expect(sentConnection).toBeDefined();
    expect(sentConnection!.target_id).toBe(user2Id);
    expect(sentConnection!.status).toBe('pending');
    
    // Find the connection where user is target
    const receivedConnection = result.find(conn => conn.target_id === userId);
    expect(receivedConnection).toBeDefined();
    expect(receivedConnection!.requester_id).toBe(user3Id);
    expect(receivedConnection!.status).toBe('declined');
  });

  it('should return connections with different statuses', async () => {
    // Create users
    const users = await db.insert(userProfilesTable).values([
      {
        name: 'Henry Clark',
        skill_level: 'Intermediate',
        city: 'Boston',
        state: 'MA',
        bio: 'Tennis lover'
      },
      {
        name: 'Ivy Garcia',
        skill_level: 'Advanced',
        city: 'Austin',
        state: 'TX',
        bio: 'Tournament player'
      },
      {
        name: 'Jack Robinson',
        skill_level: 'Beginner',
        city: 'Phoenix',
        state: 'AZ',
        bio: 'Just starting out'
      }
    ]).returning().execute();

    const userId = users[0].id;
    const user2Id = users[1].id;
    const user3Id = users[2].id;

    // Create connections with different statuses
    await db.insert(connectionsTable).values([
      {
        requester_id: userId,
        target_id: user2Id,
        status: 'pending'
      },
      {
        requester_id: user3Id,
        target_id: userId,
        status: 'accepted'
      },
      {
        requester_id: userId,
        target_id: user3Id,
        status: 'declined'
      }
    ]).execute();

    const result = await getUserConnections(userId);
    
    expect(result).toHaveLength(3);
    
    const statuses = result.map(conn => conn.status).sort();
    expect(statuses).toEqual(['accepted', 'declined', 'pending']);
  });

  it('should not return connections for other users', async () => {
    // Create users
    const users = await db.insert(userProfilesTable).values([
      {
        name: 'Kate Young',
        skill_level: 'Intermediate',
        city: 'Atlanta',
        state: 'GA',
        bio: 'Doubles specialist'
      },
      {
        name: 'Liam King',
        skill_level: 'Advanced',
        city: 'Nashville',
        state: 'TN',
        bio: 'Singles player'
      },
      {
        name: 'Maya Scott',
        skill_level: 'Beginner',
        city: 'Orlando',
        state: 'FL',
        bio: 'Recreational player'
      }
    ]).returning().execute();

    const user1Id = users[0].id;
    const user2Id = users[1].id;
    const user3Id = users[2].id;

    // Create connection between user2 and user3 (not involving user1)
    await db.insert(connectionsTable).values({
      requester_id: user2Id,
      target_id: user3Id,
      status: 'accepted'
    }).execute();

    // User1 should not see this connection
    const result = await getUserConnections(user1Id);
    expect(result).toEqual([]);
  });
});
