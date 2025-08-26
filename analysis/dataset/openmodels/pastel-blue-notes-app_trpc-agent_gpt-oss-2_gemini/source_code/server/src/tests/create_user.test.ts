import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'secure123',
};

describe('createUser handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert a user and return the created record', async () => {
    const result = await createUser(testInput);

    // Validate returned fields
    expect(result.id).toBeGreaterThan(0);
    expect(result.email).toBe(testInput.email);
    expect(result.password_hash).toBe(testInput.password);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify persisted in DB
    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, testInput.email))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.id).toBe(result.id);
    expect(row.email).toBe(testInput.email);
    expect(row.password_hash).toBe(testInput.password);
    expect(row.created_at).toBeInstanceOf(Date);
  });

  it('should enforce unique email constraint', async () => {
    await createUser(testInput);
    // Second insertion with same email should throw
    await expect(createUser(testInput)).rejects.toThrow();
  });
});
