import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createDB, resetDB } from '../helpers';
import { deleteUser } from '../handlers/delete_user';
import type { DeleteByIdInput, User } from '../schema';

describe('deleteUser handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing user and return the deleted record', async () => {
    // Insert a user directly
    const insertResult = await db
      .insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed',
      })
      .returning()
      .execute();

    const insertedUser = insertResult[0];
    const input: DeleteByIdInput = { id: insertedUser.id };

    const deleted = await deleteUser(input);

    // Verify returned user matches inserted
    expect(deleted.id).toBe(insertedUser.id);
    expect(deleted.email).toBe('test@example.com');
    expect(deleted.password_hash).toBe('hashed');
    expect(deleted.created_at).toBeInstanceOf(Date);

    // Ensure user no longer exists in DB
    const remaining = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, insertedUser.id))
      .execute();
    expect(remaining).toHaveLength(0);
  });

  it('should throw an error when user does not exist', async () => {
    const input: DeleteByIdInput = { id: 9999 };
    await expect(deleteUser(input)).rejects.toThrow('User not found');
  });
});
