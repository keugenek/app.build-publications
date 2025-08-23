import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type LoginUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';

const testUser = {
  email: 'test@example.com',
  password: 'supersecret', // will be stored as password_hash plain text for test
};

/** Helper to insert a user directly into the DB */
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

describe('loginUser handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login successfully with valid credentials', async () => {
    const inserted = await insertTestUser();
    const input: LoginUserInput = {
      email: testUser.email,
      password: testUser.password,
    };
    const loggedIn = await loginUser(input);

    expect(loggedIn).toBeDefined();
    expect(loggedIn.id).toBe(inserted.id);
    expect(loggedIn.email).toBe(testUser.email);
    expect(loggedIn.password_hash).toBe(testUser.password);
    expect(loggedIn.created_at).toBeInstanceOf(Date);
  });

  it('should reject login with incorrect password', async () => {
    await insertTestUser();
    const input: LoginUserInput = {
      email: testUser.email,
      password: 'wrongpassword',
    };
    await expect(loginUser(input)).rejects.toThrow(/Invalid credentials/i);
  });

  it('should reject login for non‑existent email', async () => {
    const input: LoginUserInput = {
      email: 'nonexistent@example.com',
      password: 'any',
    };
    await expect(loginUser(input)).rejects.toThrow(/Invalid credentials/i);
  });
});
