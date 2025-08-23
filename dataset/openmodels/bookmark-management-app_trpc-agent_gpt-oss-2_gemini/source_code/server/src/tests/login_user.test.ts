import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type LoginUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';

const testUser = {
  email: 'test@example.com',
  password: 'secret123',
};

describe('loginUser handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login successfully with correct credentials', async () => {
    // Insert user
    await db.insert(users).values({
      email: testUser.email,
      password_hash: testUser.password, // plain for demo
    }).execute();

    const input: LoginUserInput = { email: testUser.email, password: testUser.password };
    const result = await loginUser(input);

    expect(result.email).toBe(testUser.email);
    expect(result.password_hash).toBe(testUser.password);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should reject when password is incorrect', async () => {
    await db.insert(users).values({
      email: testUser.email,
      password_hash: testUser.password,
    }).execute();

    const input: LoginUserInput = { email: testUser.email, password: 'wrong' };
    await expect(loginUser(input)).rejects.toThrow('Invalid password');
  });

  it('should reject when user does not exist', async () => {
    const input: LoginUserInput = { email: 'nonexistent@example.com', password: 'any' };
    await expect(loginUser(input)).rejects.toThrow('User not found');
  });
});
