import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type SearchUsersInput, type User } from '../schema';
import { searchUsers } from '../handlers/search_users';
import { eq } from 'drizzle-orm';

// Helper to insert a user directly
const insertUser = async (user: { name: string; skill_level: string; location: string }) => {
  const [inserted] = await db
    .insert(usersTable)
    .values(user)
    .returning()
    .execute();
  return inserted as User;
};

describe('searchUsers handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns all users when no filters are provided', async () => {
    const userA = await insertUser({ name: 'Alice', skill_level: 'beginner', location: 'NY' });
    const userB = await insertUser({ name: 'Bob', skill_level: 'expert', location: 'SF' });

    const result = await searchUsers({});
    // Order is not guaranteed; check that both ids are present
    const ids = result.map((u) => u.id);
    expect(ids).toContain(userA.id);
    expect(ids).toContain(userB.id);
    expect(result).toHaveLength(2);
  });

  it('filters by location', async () => {
    const alice = await insertUser({ name: 'Alice', skill_level: 'beginner', location: 'NY' });
    await insertUser({ name: 'Bob', skill_level: 'expert', location: 'SF' });

    const input: SearchUsersInput = { location: 'NY' };
    const result = await searchUsers(input);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(alice.id);
    expect(result[0].location).toBe('NY');
  });

  it('filters by skill_level', async () => {
    const alice = await insertUser({ name: 'Alice', skill_level: 'beginner', location: 'NY' });
    await insertUser({ name: 'Bob', skill_level: 'expert', location: 'NY' });

    const input: SearchUsersInput = { skill_level: 'beginner' };
    const result = await searchUsers(input);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(alice.id);
    expect(result[0].skill_level).toBe('beginner');
  });

  it('filters by both location and skill_level', async () => {
    const alice = await insertUser({ name: 'Alice', skill_level: 'beginner', location: 'NY' });
    await insertUser({ name: 'Bob', skill_level: 'beginner', location: 'SF' });
    await insertUser({ name: 'Carol', skill_level: 'expert', location: 'NY' });

    const input: SearchUsersInput = { location: 'NY', skill_level: 'beginner' };
    const result = await searchUsers(input);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(alice.id);
  });

  it('returns empty array when no users match', async () => {
    await insertUser({ name: 'Alice', skill_level: 'beginner', location: 'NY' });
    const input: SearchUsersInput = { location: 'LA' };
    const result = await searchUsers(input);
    expect(result).toHaveLength(0);
  });
});
