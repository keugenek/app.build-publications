import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'secure123',
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user and return correct fields', async () => {
    const result = await createUser(testInput);
    expect(result.id).toBeGreaterThan(0);
    expect(result.email).toBe(testInput.email);
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
    const user = users[0];
    expect(user.email).toBe(testInput.email);
    // password_hash stored as plain password in this demo implementation
    expect(user.password_hash).toBe(testInput.password);
    expect(user.created_at).toBeInstanceOf(Date);
  });
});
