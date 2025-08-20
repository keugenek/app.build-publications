import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable } from '../db/schema';
import { getPlayers } from '../handlers/get_players';
import { sql } from 'drizzle-orm';

describe('getPlayers', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.execute(sql`
      INSERT INTO players (name, email, skill_level, city) VALUES 
        ('Alice', 'alice@example.com', 'Beginner', 'New York'),
        ('Bob', 'bob@example.com', 'Intermediate', 'Los Angeles'),
        ('Charlie', 'charlie@example.com', 'Advanced', 'Chicago');
    `);
  });
  
  afterEach(resetDB);

  it('should fetch all players', async () => {
    const players = await getPlayers();
    
    expect(players).toHaveLength(3);
    
    // Check that all expected players are returned
    const playerNames = players.map(p => p.name).sort();
    expect(playerNames).toEqual(['Alice', 'Bob', 'Charlie']);
    
    // Check the structure of the first player
    const firstPlayer = players[0];
    expect(firstPlayer).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      skill_level: expect.stringMatching(/^(Beginner|Intermediate|Advanced)$/),
      city: expect.any(String)
    });
    expect(firstPlayer.created_at).toBeInstanceOf(Date);
  });

  it('should return an empty array when no players exist', async () => {
    // Clear the database
    await db.delete(playersTable).execute();
    
    const players = await getPlayers();
    expect(players).toHaveLength(0);
  });
});
