import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for duplicate username', async () => {
    // Create first user
    await createUser(testInput);

    // Attempt to create user with same username but different email
    const duplicateUsernameInput: CreateUserInput = {
      username: 'testuser', // Same username
      email: 'different@example.com' // Different email
    };

    await expect(createUser(duplicateUsernameInput))
      .rejects
      .toThrow(/duplicate key value violates unique constraint.*username/i);
  });

  it('should throw error for duplicate email', async () => {
    // Create first user
    await createUser(testInput);

    // Attempt to create user with same email but different username
    const duplicateEmailInput: CreateUserInput = {
      username: 'differentuser', // Different username
      email: 'test@example.com' // Same email
    };

    await expect(createUser(duplicateEmailInput))
      .rejects
      .toThrow(/duplicate key value violates unique constraint.*email/i);
  });

  it('should create multiple users with unique credentials', async () => {
    const user1 = await createUser({
      username: 'user1',
      email: 'user1@example.com'
    });

    const user2 = await createUser({
      username: 'user2',
      email: 'user2@example.com'
    });

    // Verify both users were created
    expect(user1.id).not.toEqual(user2.id);
    expect(user1.username).toEqual('user1');
    expect(user2.username).toEqual('user2');
    expect(user1.email).toEqual('user1@example.com');
    expect(user2.email).toEqual('user2@example.com');

    // Verify both users exist in database
    const users = await db.select()
      .from(usersTable)
      .execute();

    expect(users).toHaveLength(2);
    
    const usernames = users.map(u => u.username).sort();
    expect(usernames).toEqual(['user1', 'user2']);
  });

  it('should set created_at timestamp automatically', async () => {
    const beforeCreate = new Date();
    
    const result = await createUser(testInput);
    
    const afterCreate = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at >= beforeCreate).toBe(true);
    expect(result.created_at <= afterCreate).toBe(true);
  });
});
