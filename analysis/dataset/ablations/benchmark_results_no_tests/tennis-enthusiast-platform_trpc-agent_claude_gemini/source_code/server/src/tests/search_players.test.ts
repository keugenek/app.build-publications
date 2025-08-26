import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type SearchFilters, type CreateUserProfileInput } from '../schema';
import { searchPlayers } from '../handlers/search_players';

// Test data for creating user profiles
const testUsers: CreateUserProfileInput[] = [
  {
    name: 'Alice Johnson',
    skill_level: 'Beginner',
    city: 'Austin',
    state: 'Texas',
    bio: 'New to tennis, looking for practice partners'
  },
  {
    name: 'Bob Smith',
    skill_level: 'Intermediate',
    city: 'Austin',
    state: 'Texas',
    bio: 'Been playing for 2 years, love doubles'
  },
  {
    name: 'Carol Davis',
    skill_level: 'Advanced',
    city: 'Dallas',
    state: 'Texas',
    bio: 'Former college player, competitive matches'
  },
  {
    name: 'David Wilson',
    skill_level: 'Beginner',
    city: 'Dallas',
    state: 'Texas',
    bio: 'Just started learning, very enthusiastic'
  },
  {
    name: 'Eva Martinez',
    skill_level: 'Intermediate',
    city: 'Phoenix',
    state: 'Arizona',
    bio: 'Weekend warrior, social games preferred'
  }
];

describe('searchPlayers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test users
  const createTestUsers = async () => {
    return await db.insert(userProfilesTable)
      .values(testUsers)
      .returning()
      .execute();
  };

  it('should return all players when no filters are provided', async () => {
    await createTestUsers();

    const filters: SearchFilters = {};
    const results = await searchPlayers(filters);

    expect(results).toHaveLength(5);
    expect(results.every(player => typeof player.id === 'number')).toBe(true);
    expect(results.every(player => player.created_at instanceof Date)).toBe(true);
  });

  it('should filter players by skill level', async () => {
    await createTestUsers();

    const filters: SearchFilters = {
      skill_level: 'Beginner'
    };
    const results = await searchPlayers(filters);

    expect(results).toHaveLength(2);
    expect(results.every(player => player.skill_level === 'Beginner')).toBe(true);
    expect(results.map(p => p.name).sort()).toEqual(['Alice Johnson', 'David Wilson']);
  });

  it('should filter players by city', async () => {
    await createTestUsers();

    const filters: SearchFilters = {
      city: 'Austin'
    };
    const results = await searchPlayers(filters);

    expect(results).toHaveLength(2);
    expect(results.every(player => player.city === 'Austin')).toBe(true);
    expect(results.map(p => p.name).sort()).toEqual(['Alice Johnson', 'Bob Smith']);
  });

  it('should filter players by state', async () => {
    await createTestUsers();

    const filters: SearchFilters = {
      state: 'Texas'
    };
    const results = await searchPlayers(filters);

    expect(results).toHaveLength(4);
    expect(results.every(player => player.state === 'Texas')).toBe(true);
    expect(results.map(p => p.name).sort()).toEqual([
      'Alice Johnson', 
      'Bob Smith', 
      'Carol Davis', 
      'David Wilson'
    ]);
  });

  it('should filter players by multiple criteria', async () => {
    await createTestUsers();

    const filters: SearchFilters = {
      skill_level: 'Beginner',
      state: 'Texas'
    };
    const results = await searchPlayers(filters);

    expect(results).toHaveLength(2);
    expect(results.every(player => 
      player.skill_level === 'Beginner' && player.state === 'Texas'
    )).toBe(true);
    expect(results.map(p => p.name).sort()).toEqual(['Alice Johnson', 'David Wilson']);
  });

  it('should filter players by city and state', async () => {
    await createTestUsers();

    const filters: SearchFilters = {
      city: 'Dallas',
      state: 'Texas'
    };
    const results = await searchPlayers(filters);

    expect(results).toHaveLength(2);
    expect(results.every(player => 
      player.city === 'Dallas' && player.state === 'Texas'
    )).toBe(true);
    expect(results.map(p => p.name).sort()).toEqual(['Carol Davis', 'David Wilson']);
  });

  it('should filter players by all criteria', async () => {
    await createTestUsers();

    const filters: SearchFilters = {
      skill_level: 'Advanced',
      city: 'Dallas',
      state: 'Texas'
    };
    const results = await searchPlayers(filters);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Carol Davis');
    expect(results[0].skill_level).toEqual('Advanced');
    expect(results[0].city).toEqual('Dallas');
    expect(results[0].state).toEqual('Texas');
  });

  it('should return empty array when no matches found', async () => {
    await createTestUsers();

    const filters: SearchFilters = {
      skill_level: 'Advanced',
      city: 'NonexistentCity',
      state: 'Texas'
    };
    const results = await searchPlayers(filters);

    expect(results).toHaveLength(0);
  });

  it('should return empty array when database is empty', async () => {
    const filters: SearchFilters = {
      skill_level: 'Beginner'
    };
    const results = await searchPlayers(filters);

    expect(results).toHaveLength(0);
  });

  it('should return correct player data structure', async () => {
    const createdUsers = await createTestUsers();

    const results = await searchPlayers({});

    const aliceResult = results.find(p => p.name === 'Alice Johnson');
    expect(aliceResult).toBeDefined();
    
    if (aliceResult) {
      expect(aliceResult.id).toBeDefined();
      expect(typeof aliceResult.id).toBe('number');
      expect(aliceResult.name).toBe('Alice Johnson');
      expect(aliceResult.skill_level).toBe('Beginner');
      expect(aliceResult.city).toBe('Austin');
      expect(aliceResult.state).toBe('Texas');
      expect(aliceResult.bio).toBe('New to tennis, looking for practice partners');
      expect(aliceResult.created_at).toBeInstanceOf(Date);
    }
  });
});
