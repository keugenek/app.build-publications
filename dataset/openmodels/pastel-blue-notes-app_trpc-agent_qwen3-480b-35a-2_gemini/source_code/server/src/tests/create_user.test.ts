import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';

// Test input
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
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Password should be hashed
    expect(result.password_hash).not.toEqual('password123');
  });

  it('should save user to database with proper password hashing', async () => {
    const result = await createUser(testInput);

    // Query the user from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].password_hash).not.toEqual('password123');
    
    // Verify that password is properly hashed
    const isMatch = await compare('password123', users[0].password_hash);
    expect(isMatch).toBe(true);
  });

  it('should throw an error when creating a user with duplicate email', async () => {
    // Create first user
    await createUser(testInput);
    
    // Try to create another user with the same email
    await expect(createUser(testInput)).rejects.toThrow(/duplicate key value violates unique constraint/);
  });
});
