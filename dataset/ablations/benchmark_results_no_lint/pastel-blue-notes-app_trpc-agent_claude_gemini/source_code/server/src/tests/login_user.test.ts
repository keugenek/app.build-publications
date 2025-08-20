import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'test@example.com',
  password_hash: 'test_password_123',
  created_at: new Date(),
  updated_at: new Date()
};

const validLoginInput: LoginUserInput = {
  email: 'test@example.com',
  password: 'test_password_123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate user with valid credentials', async () => {
    // Create test user first
    const insertResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const createdUser = insertResult[0];

    const result = await loginUser(validLoginInput);

    // Verify user data
    expect(result.id).toEqual(createdUser.id);
    expect(result.email).toEqual('test@example.com');
    expect(result.password_hash).toEqual('test_password_123');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent email', async () => {
    const invalidInput: LoginUserInput = {
      email: 'nonexistent@example.com',
      password: 'any_password'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for incorrect password', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const invalidInput: LoginUserInput = {
      email: 'test@example.com',
      password: 'wrong_password'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should not expose user data in database after successful login', async () => {
    // Create test user first
    const insertResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const createdUser = insertResult[0];
    
    await loginUser(validLoginInput);

    // Verify user still exists in database unchanged
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, createdUser.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].password_hash).toEqual('test_password_123');
  });

  it('should handle case-sensitive email matching', async () => {
    // Create test user with lowercase email
    await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Try login with uppercase email
    const uppercaseEmailInput: LoginUserInput = {
      email: 'TEST@EXAMPLE.COM',
      password: 'test_password_123'
    };

    await expect(loginUser(uppercaseEmailInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should authenticate different users independently', async () => {
    // Create two test users
    const user1 = {
      email: 'user1@example.com',
      password_hash: 'password1',
      created_at: new Date(),
      updated_at: new Date()
    };

    const user2 = {
      email: 'user2@example.com',
      password_hash: 'password2',
      created_at: new Date(),
      updated_at: new Date()
    };

    await db.insert(usersTable).values([user1, user2]).execute();

    // Login as first user
    const result1 = await loginUser({
      email: 'user1@example.com',
      password: 'password1'
    });

    // Login as second user
    const result2 = await loginUser({
      email: 'user2@example.com',
      password: 'password2'
    });

    // Verify both authentications are independent
    expect(result1.email).toEqual('user1@example.com');
    expect(result1.password_hash).toEqual('password1');
    expect(result2.email).toEqual('user2@example.com');
    expect(result2.password_hash).toEqual('password2');
    expect(result1.id).not.toEqual(result2.id);
  });
});
