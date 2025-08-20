import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type CreateUserProfileInput } from '../schema';
import { createProfile } from '../handlers/create_user_profile';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateUserProfileInput = {
  name: 'John Doe',
  skill_level: 'Intermediate',
  city: 'New York'
};

describe('createProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user profile', async () => {
    const result = await createProfile(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.skill_level).toEqual('Intermediate');
    expect(result.city).toEqual('New York');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save profile to database', async () => {
    const result = await createProfile(testInput);

    // Query using proper drizzle syntax
    const players = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, result.id))
      .execute();

    expect(players).toHaveLength(1);
    expect(players[0].name).toEqual('John Doe');
    expect(players[0].skill_level).toEqual('Intermediate');
    expect(players[0].city).toEqual('New York');
    expect(players[0].created_at).toBeInstanceOf(Date);
  });

  it('should generate unique email for each user', async () => {
    const result1 = await createProfile(testInput);
    const result2 = await createProfile(testInput);

    // Query the database to verify unique emails
    const players = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, result1.id))
      .execute();

    const players2 = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, result2.id))
      .execute();

    expect(players).toHaveLength(1);
    expect(players2).toHaveLength(1);
    expect(players[0].email).not.toEqual(players2[0].email);
  });
});
