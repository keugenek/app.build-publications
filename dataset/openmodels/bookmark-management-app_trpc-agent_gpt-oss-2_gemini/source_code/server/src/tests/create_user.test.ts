import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { users } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';

const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'securePassword123',
};

/** Helper to compute the expected SHA-256 hash */
const expectedHash = (pwd: string) =>
  createHash('sha256').update(pwd).digest('hex');

describe('createUser handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user and return proper fields', async () => {
    const result = await createUser(testInput);

    // Basic assertions on returned object
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.email).toBe(testInput.email);
    expect(result.password_hash).toBe(expectedHash(testInput.password));
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the user in the database', async () => {
    const result = await createUser(testInput);

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, testInput.email))
      .execute();

    expect(rows).toHaveLength(1);
    const persisted = rows[0];
    expect(persisted.id).toBe(result.id);
    expect(persisted.email).toBe(testInput.email);
    expect(persisted.password_hash).toBe(expectedHash(testInput.password));
    expect(persisted.created_at).toBeInstanceOf(Date);
  });

  it('should enforce unique email constraint', async () => {
    await createUser(testInput);
    // Second attempt with same email should reject
    await expect(createUser(testInput)).rejects.toThrow();
  });
});
