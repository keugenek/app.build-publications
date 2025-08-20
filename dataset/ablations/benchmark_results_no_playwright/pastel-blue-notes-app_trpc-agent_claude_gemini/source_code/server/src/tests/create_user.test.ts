import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with hashed password', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123'); // Should be hashed
    expect(result.password_hash.length).toBeGreaterThan(20); // Bcrypt hashes are long
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].password_hash).toEqual(result.password_hash);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should verify password can be checked against hash', async () => {
    const result = await createUser(testInput);

    // Verify the password hash works with Bun's password verification
    const isValid = await Bun.password.verify('password123', result.password_hash);
    expect(isValid).toBe(true);

    const isInvalid = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isInvalid).toBe(false);
  });

  it('should reject duplicate email addresses', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create second user with same email
    const duplicateInput: CreateUserInput = {
      email: 'test@example.com',
      password: 'differentpassword'
    };

    expect(createUser(duplicateInput)).rejects.toThrow(/already exists/i);
  });

  it('should handle different email formats correctly', async () => {
    const emailVariations = [
      'user.name@domain.com',
      'user+tag@domain.co.uk',
      'test123@sub.domain.org'
    ];

    for (const email of emailVariations) {
      const input: CreateUserInput = {
        email: email,
        password: 'password123'
      };
      
      const result = await createUser(input);
      expect(result.email).toEqual(email);
    }

    // Verify all users were created
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(emailVariations.length);
  });

  it('should create users with different passwords independently', async () => {
    const user1Input: CreateUserInput = {
      email: 'user1@example.com',
      password: 'password123'
    };

    const user2Input: CreateUserInput = {
      email: 'user2@example.com', 
      password: 'differentpassword456'
    };

    const user1 = await createUser(user1Input);
    const user2 = await createUser(user2Input);

    // Passwords should be hashed differently
    expect(user1.password_hash).not.toEqual(user2.password_hash);

    // Both should verify correctly
    expect(await Bun.password.verify('password123', user1.password_hash)).toBe(true);
    expect(await Bun.password.verify('differentpassword456', user2.password_hash)).toBe(true);

    // Cross-verification should fail
    expect(await Bun.password.verify('password123', user2.password_hash)).toBe(false);
    expect(await Bun.password.verify('differentpassword456', user1.password_hash)).toBe(false);
  });

  it('should handle case-sensitive email addresses', async () => {
    const user1 = await createUser({
      email: 'Test@Example.Com',
      password: 'password123'
    });

    // Different case should be treated as different email
    const user2 = await createUser({
      email: 'test@example.com',
      password: 'password456'
    });

    expect(user1.email).toEqual('Test@Example.Com');
    expect(user2.email).toEqual('test@example.com');
    expect(user1.id).not.toEqual(user2.id);
  });
});
