import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com'
};

const alternateInput: CreateUserInput = {
  username: 'anotheruser',
  email: 'another@example.com'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user successfully', async () => {
    const result = await createUser(testInput);

    // Verify returned user object
    expect(result.username).toEqual(testInput.username);
    expect(result.email).toEqual(testInput.email);
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
    expect(users[0].username).toEqual(testInput.username);
    expect(users[0].email).toEqual(testInput.email);
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should reject duplicate username', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same username but different email
    const duplicateUsernameInput: CreateUserInput = {
      username: testInput.username, // Same username
      email: 'different@example.com' // Different email
    };

    await expect(createUser(duplicateUsernameInput))
      .rejects.toThrow(/username.*already taken/i);
  });

  it('should reject duplicate email', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same email but different username
    const duplicateEmailInput: CreateUserInput = {
      username: 'differentuser', // Different username
      email: testInput.email // Same email
    };

    await expect(createUser(duplicateEmailInput))
      .rejects.toThrow(/email.*already registered/i);
  });

  it('should allow multiple users with unique credentials', async () => {
    // Create first user
    const user1 = await createUser(testInput);
    
    // Create second user with different credentials
    const user2 = await createUser(alternateInput);

    // Verify both users exist
    expect(user1.id).not.toEqual(user2.id);
    expect(user1.username).toEqual(testInput.username);
    expect(user2.username).toEqual(alternateInput.username);
    expect(user1.email).toEqual(testInput.email);
    expect(user2.email).toEqual(alternateInput.email);

    // Verify both are in database
    const allUsers = await db.select()
      .from(usersTable)
      .execute();

    expect(allUsers).toHaveLength(2);
    
    const usernames = allUsers.map(u => u.username).sort();
    const emails = allUsers.map(u => u.email).sort();
    
    expect(usernames).toEqual([alternateInput.username, testInput.username]);
    expect(emails).toEqual([alternateInput.email, testInput.email]);
  });

  it('should handle edge case usernames and emails', async () => {
    const edgeCaseInput: CreateUserInput = {
      username: 'a'.repeat(50), // Maximum length username
      email: 'test+special.chars@sub-domain.example.co.uk'
    };

    const result = await createUser(edgeCaseInput);

    expect(result.username).toEqual(edgeCaseInput.username);
    expect(result.email).toEqual(edgeCaseInput.email);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual(edgeCaseInput.username);
    expect(users[0].email).toEqual(edgeCaseInput.email);
  });
});
