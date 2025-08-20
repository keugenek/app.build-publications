import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type SearchPlayersInput } from '../schema';
import { searchPlayers } from '../handlers/search_players';
import { eq } from 'drizzle-orm';

describe('searchPlayers', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test players
    await db.insert(playersTable).values([
      {
        name: 'Alice Johnson',
        email: 'alice.johnson@example.com',
        skill_level: 'Beginner',
        city: 'New York'
      },
      {
        name: 'Bob Smith',
        email: 'bob.smith@example.com',
        skill_level: 'Intermediate',
        city: 'New York'
      },
      {
        name: 'Charlie Brown',
        email: 'charlie.brown@example.com',
        skill_level: 'Advanced',
        city: 'Los Angeles'
      },
      {
        name: 'Diana Prince',
        email: 'diana.prince@example.com',
        skill_level: 'Beginner',
        city: 'Los Angeles'
      }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should return all players when no filters are provided', async () => {
    const result = await searchPlayers({});
    
    expect(result).toHaveLength(4);
    
    // Check that all required fields are present
    result.forEach(player => {
      expect(player.id).toBeDefined();
      expect(player.name).toBeDefined();
      expect(player.skill_level).toBeDefined();
      expect(player.city).toBeDefined();
      expect(player.created_at).toBeInstanceOf(Date);
    });
  });

  it('should filter players by skill level', async () => {
    const input: SearchPlayersInput = { skill_level: 'Beginner' };
    const result = await searchPlayers(input);
    
    expect(result).toHaveLength(2);
    result.forEach(player => {
      expect(player.skill_level).toBe('Beginner');
    });
  });

  it('should filter players by city', async () => {
    const input: SearchPlayersInput = { city: 'New York' };
    const result = await searchPlayers(input);
    
    expect(result).toHaveLength(2);
    result.forEach(player => {
      expect(player.city).toBe('New York');
    });
  });

  it('should filter players by both skill level and city', async () => {
    const input: SearchPlayersInput = { 
      skill_level: 'Beginner',
      city: 'New York'
    };
    const result = await searchPlayers(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice Johnson');
    expect(result[0].skill_level).toBe('Beginner');
    expect(result[0].city).toBe('New York');
  });

  it('should return empty array when no players match the criteria', async () => {
    const input: SearchPlayersInput = { 
      skill_level: 'Advanced',
      city: 'Chicago'
    };
    const result = await searchPlayers(input);
    
    expect(result).toHaveLength(0);
  });
});
