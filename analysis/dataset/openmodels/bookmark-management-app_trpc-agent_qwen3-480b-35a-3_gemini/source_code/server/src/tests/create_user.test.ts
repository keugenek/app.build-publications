import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, createUserInputSchema } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';

// Test input
const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    // Password hash should be properly hashed, not plain text
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash).toHaveLength(64); // SHA-256 produces 64-character hex string
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
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
    
    // Verify password was properly hashed
    const expectedHash = createHash('sha256').update('password123').digest('hex');
    expect(users[0].password_hash).toEqual(expectedHash);
  });

  it('should fail with invalid email in Zod schema', () => {
    const invalidInput = {
      email: 'invalid-email',
      password: 'password123'
    };

    // Validate with Zod schema
    const result = createUserInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email');
    }
  });

  it('should fail with short password in Zod schema', () => {
    const invalidInput = {
      email: 'test@example.com',
      password: '123'
    };

    // Validate with Zod schema
    const result = createUserInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('password');
    }
  });
});
