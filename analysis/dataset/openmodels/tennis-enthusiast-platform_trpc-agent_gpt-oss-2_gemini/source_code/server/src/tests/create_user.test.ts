import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateUserInput = {
  name: 'John Doe',
  skill_level: 'intermediate',
  location: 'New York',
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user and return all fields', async () => {
    const result = await createUser(testInput);

    expect(result.id).toBeGreaterThan(0);
    expect(result.name).toBe(testInput.name);
    expect(result.skill_level).toBe(testInput.skill_level);
    expect(result.location).toBe(testInput.location);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the user in the database', async () => {
    const result = await createUser(testInput);

    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.name).toBe(testInput.name);
    expect(row.skill_level).toBe(testInput.skill_level);
    expect(row.location).toBe(testInput.location);
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
