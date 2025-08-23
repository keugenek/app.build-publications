import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login } from '../handlers/login';
import { eq } from 'drizzle-orm';

const testUser = {
  email: 'test@example.com',
  password: 'password123', // plain text for this demo
};

// Helper to insert a user directly into the DB
const insertTestUser = async () => {
  const result = await db
    .insert(usersTable)
    .values({
      email: testUser.email,
      password_hash: testUser.password,
    })
    .returning()
    .execute();
  return result[0];
};

describe('login handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login successfully with correct credentials', async () => {
    const inserted = await insertTestUser();
    const input: LoginInput = {
      email: testUser.email,
      password: testUser.password,
    };
    const user = await login(input);
    expect(user.id).toBe(inserted.id);
    expect(user.email).toBe(testUser.email);
    expect(user.created_at).toBeInstanceOf(Date);
  });

  it('should throw for non‑existent email', async () => {
    const input: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'any',
    };
    await expect(login(input)).rejects.toThrow(/Invalid credentials/i);
  });

  it('should throw for incorrect password', async () => {
    await insertTestUser();
    const input: LoginInput = {
      email: testUser.email,
      password: 'wrongPassword',
    };
    await expect(login(input)).rejects.toThrow(/Invalid credentials/i);
  });
});
