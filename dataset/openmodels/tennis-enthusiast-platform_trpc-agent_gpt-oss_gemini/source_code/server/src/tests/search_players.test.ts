import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type SearchPlayersInput } from '../schema';
import { searchPlayers } from '../handlers/search_players';


// Helper to insert a user
const insertUser = async (user: {
  username: string;
  skill_level: any;
  location: string;
  profile_picture_url?: string | null;
}) => {
  const [inserted] = await db
    .insert(usersTable)
    .values({
      username: user.username,
      skill_level: user.skill_level as any,
      location: user.location,
      profile_picture_url: user.profile_picture_url ?? null,
    })
    .returning()
    .execute();
  return inserted;
};

describe('searchPlayers handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns all users when no filters are provided', async () => {
    // Insert two users
    await insertUser({
      username: 'alice',
      skill_level: 'BEGINNER',
      location: 'NY',
    });
    await insertUser({
      username: 'bob',
      skill_level: 'INTERMEDIATE',
      location: 'SF',
    });

    const result = await searchPlayers({});
    expect(result).toHaveLength(2);
    const usernames = result.map(u => u.username).sort();
    expect(usernames).toEqual(['alice', 'bob']);
  });

  it('filters by skill level correctly', async () => {
    await insertUser({
      username: 'charlie',
      skill_level: 'ADVANCED',
      location: 'LA',
    });
    await insertUser({
      username: 'dave',
      skill_level: 'BEGINNER',
      location: 'LA',
    });

    const input: SearchPlayersInput = { skill_level: 'ADVANCED' };
    const result = await searchPlayers(input);
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('charlie');
  });

  it('applies multiple filters using AND', async () => {
    await insertUser({
      username: 'eve',
      skill_level: 'INTERMEDIATE',
      location: 'Berlin',
    });
    await insertUser({
      username: 'frank',
      skill_level: 'INTERMEDIATE',
      location: 'Paris',
    });

    const input: SearchPlayersInput = {
      skill_level: 'INTERMEDIATE',
      location: 'Berlin',
    };
    const result = await searchPlayers(input);
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('eve');
  });
});
