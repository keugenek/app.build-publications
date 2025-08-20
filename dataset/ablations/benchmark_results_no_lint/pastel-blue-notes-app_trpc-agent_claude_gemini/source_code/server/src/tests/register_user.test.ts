import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput } from '../schema';
import { registerUser } from '../handlers/register_user';
import { eq } from 'drizzle-orm';

// Test input
const testInput: RegisterUserInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('registerUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a new user', async () => {
    const result = await registerUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123'); // Should be hashed
    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await registerUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].password_hash).toBeDefined();
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should hash the password correctly', async () => {
    const result = await registerUser(testInput);

    // Password should be hashed, not plain text
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash.length).toBeGreaterThan(20); // Hashed passwords are longer

    // Verify password can be verified with Bun's password verification
    const isValid = await Bun.password.verify('password123', result.password_hash);
    expect(isValid).toBe(true);

    // Verify wrong password fails
    const isInvalid = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isInvalid).toBe(false);
  });

  it('should throw error if email already exists', async () => {
    // Register first user
    await registerUser(testInput);

    // Try to register user with same email
    const duplicateInput: RegisterUserInput = {
      email: 'test@example.com',
      password: 'differentpassword'
    };

    await expect(registerUser(duplicateInput)).rejects.toThrow(/email already exists/i);
  });

  it('should handle different email formats', async () => {
    const inputs = [
      { email: 'user@domain.com', password: 'password123' },
      { email: 'user.name@domain.co.uk', password: 'password123' },
      { email: 'user+tag@domain.org', password: 'password123' }
    ];

    for (const input of inputs) {
      const result = await registerUser(input);
      expect(result.email).toEqual(input.email);
      expect(result.id).toBeGreaterThan(0);
    }

    // Verify all users were saved
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(3);
  });

  it('should maintain case sensitivity for emails', async () => {
    const input1: RegisterUserInput = {
      email: 'Test@Example.com',
      password: 'password123'
    };

    const input2: RegisterUserInput = {
      email: 'test@example.com',
      password: 'password123'
    };

    // Register first user
    const result1 = await registerUser(input1);
    expect(result1.email).toEqual('Test@Example.com');

    // Register second user with different case - should succeed
    const result2 = await registerUser(input2);
    expect(result2.email).toEqual('test@example.com');

    // Both should be different users
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should set created_at and updated_at timestamps', async () => {
    const beforeRegistration = new Date();
    const result = await registerUser(testInput);
    const afterRegistration = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at >= beforeRegistration).toBe(true);
    expect(result.created_at <= afterRegistration).toBe(true);
    expect(result.updated_at >= beforeRegistration).toBe(true);
    expect(result.updated_at <= afterRegistration).toBe(true);
  });
});
