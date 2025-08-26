import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';
import { createHash } from 'crypto';

// Simple hash function matching the one in the handler
function hashPassword(password: string, salt: string = 'defaultsalt'): string {
  return createHash('sha256').update(password + salt).digest('hex');
}

// Test user data
const testUserData = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

// Test input
const testLoginInput: LoginInput = {
  username: 'testuser',
  password: 'password123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login user with correct credentials', async () => {
    // Create test user first
    const hashedPassword = hashPassword(testUserData.password);
    
    const [createdUser] = await db.insert(usersTable)
      .values({
        username: testUserData.username,
        email: testUserData.email,
        password_hash: hashedPassword
      })
      .returning()
      .execute();

    const result = await loginUser(testLoginInput);

    // Should return user object
    expect(result).not.toBeNull();
    expect(result!.username).toEqual('testuser');
    expect(result!.email).toEqual('test@example.com');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.password_hash).toEqual(hashedPassword);
  });

  it('should return null for non-existent user', async () => {
    const result = await loginUser({
      username: 'nonexistent',
      password: 'anypassword'
    });

    expect(result).toBeNull();
  });

  it('should return null for incorrect password', async () => {
    // Create test user first
    const hashedPassword = hashPassword(testUserData.password);
    
    await db.insert(usersTable)
      .values({
        username: testUserData.username,
        email: testUserData.email,
        password_hash: hashedPassword
      })
      .execute();

    const result = await loginUser({
      username: 'testuser',
      password: 'wrongpassword'
    });

    expect(result).toBeNull();
  });

  it('should handle case-sensitive username', async () => {
    // Create test user first
    const hashedPassword = hashPassword(testUserData.password);
    
    await db.insert(usersTable)
      .values({
        username: 'TestUser',  // Different case
        email: testUserData.email,
        password_hash: hashedPassword
      })
      .execute();

    const result = await loginUser({
      username: 'testuser',  // lowercase
      password: 'password123'
    });

    // Should return null since username is case-sensitive
    expect(result).toBeNull();
  });

  it('should verify against actual hash', async () => {
    // Create test user with actual hash
    const plainPassword = 'secretpassword123';
    const hashedPassword = hashPassword(plainPassword);
    
    await db.insert(usersTable)
      .values({
        username: 'hashtest',
        email: 'hash@example.com',
        password_hash: hashedPassword
      })
      .execute();

    const result = await loginUser({
      username: 'hashtest',
      password: plainPassword
    });

    expect(result).not.toBeNull();
    expect(result!.username).toEqual('hashtest');
    expect(result!.email).toEqual('hash@example.com');
  });

  it('should return all user fields on successful login', async () => {
    // Create test user
    const hashedPassword = hashPassword('testpass');
    
    const [createdUser] = await db.insert(usersTable)
      .values({
        username: 'fieldtest',
        email: 'fields@example.com',
        password_hash: hashedPassword
      })
      .returning()
      .execute();

    const result = await loginUser({
      username: 'fieldtest',
      password: 'testpass'
    });

    // Verify all expected fields are present
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.username).toEqual('fieldtest');
    expect(result!.email).toEqual('fields@example.com');
    expect(result!.password_hash).toEqual(hashedPassword);
    expect(result!.created_at).toEqual(createdUser.created_at);
    expect(result!.updated_at).toEqual(createdUser.updated_at);
  });

  it('should handle empty username gracefully', async () => {
    const result = await loginUser({
      username: '',
      password: 'anypassword'
    });

    expect(result).toBeNull();
  });

  it('should handle empty password gracefully', async () => {
    // Create test user first
    const hashedPassword = hashPassword('actualpassword');
    
    await db.insert(usersTable)
      .values({
        username: 'emptytest',
        email: 'empty@example.com',
        password_hash: hashedPassword
      })
      .execute();

    const result = await loginUser({
      username: 'emptytest',
      password: ''
    });

    expect(result).toBeNull();
  });
});
