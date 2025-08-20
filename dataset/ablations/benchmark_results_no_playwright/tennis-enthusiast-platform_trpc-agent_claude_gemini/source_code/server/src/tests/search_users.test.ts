import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type SearchUsersInput, type CreateUserProfileInput } from '../schema';
import { searchUsers } from '../handlers/search_users';

// Test data for creating user profiles
const testUsers: CreateUserProfileInput[] = [
  {
    name: 'Alice Johnson',
    bio: 'Love playing tennis every morning!',
    skill_level: 'Beginner',
    location: 'New York'
  },
  {
    name: 'Bob Smith',
    bio: 'Advanced player looking for competitive matches',
    skill_level: 'Advanced',
    location: 'New York'
  },
  {
    name: 'Charlie Brown',
    bio: null,
    skill_level: 'Intermediate',
    location: 'Los Angeles'
  },
  {
    name: 'Diana Ross',
    bio: 'Tennis is my passion',
    skill_level: 'Beginner',
    location: 'Chicago'
  }
];

describe('searchUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test users
  const createTestUsers = async () => {
    const createdUsers = [];
    for (const user of testUsers) {
      const result = await db.insert(userProfilesTable)
        .values({
          name: user.name,
          bio: user.bio,
          skill_level: user.skill_level,
          location: user.location
        })
        .returning()
        .execute();
      createdUsers.push(result[0]);
    }
    return createdUsers;
  };

  it('should return all users when no filters are provided', async () => {
    await createTestUsers();

    const input: SearchUsersInput = {};
    const results = await searchUsers(input);

    expect(results).toHaveLength(4);
    
    // Check that all test users are returned
    const names = results.map(user => user.name).sort();
    expect(names).toEqual(['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Ross']);
    
    // Verify structure of returned users
    results.forEach(user => {
      expect(user.id).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.skill_level).toBeDefined();
      expect(user.location).toBeDefined();
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should filter users by skill level', async () => {
    await createTestUsers();

    const input: SearchUsersInput = {
      skill_level: 'Beginner'
    };
    const results = await searchUsers(input);

    expect(results).toHaveLength(2);
    results.forEach(user => {
      expect(user.skill_level).toBe('Beginner');
    });

    const names = results.map(user => user.name).sort();
    expect(names).toEqual(['Alice Johnson', 'Diana Ross']);
  });

  it('should filter users by location', async () => {
    await createTestUsers();

    const input: SearchUsersInput = {
      location: 'New York'
    };
    const results = await searchUsers(input);

    expect(results).toHaveLength(2);
    results.forEach(user => {
      expect(user.location).toBe('New York');
    });

    const names = results.map(user => user.name).sort();
    expect(names).toEqual(['Alice Johnson', 'Bob Smith']);
  });

  it('should filter users by both skill level and location', async () => {
    await createTestUsers();

    const input: SearchUsersInput = {
      skill_level: 'Beginner',
      location: 'New York'
    };
    const results = await searchUsers(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Alice Johnson');
    expect(results[0].skill_level).toBe('Beginner');
    expect(results[0].location).toBe('New York');
  });

  it('should return empty array when no users match filters', async () => {
    await createTestUsers();

    const input: SearchUsersInput = {
      skill_level: 'Advanced',
      location: 'Miami'
    };
    const results = await searchUsers(input);

    expect(results).toHaveLength(0);
  });

  it('should return empty array when no users exist', async () => {
    // Don't create any test users
    const input: SearchUsersInput = {};
    const results = await searchUsers(input);

    expect(results).toHaveLength(0);
  });

  it('should handle different skill levels correctly', async () => {
    await createTestUsers();

    // Test Advanced skill level
    const advancedInput: SearchUsersInput = { skill_level: 'Advanced' };
    const advancedResults = await searchUsers(advancedInput);
    expect(advancedResults).toHaveLength(1);
    expect(advancedResults[0].name).toBe('Bob Smith');

    // Test Intermediate skill level
    const intermediateInput: SearchUsersInput = { skill_level: 'Intermediate' };
    const intermediateResults = await searchUsers(intermediateInput);
    expect(intermediateResults).toHaveLength(1);
    expect(intermediateResults[0].name).toBe('Charlie Brown');
  });

  it('should handle location case sensitivity correctly', async () => {
    await createTestUsers();

    // Test exact case match
    const input: SearchUsersInput = {
      location: 'Los Angeles'
    };
    const results = await searchUsers(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Charlie Brown');
    expect(results[0].location).toBe('Los Angeles');
  });

  it('should preserve user data integrity', async () => {
    await createTestUsers();

    const input: SearchUsersInput = {
      skill_level: 'Intermediate'
    };
    const results = await searchUsers(input);

    expect(results).toHaveLength(1);
    const user = results[0];
    
    // Verify all fields are present and correct
    expect(user.name).toBe('Charlie Brown');
    expect(user.bio).toBeNull(); // Charlie has null bio
    expect(user.skill_level).toBe('Intermediate');
    expect(user.location).toBe('Los Angeles');
    expect(user.id).toBeGreaterThan(0);
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });
});
