import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Test input with all required fields
const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with hashed password', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123'); // Password should be hashed
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify password was properly hashed (contains salt and hash)
    expect(result.password_hash).toContain(':'); // Should have salt:hash format
    const [salt, hash] = result.password_hash.split(':');
    const expectedHash = crypto.pbkdf2Sync('password123', salt, 1000, 64, 'sha256').toString('hex');
    expect(hash).toEqual(expectedHash);
  });

  it('should save user to database correctly', async () => {
    const result = await createUser(testInput);

    // Query the database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].password_hash).toBeDefined();
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);

    // Verify password hash in database
    expect(users[0].password_hash).toContain(':');
    const [salt, hash] = users[0].password_hash.split(':');
    const expectedHash = crypto.pbkdf2Sync('password123', salt, 1000, 64, 'sha256').toString('hex');
    expect(hash).toEqual(expectedHash);
  });

  it('should create unique users with different usernames', async () => {
    // Create first user
    const firstUser = await createUser(testInput);

    // Create second user with different username and email
    const secondInput: CreateUserInput = {
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'password456'
    };
    const secondUser = await createUser(secondInput);

    // Verify both users are different
    expect(firstUser.id).not.toEqual(secondUser.id);
    expect(firstUser.username).toEqual('testuser');
    expect(secondUser.username).toEqual('testuser2');
    expect(firstUser.email).toEqual('test@example.com');
    expect(secondUser.email).toEqual('test2@example.com');

    // Verify different password hashes
    expect(firstUser.password_hash).not.toEqual(secondUser.password_hash);
  });

  it('should handle different password lengths correctly', async () => {
    // Test minimum length password
    const minPasswordInput: CreateUserInput = {
      username: 'minuser',
      email: 'min@example.com',
      password: '123456' // 6 characters (minimum)
    };

    const minUser = await createUser(minPasswordInput);
    expect(minUser.username).toEqual('minuser');
    
    // Verify password was hashed correctly
    expect(minUser.password_hash).toContain(':');
    const [minSalt, minHash] = minUser.password_hash.split(':');
    const expectedMinHash = crypto.pbkdf2Sync('123456', minSalt, 1000, 64, 'sha256').toString('hex');
    expect(minHash).toEqual(expectedMinHash);

    // Test longer password
    const longPasswordInput: CreateUserInput = {
      username: 'longuser',
      email: 'long@example.com',
      password: 'thisisaverylongpasswordwithmanycharacters123!'
    };

    const longUser = await createUser(longPasswordInput);
    expect(longUser.username).toEqual('longuser');
    
    // Verify long password was hashed correctly
    expect(longUser.password_hash).toContain(':');
    const [longSalt, longHash] = longUser.password_hash.split(':');
    const expectedLongHash = crypto.pbkdf2Sync('thisisaverylongpasswordwithmanycharacters123!', longSalt, 1000, 64, 'sha256').toString('hex');
    expect(longHash).toEqual(expectedLongHash);
  });

  it('should reject duplicate usernames', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create second user with same username but different email
    const duplicateUsernameInput: CreateUserInput = {
      username: 'testuser', // Same username
      email: 'different@example.com', // Different email
      password: 'password456'
    };

    // Should throw error due to unique constraint
    await expect(createUser(duplicateUsernameInput)).rejects.toThrow(/unique constraint/i);
  });

  it('should reject duplicate emails', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create second user with same email but different username
    const duplicateEmailInput: CreateUserInput = {
      username: 'differentuser', // Different username
      email: 'test@example.com', // Same email
      password: 'password456'
    };

    // Should throw error due to unique constraint
    await expect(createUser(duplicateEmailInput)).rejects.toThrow(/unique constraint/i);
  });
});
