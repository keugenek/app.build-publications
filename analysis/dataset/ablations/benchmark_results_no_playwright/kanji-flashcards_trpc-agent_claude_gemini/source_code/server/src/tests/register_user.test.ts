import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput } from '../schema';
import { registerUser } from '../handlers/register_user';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Test input data
const testInput: RegisterUserInput = {
  email: 'test@example.com',
  username: 'testuser',
  password: 'securepassword123'
};

const testInput2: RegisterUserInput = {
  email: 'user2@example.com',
  username: 'testuser2',
  password: 'anotherpassword456'
};

describe('registerUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a new user successfully', async () => {
    const result = await registerUser(testInput);

    // Verify response structure
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.username).toBe('testuser');
    expect(result.user.id).toBeDefined();
    expect(typeof result.user.id).toBe('number');
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);
    expect(result.token).toBeUndefined(); // No JWT token in this implementation
  });

  it('should save user to database with hashed password', async () => {
    const result = await registerUser(testInput);

    // Query the database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user.id))
      .execute();

    expect(users).toHaveLength(1);
    const user = users[0];
    
    expect(user.email).toBe('test@example.com');
    expect(user.username).toBe('testuser');
    expect(user.password_hash).toBeDefined();
    expect(user.password_hash).not.toBe('securepassword123'); // Should be hashed
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
    
    // Verify password is properly hashed
    const [hashedPassword, salt] = user.password_hash.split(':');
    const expectedHash = crypto.pbkdf2Sync('securepassword123', salt, 10000, 64, 'sha256').toString('hex');
    expect(hashedPassword).toBe(expectedHash);
  });

  it('should throw error when email already exists', async () => {
    // Register first user
    await registerUser(testInput);

    // Try to register with same email but different username
    const duplicateEmailInput: RegisterUserInput = {
      email: 'test@example.com', // Same email
      username: 'differentuser', // Different username
      password: 'password123'
    };

    await expect(registerUser(duplicateEmailInput)).rejects.toThrow(/email already exists/i);
  });

  it('should throw error when username already exists', async () => {
    // Register first user
    await registerUser(testInput);

    // Try to register with same username but different email
    const duplicateUsernameInput: RegisterUserInput = {
      email: 'different@example.com', // Different email
      username: 'testuser', // Same username
      password: 'password123'
    };

    await expect(registerUser(duplicateUsernameInput)).rejects.toThrow(/username already exists/i);
  });

  it('should allow registration of different users', async () => {
    // Register first user
    const result1 = await registerUser(testInput);
    
    // Register second user with different email and username
    const result2 = await registerUser(testInput2);

    // Both should succeed
    expect(result1.user.id).not.toBe(result2.user.id);
    expect(result1.user.email).toBe('test@example.com');
    expect(result2.user.email).toBe('user2@example.com');
    expect(result1.user.username).toBe('testuser');
    expect(result2.user.username).toBe('testuser2');

    // Verify both users exist in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });

  it('should hash different passwords differently', async () => {
    // Register first user
    await registerUser(testInput);
    
    // Register second user
    await registerUser(testInput2);

    // Get both users from database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
    
    const user1 = allUsers.find(u => u.username === 'testuser');
    const user2 = allUsers.find(u => u.username === 'testuser2');
    
    expect(user1?.password_hash).toBeDefined();
    expect(user2?.password_hash).toBeDefined();
    expect(user1?.password_hash).not.toBe(user2?.password_hash); // Different passwords should hash differently
    
    // Verify both passwords work correctly
    const [hashedPassword1, salt1] = user1!.password_hash.split(':');
    const [hashedPassword2, salt2] = user2!.password_hash.split(':');
    
    const expectedHash1 = crypto.pbkdf2Sync('securepassword123', salt1, 10000, 64, 'sha256').toString('hex');
    const expectedHash2 = crypto.pbkdf2Sync('anotherpassword456', salt2, 10000, 64, 'sha256').toString('hex');
    
    expect(hashedPassword1).toBe(expectedHash1);
    expect(hashedPassword2).toBe(expectedHash2);
  });

  it('should create timestamps correctly', async () => {
    const beforeRegistration = new Date();
    const result = await registerUser(testInput);
    const afterRegistration = new Date();

    // Check that created_at and updated_at are within reasonable bounds
    expect(result.user.created_at.getTime()).toBeGreaterThanOrEqual(beforeRegistration.getTime() - 1000);
    expect(result.user.created_at.getTime()).toBeLessThanOrEqual(afterRegistration.getTime() + 1000);
    expect(result.user.updated_at.getTime()).toBeGreaterThanOrEqual(beforeRegistration.getTime() - 1000);
    expect(result.user.updated_at.getTime()).toBeLessThanOrEqual(afterRegistration.getTime() + 1000);
  });
});
