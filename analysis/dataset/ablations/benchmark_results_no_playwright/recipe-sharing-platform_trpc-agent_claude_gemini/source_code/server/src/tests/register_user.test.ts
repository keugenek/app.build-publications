import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput } from '../schema';
import { registerUser } from '../handlers/register_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: RegisterUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'securepassword123'
};

describe('registerUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a new user successfully', async () => {
    const result = await registerUser(testInput);

    // Verify basic user data
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('securepassword123'); // Should be hashed
  });

  it('should save user to database with hashed password', async () => {
    const result = await registerUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    const savedUser = users[0];
    expect(savedUser.username).toEqual('testuser');
    expect(savedUser.email).toEqual('test@example.com');
    expect(savedUser.password_hash).toBeDefined();
    expect(savedUser.password_hash).not.toEqual('securepassword123'); // Password should be hashed
    expect(savedUser.created_at).toBeInstanceOf(Date);
    expect(savedUser.updated_at).toBeInstanceOf(Date);
  });

  it('should verify password is properly hashed', async () => {
    const result = await registerUser(testInput);

    // Verify password can be verified using Bun's password verification
    const isValid = await Bun.password.verify('securepassword123', result.password_hash);
    expect(isValid).toBe(true);

    // Verify incorrect password fails
    const isInvalid = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isInvalid).toBe(false);
  });

  it('should throw error if email already exists', async () => {
    // Create first user
    await registerUser(testInput);

    // Try to create another user with same email but different username
    const duplicateEmailInput: RegisterUserInput = {
      username: 'differentuser',
      email: 'test@example.com', // Same email
      password: 'anotherpassword'
    };

    await expect(registerUser(duplicateEmailInput)).rejects.toThrow(/email already exists/i);
  });

  it('should throw error if username already exists', async () => {
    // Create first user
    await registerUser(testInput);

    // Try to create another user with same username but different email
    const duplicateUsernameInput: RegisterUserInput = {
      username: 'testuser', // Same username
      email: 'different@example.com',
      password: 'anotherpassword'
    };

    await expect(registerUser(duplicateUsernameInput)).rejects.toThrow(/username already exists/i);
  });

  it('should handle multiple users with different credentials', async () => {
    // Create first user
    const user1 = await registerUser(testInput);

    // Create second user with different credentials
    const secondInput: RegisterUserInput = {
      username: 'seconduser',
      email: 'second@example.com',
      password: 'differentpassword'
    };
    const user2 = await registerUser(secondInput);

    // Verify both users exist and have different IDs
    expect(user1.id).not.toEqual(user2.id);
    expect(user1.username).toEqual('testuser');
    expect(user2.username).toEqual('seconduser');
    expect(user1.email).toEqual('test@example.com');
    expect(user2.email).toEqual('second@example.com');

    // Verify both users are saved in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });

  it('should handle special characters in username and email', async () => {
    const specialInput: RegisterUserInput = {
      username: 'user_with-special.chars',
      email: 'special+email@test-domain.co.uk',
      password: 'passwordwithspecial!@#$%'
    };

    const result = await registerUser(specialInput);

    expect(result.username).toEqual('user_with-special.chars');
    expect(result.email).toEqual('special+email@test-domain.co.uk');
    
    // Verify password hashing works with special characters
    const isValid = await Bun.password.verify('passwordwithspecial!@#$%', result.password_hash);
    expect(isValid).toBe(true);
  });

  it('should create timestamps that are close to current time', async () => {
    const beforeRegistration = new Date();
    const result = await registerUser(testInput);
    const afterRegistration = new Date();

    // Verify created_at and updated_at are within reasonable time range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeRegistration.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterRegistration.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeRegistration.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterRegistration.getTime());
  });
});
