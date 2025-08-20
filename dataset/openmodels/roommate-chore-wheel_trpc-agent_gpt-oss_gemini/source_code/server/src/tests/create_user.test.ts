import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateUserInput = {
  name: 'Alice'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user and return proper fields', async () => {
    const result = await createUser(testInput);

    // Validate returned user
    expect(result.id).toBeDefined();
    expect(result.name).toBe(testInput.name);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the user in the database', async () => {
    const result = await createUser(testInput);

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    const stored = users[0];
    expect(stored.name).toBe(testInput.name);
    expect(stored.created_at).toBeInstanceOf(Date);
    expect(stored.id).toBe(result.id);
  });

  it('should assign a new incremental ID for each user', async () => {
    const user1 = await createUser({ name: 'Bob' });
    const user2 = await createUser({ name: 'Carol' });
    expect(user2.id).toBeGreaterThan(user1.id);
  });
});
