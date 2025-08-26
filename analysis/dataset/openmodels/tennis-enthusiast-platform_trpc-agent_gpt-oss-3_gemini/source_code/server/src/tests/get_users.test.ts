import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { users } from '../db/schema';
import { type BrowseUsersInput } from '../schema';
import { getUsers } from '../handlers/get_users';

// Helper to insert a user into the test database
const insertUser = async (user: {
  name: string;
  bio?: string | null;
  skill_level: 'Beginner' | 'Intermediate' | 'Advanced';
  city: string;
  state: string;
}) => {
  const [result] = await db
    .insert(users)
    .values({
      name: user.name,
      bio: user.bio ?? null,
      skill_level: user.skill_level,
      city: user.city,
      state: user.state,
    })
    .returning()
    .execute();
  return result;
};

describe('getUsers handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns all users when no filters are provided', async () => {
    await insertUser({
      name: 'Alice',
      skill_level: 'Beginner',
      city: 'New York',
      state: 'NY',
    });
    await insertUser({
      name: 'Bob',
      skill_level: 'Advanced',
      city: 'Los Angeles',
      state: 'CA',
    });

    const result = await getUsers({});
    expect(result).toHaveLength(2);
    const names = result.map(u => u.name);
    expect(names).toContain('Alice');
    expect(names).toContain('Bob');
  });

  it('filters by skill_level correctly', async () => {
    await insertUser({
      name: 'Charlie',
      skill_level: 'Intermediate',
      city: 'Chicago',
      state: 'IL',
    });
    await insertUser({
      name: 'Dana',
      skill_level: 'Beginner',
      city: 'Houston',
      state: 'TX',
    });

    const input: BrowseUsersInput = { skill_level: 'Beginner' };
    const result = await getUsers(input);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Dana');
  });

  it('applies multiple filters (city and state)', async () => {
    await insertUser({
      name: 'Eve',
      skill_level: 'Advanced',
      city: 'Seattle',
      state: 'WA',
    });
    await insertUser({
      name: 'Frank',
      skill_level: 'Advanced',
      city: 'Seattle',
      state: 'OR',
    });

    const input: BrowseUsersInput = { city: 'Seattle', state: 'WA' };
    const result = await getUsers(input);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Eve');
  });
});
