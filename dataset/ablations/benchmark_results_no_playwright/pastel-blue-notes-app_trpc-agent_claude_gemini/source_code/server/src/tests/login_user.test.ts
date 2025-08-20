import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';
import { eq } from 'drizzle-orm';

// Test user data
const testUserData = {
  email: 'test@example.com',
  password_hash: 'test_password_123',
  created_at: new Date('2024-01-01T10:00:00Z'),
  updated_at: new Date('2024-01-01T10:00:00Z')
};

const validLoginInput: LoginUserInput = {
  email: 'test@example.com',
  password: 'test_password_123'
};

const invalidEmailInput: LoginUserInput = {
  email: 'nonexistent@example.com',
  password: 'test_password_123'
};

const invalidPasswordInput: LoginUserInput = {
  email: 'test@example.com',
  password: 'wrong_password'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate user with valid credentials', async () => {
    // Create test user in database
    await db.insert(usersTable)
      .values(testUserData)
      .execute();

    const result = await loginUser(validLoginInput);

    // Verify returned user data
    expect(result.email).toEqual('test@example.com');
    expect(result.password_hash).toEqual('test_password_123');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should return correct user from database', async () => {
    // Create test user in database
    const insertResult = await db.insert(usersTable)
      .values(testUserData)
      .returning()
      .execute();

    const createdUser = insertResult[0];
    const result = await loginUser(validLoginInput);

    // Verify the returned user matches the one in database
    expect(result.id).toEqual(createdUser.id);
    expect(result.email).toEqual(createdUser.email);
    expect(result.password_hash).toEqual(createdUser.password_hash);
    expect(result.created_at).toEqual(createdUser.created_at);
    expect(result.updated_at).toEqual(createdUser.updated_at);
  });

  it('should throw error for non-existent email', async () => {
    // Create test user but try to login with different email
    await db.insert(usersTable)
      .values(testUserData)
      .execute();

    await expect(loginUser(invalidEmailInput))
      .rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for wrong password', async () => {
    // Create test user in database
    await db.insert(usersTable)
      .values(testUserData)
      .execute();

    await expect(loginUser(invalidPasswordInput))
      .rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error when no users exist', async () => {
    // Don't create any users
    await expect(loginUser(validLoginInput))
      .rejects.toThrow(/invalid email or password/i);
  });

  it('should handle multiple users correctly', async () => {
    // Create multiple test users
    const user1Data = { ...testUserData, email: 'user1@example.com' };
    const user2Data = { ...testUserData, email: 'user2@example.com', password_hash: 'different_password' };

    await db.insert(usersTable)
      .values([user1Data, user2Data])
      .execute();

    // Login with first user's credentials
    const result1 = await loginUser({
      email: 'user1@example.com',
      password: 'test_password_123'
    });

    expect(result1.email).toEqual('user1@example.com');
    expect(result1.password_hash).toEqual('test_password_123');

    // Login with second user's credentials
    const result2 = await loginUser({
      email: 'user2@example.com',
      password: 'different_password'
    });

    expect(result2.email).toEqual('user2@example.com');
    expect(result2.password_hash).toEqual('different_password');

    // Verify users have different IDs
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should verify user exists in database after successful login', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUserData)
      .execute();

    const result = await loginUser(validLoginInput);

    // Query database to verify user still exists
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].password_hash).toEqual('test_password_123');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });
});
