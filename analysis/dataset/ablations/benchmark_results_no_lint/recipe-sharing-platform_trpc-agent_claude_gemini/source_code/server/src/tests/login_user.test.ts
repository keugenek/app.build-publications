import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';

// Simple password hashing function to match the handler implementation
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Test inputs
const validLoginInput: LoginInput = {
  email: 'test@example.com',
  password: 'password123'
};

const invalidPasswordInput: LoginInput = {
  email: 'test@example.com',
  password: 'wrongpassword'
};

const nonExistentUserInput: LoginInput = {
  email: 'nonexistent@example.com',
  password: 'password123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user on valid credentials', async () => {
    // Create test user with hashed password
    const hashedPassword = await hashPassword('password123');
    
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: hashedPassword,
        name: 'Test User'
      })
      .execute();

    const result = await loginUser(validLoginInput);

    expect(result).not.toBeNull();
    expect(result!.email).toEqual('test@example.com');
    expect(result!.name).toEqual('Test User');
    expect(result!.id).toBeDefined();
    expect(result!.password_hash).toEqual(hashedPassword);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for invalid password', async () => {
    // Create test user with different password hash
    const hashedPassword = await hashPassword('password123');
    
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: hashedPassword,
        name: 'Test User'
      })
      .execute();

    const result = await loginUser(invalidPasswordInput);

    expect(result).toBeNull();
  });

  it('should return null for non-existent user', async () => {
    const result = await loginUser(nonExistentUserInput);

    expect(result).toBeNull();
  });

  it('should handle empty password correctly', async () => {
    // Create test user
    const hashedPassword = await hashPassword('password123');
    
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: hashedPassword,
        name: 'Test User'
      })
      .execute();

    const emptyPasswordInput: LoginInput = {
      email: 'test@example.com',
      password: ''
    };

    const result = await loginUser(emptyPasswordInput);

    expect(result).toBeNull();
  });

  it('should handle case-sensitive email matching', async () => {
    // Create test user with lowercase email
    const hashedPassword = await hashPassword('password123');
    
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: hashedPassword,
        name: 'Test User'
      })
      .execute();

    // Try logging in with uppercase email
    const uppercaseEmailInput: LoginInput = {
      email: 'TEST@EXAMPLE.COM',
      password: 'password123'
    };

    const result = await loginUser(uppercaseEmailInput);

    // Should return null because email doesn't match exactly
    expect(result).toBeNull();
  });

  it('should verify password against correct hash', async () => {
    // Create test user with specific password
    const originalPassword = 'mySecurePassword123!';
    const hashedPassword = await hashPassword(originalPassword);
    
    await db.insert(usersTable)
      .values({
        email: 'secure@example.com',
        password_hash: hashedPassword,
        name: 'Secure User'
      })
      .execute();

    // Test with correct password
    const correctPasswordInput: LoginInput = {
      email: 'secure@example.com',
      password: originalPassword
    };

    const result = await loginUser(correctPasswordInput);

    expect(result).not.toBeNull();
    expect(result!.email).toEqual('secure@example.com');
    expect(result!.name).toEqual('Secure User');

    // Test with incorrect password
    const incorrectPasswordInput: LoginInput = {
      email: 'secure@example.com',
      password: 'wrongPassword'
    };

    const failResult = await loginUser(incorrectPasswordInput);
    expect(failResult).toBeNull();
  });

  it('should handle multiple users with different credentials', async () => {
    // Create multiple test users
    const user1Password = await hashPassword('password1');
    const user2Password = await hashPassword('password2');
    
    await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          password_hash: user1Password,
          name: 'User One'
        },
        {
          email: 'user2@example.com',
          password_hash: user2Password,
          name: 'User Two'
        }
      ])
      .execute();

    // Test login for first user
    const user1Login = await loginUser({
      email: 'user1@example.com',
      password: 'password1'
    });

    expect(user1Login).not.toBeNull();
    expect(user1Login!.name).toEqual('User One');

    // Test login for second user
    const user2Login = await loginUser({
      email: 'user2@example.com',
      password: 'password2'
    });

    expect(user2Login).not.toBeNull();
    expect(user2Login!.name).toEqual('User Two');

    // Test cross-authentication should fail
    const crossAuth = await loginUser({
      email: 'user1@example.com',
      password: 'password2'
    });

    expect(crossAuth).toBeNull();
  });
});
