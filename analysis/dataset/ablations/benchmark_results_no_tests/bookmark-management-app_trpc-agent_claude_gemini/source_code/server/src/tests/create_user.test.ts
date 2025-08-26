import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123',
  display_name: 'Test User'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with valid input', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.display_name).toEqual('Test User');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123'); // Should be hashed
  });

  it('should hash the password correctly', async () => {
    const result = await createUser(testInput);

    // Password should be hashed using Bun's password hashing
    expect(result.password_hash).not.toEqual(testInput.password);
    expect(result.password_hash.length).toBeGreaterThan(20); // Hashed passwords are longer
    
    // Verify the password can be verified with Bun's verify
    const isValid = await Bun.password.verify(testInput.password, result.password_hash);
    expect(isValid).toBe(true);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database directly to verify insertion
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].display_name).toEqual('Test User');
    expect(users[0].password_hash).toEqual(result.password_hash);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should reject duplicate email addresses', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same email
    const duplicateInput: CreateUserInput = {
      email: 'test@example.com', // Same email
      password: 'different123',
      display_name: 'Different User'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/already exists/i);
  });

  it('should handle different email formats correctly', async () => {
    const emailVariations = [
      'user@domain.com',
      'user.name@domain.co.uk',
      'user+tag@example.org'
    ];

    for (const email of emailVariations) {
      const input: CreateUserInput = {
        email,
        password: 'password123',
        display_name: `User for ${email}`
      };

      const result = await createUser(input);
      expect(result.email).toEqual(email);
      expect(result.display_name).toEqual(`User for ${email}`);
    }
  });

  it('should create users with different display names', async () => {
    const users = [
      { email: 'user1@example.com', display_name: 'John Doe' },
      { email: 'user2@example.com', display_name: 'Jane Smith' },
      { email: 'user3@example.com', display_name: 'Bob Johnson' }
    ];

    for (const userData of users) {
      const input: CreateUserInput = {
        ...userData,
        password: 'password123'
      };

      const result = await createUser(input);
      expect(result.email).toEqual(userData.email);
      expect(result.display_name).toEqual(userData.display_name);
    }

    // Verify all users were created
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(3);
  });

  it('should handle special characters in display names', async () => {
    const specialNames = [
      'José María',
      '李小明',
      'Müller-Schmidt',
      "O'Connor"
    ];

    for (let i = 0; i < specialNames.length; i++) {
      const input: CreateUserInput = {
        email: `user${i}@example.com`,
        password: 'password123',
        display_name: specialNames[i]
      };

      const result = await createUser(input);
      expect(result.display_name).toEqual(specialNames[i]);
    }
  });
});
