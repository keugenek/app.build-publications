import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { registerUser } from '../handlers/register_user';
import type { CreateUserInput, User } from '../schema';

const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'securePass123'
};

describe('registerUser handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new user and return correct fields', async () => {
    const result: User = await registerUser(testInput);

    expect(result.id).toBeDefined();
    expect(result.email).toBe(testInput.email);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the user in the database', async () => {
    const created = await registerUser(testInput);

    const users = await db.select().from(usersTable).where(eq(usersTable.id, created.id)).execute();
    expect(users).toHaveLength(1);
    const dbUser = users[0];
    expect(dbUser.email).toBe(testInput.email);
    // Password stored as plain text in password_hash column
    // @ts-ignore - password_hash is not part of the User output type
    expect(dbUser.password_hash).toBe(testInput.password);
    expect(dbUser.created_at).toBeInstanceOf(Date);
  });

  it('should throw an error when registering with duplicate email', async () => {
    await registerUser(testInput);
    await expect(registerUser(testInput)).rejects.toThrow();
  });
});
