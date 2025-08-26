import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type SearchUsersInput } from '../schema';
import { searchUsers } from '../handlers/search_users';

// Test data setup
const testUsers = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    skill_level: 'beginner' as const,
    location: 'New York',
    bio: 'Looking for tennis partners'
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    skill_level: 'intermediate' as const,
    location: 'New York',
    bio: 'Tennis enthusiast'
  },
  {
    name: 'Carol Davis',
    email: 'carol@example.com',
    skill_level: 'advanced' as const,
    location: 'Los Angeles',
    bio: 'Competitive player'
  },
  {
    name: 'David Wilson',
    email: 'david@example.com',
    skill_level: 'beginner' as const,
    location: 'Los Angeles',
    bio: null
  }
];

describe('searchUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let createdUsers: any[] = [];

  beforeEach(async () => {
    // Create test users before each test
    createdUsers = [];
    for (const userData of testUsers) {
      const result = await db.insert(usersTable)
        .values(userData)
        .returning()
        .execute();
      createdUsers.push(result[0]);
    }
  });

  it('should return all users when no filters are provided', async () => {
    const input: SearchUsersInput = {};
    const result = await searchUsers(input);

    expect(result).toHaveLength(4);
    expect(result.map(u => u.name).sort()).toEqual(['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson']);
  });

  it('should filter users by location', async () => {
    const input: SearchUsersInput = {
      location: 'New York'
    };
    const result = await searchUsers(input);

    expect(result).toHaveLength(2);
    expect(result.every(user => user.location === 'New York')).toBe(true);
    expect(result.map(u => u.name).sort()).toEqual(['Alice Johnson', 'Bob Smith']);
  });

  it('should filter users by skill level', async () => {
    const input: SearchUsersInput = {
      skill_level: 'beginner'
    };
    const result = await searchUsers(input);

    expect(result).toHaveLength(2);
    expect(result.every(user => user.skill_level === 'beginner')).toBe(true);
    expect(result.map(u => u.name).sort()).toEqual(['Alice Johnson', 'David Wilson']);
  });

  it('should filter by both location and skill level', async () => {
    const input: SearchUsersInput = {
      location: 'New York',
      skill_level: 'beginner'
    };
    const result = await searchUsers(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice Johnson');
    expect(result[0].location).toBe('New York');
    expect(result[0].skill_level).toBe('beginner');
  });

  it('should exclude specified user from results', async () => {
    const aliceId = createdUsers.find(u => u.name === 'Alice Johnson').id;

    const input: SearchUsersInput = {
      location: 'New York',
      exclude_user_id: aliceId
    };
    const result = await searchUsers(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bob Smith');
    expect(result.every(user => user.id !== aliceId)).toBe(true);
  });

  it('should return empty array when no users match criteria', async () => {
    const input: SearchUsersInput = {
      location: 'Chicago', // No users in Chicago
      skill_level: 'advanced'
    };
    const result = await searchUsers(input);

    expect(result).toHaveLength(0);
  });

  it('should exclude user even when other filters match', async () => {
    const aliceId = createdUsers.find(u => u.name === 'Alice Johnson').id;

    const input: SearchUsersInput = {
      location: 'New York',
      skill_level: 'beginner',
      exclude_user_id: aliceId
    };
    const result = await searchUsers(input);

    // Alice matches location and skill level but should be excluded
    expect(result).toHaveLength(0);
  });

  it('should return users ordered by creation date', async () => {
    const input: SearchUsersInput = {};
    const result = await searchUsers(input);

    expect(result).toHaveLength(4);
    
    // Verify all results have created_at dates
    result.forEach(user => {
      expect(user.created_at).toBeInstanceOf(Date);
    });

    // Since they were created in order, verify the order is maintained
    for (let i = 1; i < result.length; i++) {
      expect(result[i].created_at >= result[i-1].created_at).toBe(true);
    }
  });

  it('should handle user with null bio correctly', async () => {
    const input: SearchUsersInput = {
      location: 'Los Angeles',
      skill_level: 'beginner'
    };
    const result = await searchUsers(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('David Wilson');
    expect(result[0].bio).toBeNull();
  });
});
