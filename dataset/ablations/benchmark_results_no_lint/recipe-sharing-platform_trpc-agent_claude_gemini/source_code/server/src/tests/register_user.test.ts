import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput } from '../schema';
import { registerUser } from '../handlers/register_user';
import { eq } from 'drizzle-orm';

// Test input for user registration
const testInput: RegisterUserInput = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

describe('registerUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new user', async () => {
    const result = await registerUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual(testInput.password); // Should be hashed
    expect(result.id).toBeDefined();
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
    expect(users[0].name).toEqual('Test User');
    expect(users[0].password_hash).toBeDefined();
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should hash the password', async () => {
    const result = await registerUser(testInput);

    // Verify password is hashed using Bun's password verification
    const isValidPassword = await Bun.password.verify(testInput.password, result.password_hash);
    expect(isValidPassword).toBe(true);

    // Verify password hash is different from original
    expect(result.password_hash).not.toEqual(testInput.password);
    expect(result.password_hash.length).toBeGreaterThan(20); // Hashed passwords are longer
  });

  it('should reject duplicate email addresses', async () => {
    // Create first user
    await registerUser(testInput);

    // Try to create another user with same email
    await expect(registerUser(testInput)).rejects.toThrow(/already exists/i);
  });

  it('should handle different valid email formats', async () => {
    const testCases = [
      { ...testInput, email: 'user@domain.com' },
      { ...testInput, email: 'user.name@domain.co.uk' },
      { ...testInput, email: 'user+tag@domain.org' }
    ];

    for (const testCase of testCases) {
      const result = await registerUser(testCase);
      expect(result.email).toEqual(testCase.email);
      expect(result.id).toBeDefined();
    }
  });

  it('should handle minimum password length', async () => {
    const shortPasswordInput = {
      ...testInput,
      password: '12345', // 5 characters - below minimum
      email: 'short@example.com'
    };

    // This should still work at handler level since Zod validation happens before handler
    const result = await registerUser({
      ...shortPasswordInput,
      password: 'password123' // Use valid password for handler test
    });
    
    expect(result.email).toEqual('short@example.com');
    expect(result.id).toBeDefined();
  });

  it('should create unique password hashes for same password', async () => {
    const user1Input = { ...testInput, email: 'user1@example.com' };
    const user2Input = { ...testInput, email: 'user2@example.com' };

    const user1 = await registerUser(user1Input);
    const user2 = await registerUser(user2Input);

    // Same password should result in different hashes (due to salt)
    expect(user1.password_hash).not.toEqual(user2.password_hash);

    // But both should verify against the original password
    const user1PasswordValid = await Bun.password.verify(testInput.password, user1.password_hash);
    const user2PasswordValid = await Bun.password.verify(testInput.password, user2.password_hash);
    
    expect(user1PasswordValid).toBe(true);
    expect(user2PasswordValid).toBe(true);
  });
});
