import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type SearchPlayersInput, type CreateUserProfileInput } from '../schema';
import { searchPlayers } from '../handlers/search_players';

// Test user data
const testUsers: CreateUserProfileInput[] = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    skill_level: 'beginner',
    location: 'New York',
    bio: 'Beginner tennis player'
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    skill_level: 'intermediate',
    location: 'New York',
    bio: 'Intermediate tennis player'
  },
  {
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    skill_level: 'advanced',
    location: 'Los Angeles',
    bio: 'Advanced tennis player'
  },
  {
    name: 'Diana Prince',
    email: 'diana@example.com',
    skill_level: 'advanced',
    location: 'New York',
    bio: 'Professional tennis player'
  }
];

describe('searchPlayers', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test users
    for (const user of testUsers) {
      await db.insert(userProfilesTable).values(user).execute();
    }
  });
  
  afterEach(resetDB);

  it('should return all users when no filters are provided', async () => {
    const result = await searchPlayers({});
    
    expect(result).toHaveLength(4);
    
    // Verify all users are returned with correct types
    result.forEach(user => {
      expect(typeof user.id).toBe('number');
      expect(typeof user.name).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(['beginner', 'intermediate', 'advanced']).toContain(user.skill_level);
      expect(typeof user.location).toBe('string');
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should filter users by location', async () => {
    const input: SearchPlayersInput = { location: 'New York' };
    const result = await searchPlayers(input);
    
    expect(result).toHaveLength(3);
    
    // Verify all results are from New York
    result.forEach(user => {
      expect(user.location.toLowerCase()).toContain('new york');
    });
  });

  it('should filter users by skill level', async () => {
    const input: SearchPlayersInput = { skill_level: 'advanced' };
    const result = await searchPlayers(input);
    
    expect(result).toHaveLength(2);
    
    // Verify all results are advanced players
    result.forEach(user => {
      expect(user.skill_level).toBe('advanced');
    });
  });

  it('should filter users by both location and skill level', async () => {
    const input: SearchPlayersInput = { 
      location: 'New York', 
      skill_level: 'advanced' 
    };
    const result = await searchPlayers(input);
    
    expect(result).toHaveLength(1);
    
    // Verify the result is an advanced player from New York
    expect(result[0].name).toBe('Diana Prince');
    expect(result[0].location.toLowerCase()).toContain('new york');
    expect(result[0].skill_level).toBe('advanced');
  });

  it('should perform case-insensitive location search', async () => {
    const input: SearchPlayersInput = { location: 'new york' }; // lowercase
    const result = await searchPlayers(input);
    
    expect(result).toHaveLength(3);
    
    // Verify all results are from New York regardless of case
    result.forEach(user => {
      expect(user.location.toLowerCase()).toContain('new york');
    });
  });

  it('should return empty array when no users match filters', async () => {
    const input: SearchPlayersInput = { 
      location: 'Chicago', 
      skill_level: 'beginner' 
    };
    const result = await searchPlayers(input);
    
    expect(result).toHaveLength(0);
  });
});
