import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'plaintext_password' // In production, this would be a proper hash
};

const testLoginInput: LoginUserInput = {
  email: 'test@example.com',
  password: 'plaintext_password'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully login with valid credentials', async () => {
    // Create a test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await loginUser(testLoginInput);

    // Verify user data is returned
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.password_hash).toEqual('plaintext_password');
    expect(result.id).toBeDefined();
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
    // Create a test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const wrongPasswordInput: LoginUserInput = {
      email: 'test@example.com',
      password: 'wrong_password'
    };

    await expect(loginUser(wrongPasswordInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should return correct user data when multiple users exist', async () => {
    // Create multiple test users
    const user1 = {
      username: 'user1',
      email: 'user1@example.com',
      password_hash: 'password1'
    };

    const user2 = {
      username: 'user2',
      email: 'user2@example.com', 
      password_hash: 'password2'
    };

    await db.insert(usersTable)
      .values([user1, user2])
      .execute();

    // Login as user2
    const loginInput: LoginUserInput = {
      email: 'user2@example.com',
      password: 'password2'
    };

    const result = await loginUser(loginInput);

    // Verify correct user is returned
    expect(result.username).toEqual('user2');
    expect(result.email).toEqual('user2@example.com');
    expect(result.password_hash).toEqual('password2');
  });

  it('should handle email case sensitivity correctly', async () => {
    // Create a test user with lowercase email
    await db.insert(usersTable)
      .values({
        ...testUser,
        email: 'test@example.com'
      })
      .execute();

    // Try logging in with uppercase email
    const upperCaseInput: LoginUserInput = {
      email: 'TEST@EXAMPLE.COM',
      password: 'plaintext_password'
    };

    // This should fail since email comparison is case-sensitive
    await expect(loginUser(upperCaseInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should handle empty password correctly', async () => {
    // Create a test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const emptyPasswordInput: LoginUserInput = {
      email: 'test@example.com',
      password: ''
    };

    await expect(loginUser(emptyPasswordInput)).rejects.toThrow(/invalid email or password/i);
  });
});
