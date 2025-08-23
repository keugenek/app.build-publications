import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { users } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Basic input without bio
const inputWithoutBio: CreateUserInput = {
  name: 'Alice',
  skill_level: 'Beginner',
  city: 'Springfield',
  state: 'IL',
  // bio omitted intentionally
};

// Input with explicit null bio
const inputWithNullBio: CreateUserInput = {
  name: 'Bob',
  bio: null,
  skill_level: 'Advanced',
  city: 'Metropolis',
  state: 'NY',
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('creates a user without providing a bio', async () => {
    const result = await createUser(inputWithoutBio);

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Alice');
    expect(result.bio).toBeNull(); // bio should default to null
    expect(result.skill_level).toBe('Beginner');
    expect(result.city).toBe('Springfield');
    expect(result.state).toBe('IL');
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify persisted in DB
    const rows = await db.select().from(users).where(eq(users.id, result.id)).execute();
    expect(rows).toHaveLength(1);
    const dbUser = rows[0];
    expect(dbUser.name).toBe('Alice');
    expect(dbUser.bio).toBeNull();
    expect(dbUser.skill_level).toBe('Beginner');
    expect(dbUser.city).toBe('Springfield');
    expect(dbUser.state).toBe('IL');
    expect(dbUser.created_at).toBeInstanceOf(Date);
  });

  it('creates a user with an explicit null bio', async () => {
    const result = await createUser(inputWithNullBio);

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Bob');
    expect(result.bio).toBeNull();
    expect(result.skill_level).toBe('Advanced');
    expect(result.city).toBe('Metropolis');
    expect(result.state).toBe('NY');
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify persisted in DB
    const rows = await db.select().from(users).where(eq(users.id, result.id)).execute();
    expect(rows).toHaveLength(1);
    const dbUser = rows[0];
    expect(dbUser.name).toBe('Bob');
    expect(dbUser.bio).toBeNull();
    expect(dbUser.skill_level).toBe('Advanced');
    expect(dbUser.city).toBe('Metropolis');
    expect(dbUser.state).toBe('NY');
  });
});
