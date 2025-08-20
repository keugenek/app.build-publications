import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateUserInput = {
  email: 'test@example.com',
  username: 'testuser'
};

const alternateInput: CreateUserInput = {
  email: 'another@example.com',
  username: 'anotheruser'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with valid input', async () => {
    const result = await createUser(testInput);

    // Validate returned user object
    expect(result.email).toEqual('test@example.com');
    expect(result.username).toEqual('testuser');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].username).toEqual('testuser');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple users with different credentials', async () => {
    const user1 = await createUser(testInput);
    const user2 = await createUser(alternateInput);

    expect(user1.id).not.toEqual(user2.id);
    expect(user1.email).toEqual('test@example.com');
    expect(user2.email).toEqual('another@example.com');
    expect(user1.username).toEqual('testuser');
    expect(user2.username).toEqual('anotheruser');

    // Verify both users exist in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });

  it('should reject duplicate email', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same email but different username
    const duplicateEmailInput: CreateUserInput = {
      email: 'test@example.com', // Same email
      username: 'differentuser' // Different username
    };

    await expect(createUser(duplicateEmailInput))
      .rejects.toThrow(/email already exists/i);
  });

  it('should reject duplicate username', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same username but different email
    const duplicateUsernameInput: CreateUserInput = {
      email: 'different@example.com', // Different email
      username: 'testuser' // Same username
    };

    await expect(createUser(duplicateUsernameInput))
      .rejects.toThrow(/username already exists/i);
  });

  it('should reject when both email and username are duplicates', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create exact duplicate
    await expect(createUser(testInput))
      .rejects.toThrow(/email already exists/i);
  });

  it('should handle email case sensitivity correctly', async () => {
    // Create user with lowercase email
    await createUser(testInput);

    // Try to create user with uppercase version of same email
    const uppercaseEmailInput: CreateUserInput = {
      email: 'TEST@EXAMPLE.COM',
      username: 'differentuser'
    };

    // This should work since PostgreSQL is case-sensitive for strings by default
    const result = await createUser(uppercaseEmailInput);
    expect(result.email).toEqual('TEST@EXAMPLE.COM');
    expect(result.username).toEqual('differentuser');
  });

  it('should auto-generate timestamps', async () => {
    const beforeCreation = new Date();
    const result = await createUser(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});
