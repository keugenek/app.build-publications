import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper to create a user directly in DB for test setup
const createTestUser = async () => {
  const [user] = await db
    .insert(usersTable)
    .values({
      email: 'original@example.com',
      password_hash: 'original-hash',
    })
    .returning()
    .execute();
  return user;
};

describe('updateUser handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates email only', async () => {
    const original = await createTestUser();

    const input: UpdateUserInput = {
      id: original.id,
      email: 'new@example.com',
    };

    const result: User = await updateUser(input);

    expect(result.id).toBe(original.id);
    expect(result.email).toBe('new@example.com');
    // password_hash should remain unchanged
    expect(result.password_hash).toBe('original-hash');
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify DB state
    const [dbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, original.id))
      .execute();
    expect(dbUser.email).toBe('new@example.com');
    expect(dbUser.password_hash).toBe('original-hash');
  });

  it('updates password only', async () => {
    const original = await createTestUser();

    const input: UpdateUserInput = {
      id: original.id,
      password: 'newpass123',
    };

    const result: User = await updateUser(input);

    expect(result.id).toBe(original.id);
    expect(result.email).toBe('original@example.com');
    expect(result.password_hash).toBe('hashed-newpass123');
    expect(result.created_at).toBeInstanceOf(Date);

    const [dbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, original.id))
      .execute();
    expect(dbUser.password_hash).toBe('hashed-newpass123');
  });

  it('updates both email and password', async () => {
    const original = await createTestUser();

    const input: UpdateUserInput = {
      id: original.id,
      email: 'both@example.com',
      password: 'bothpass',
    };

    const result: User = await updateUser(input);

    expect(result.email).toBe('both@example.com');
    expect(result.password_hash).toBe('hashed-bothpass');

    const [dbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, original.id))
      .execute();
    expect(dbUser.email).toBe('both@example.com');
    expect(dbUser.password_hash).toBe('hashed-bothpass');
  });
});
