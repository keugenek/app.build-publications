import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';
import { pbkdf2Sync } from 'crypto';

// Test input
const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'testpassword123'
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
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('testpassword123'); // Should be hashed
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
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should hash password properly', async () => {
    const result = await createUser(testInput);

    // Extract salt and hash from stored password
    const [salt, storedHash] = result.password_hash.split(':');
    
    // Verify the password was hashed correctly by comparing
    const testHash = pbkdf2Sync('testpassword123', salt, 10000, 64, 'sha256').toString('hex');
    expect(testHash).toEqual(storedHash);

    // Verify wrong password doesn't match
    const wrongHash = pbkdf2Sync('wrongpassword', salt, 10000, 64, 'sha256').toString('hex');
    expect(wrongHash).not.toEqual(storedHash);
  });

  it('should enforce unique username constraint', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same username but different email
    const duplicateUsernameInput: CreateUserInput = {
      username: 'testuser', // Same username
      email: 'different@example.com',
      password: 'differentpassword123'
    };

    // Should throw error due to unique constraint
    await expect(createUser(duplicateUsernameInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should enforce unique email constraint', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same email but different username
    const duplicateEmailInput: CreateUserInput = {
      username: 'differentuser',
      email: 'test@example.com', // Same email
      password: 'differentpassword123'
    };

    // Should throw error due to unique constraint
    await expect(createUser(duplicateEmailInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should create users with different credentials successfully', async () => {
    // Create first user
    const firstUser = await createUser(testInput);

    // Create second user with different credentials
    const secondInput: CreateUserInput = {
      username: 'seconduser',
      email: 'second@example.com',
      password: 'secondpassword123'
    };

    const secondUser = await createUser(secondInput);

    // Both should be created successfully
    expect(firstUser.id).not.toEqual(secondUser.id);
    expect(firstUser.username).toEqual('testuser');
    expect(secondUser.username).toEqual('seconduser');
    expect(firstUser.email).toEqual('test@example.com');
    expect(secondUser.email).toEqual('second@example.com');

    // Verify both users exist in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });
});
