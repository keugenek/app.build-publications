import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'securePass123'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user and return proper fields', async () => {
    const result = await createUser(testInput);
    expect(result.id).toBeGreaterThan(0);
    expect(result.email).toBe(testInput.email);
    expect(result.password_hash).toBe('hashed_placeholder');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the user in the database', async () => {
    const result = await createUser(testInput);
    const users = await db.select().from(usersTable).where(eq(usersTable.email, testInput.email)).execute();
    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.id).toBe(result.id);
    expect(user.email).toBe(testInput.email);
    expect(user.password_hash).toBe('hashed_placeholder');
    expect(user.created_at).toBeInstanceOf(Date);
  });
});
