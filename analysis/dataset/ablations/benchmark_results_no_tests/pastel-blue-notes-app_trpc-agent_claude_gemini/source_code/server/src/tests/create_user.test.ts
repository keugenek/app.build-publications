import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq, or } from 'drizzle-orm';
import { createHash } from 'crypto';

// Helper function to verify password hash
const verifyPassword = (password: string, hash: string): boolean => {
  const [hashedPassword, salt] = hash.split(':');
  const testHash = createHash('sha256').update(password + salt).digest('hex');
  return testHash === hashedPassword;
};

// Test input data
const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'securepassword123'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with hashed password', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Password should be hashed, not plain text
    expect(result.password_hash).not.toEqual('securepassword123');
    expect(result.password_hash.length).toBeGreaterThan(50);
    
    // Verify password hash is valid
    const isValidHash = verifyPassword('securepassword123', result.password_hash);
    expect(isValidHash).toBe(true);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);

    // Verify password was hashed properly in database
    const isValidHash = verifyPassword('securepassword123', users[0].password_hash);
    expect(isValidHash).toBe(true);
  });

  it('should throw error when username already exists', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same username
    const duplicateUsernameInput: CreateUserInput = {
      username: 'testuser', // Same username
      email: 'different@example.com',
      password: 'differentpassword'
    };

    await expect(createUser(duplicateUsernameInput))
      .rejects.toThrow(/username already exists/i);
  });

  it('should throw error when email already exists', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same email
    const duplicateEmailInput: CreateUserInput = {
      username: 'differentuser',
      email: 'test@example.com', // Same email
      password: 'differentpassword'
    };

    await expect(createUser(duplicateEmailInput))
      .rejects.toThrow(/email already exists/i);
  });

  it('should handle multiple users with different credentials', async () => {
    const user1Input: CreateUserInput = {
      username: 'user1',
      email: 'user1@example.com',
      password: 'password1'
    };

    const user2Input: CreateUserInput = {
      username: 'user2',
      email: 'user2@example.com',
      password: 'password2'
    };

    // Create both users
    const result1 = await createUser(user1Input);
    const result2 = await createUser(user2Input);

    // Both should be created successfully with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.username).toEqual('user1');
    expect(result2.username).toEqual('user2');
    expect(result1.email).toEqual('user1@example.com');
    expect(result2.email).toEqual('user2@example.com');

    // Verify both exist in database
    const allUsers = await db.select()
      .from(usersTable)
      .execute();

    expect(allUsers).toHaveLength(2);
    
    const usernames = allUsers.map(u => u.username).sort();
    expect(usernames).toEqual(['user1', 'user2']);
  });

  it('should validate password hashing with different passwords', async () => {
    const user1Input: CreateUserInput = {
      username: 'user1',
      email: 'user1@example.com',
      password: 'shortpwd'
    };

    const user2Input: CreateUserInput = {
      username: 'user2',
      email: 'user2@example.com',
      password: 'verylongandcomplexpasswordwithspecialcharacters!@#'
    };

    const result1 = await createUser(user1Input);
    const result2 = await createUser(user2Input);

    // Both passwords should be hashed differently
    expect(result1.password_hash).not.toEqual(result2.password_hash);
    
    // Verify each password hash matches its original
    const isValid1 = verifyPassword('shortpwd', result1.password_hash);
    const isValid2 = verifyPassword('verylongandcomplexpasswordwithspecialcharacters!@#', result2.password_hash);
    
    expect(isValid1).toBe(true);
    expect(isValid2).toBe(true);
    
    // Cross-verify passwords don't match wrong hashes
    const isCrossValid1 = verifyPassword('shortpwd', result2.password_hash);
    const isCrossValid2 = verifyPassword('verylongandcomplexpasswordwithspecialcharacters!@#', result1.password_hash);
    
    expect(isCrossValid1).toBe(false);
    expect(isCrossValid2).toBe(false);
  });
});
