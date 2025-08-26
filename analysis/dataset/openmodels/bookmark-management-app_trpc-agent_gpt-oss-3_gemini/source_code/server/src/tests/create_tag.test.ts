import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tagsTable } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { createTag } from '../handlers/create_tag';
import { eq } from 'drizzle-orm';

let testInput: CreateTagInput;

describe('createTag', () => {
  // Setup a fresh DB and a user for each test
  beforeEach(async () => {
    await createDB();
    // Insert a user to satisfy the foreign key constraint
    const insertedUser = await db
      .insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed',
      })
      .returning()
      .execute();

    // Build the tag input using the created user's id
    testInput = {
      user_id: insertedUser[0].id,
      name: 'Test Tag',
    };
  });

  afterEach(resetDB);

  it('should create a tag and return it', async () => {
    const result = await createTag(testInput);
    expect(result.id).toBeDefined();
    expect(result.user_id).toBe(testInput.user_id);
    expect(result.name).toBe(testInput.name);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the tag in the database', async () => {
    const result = await createTag(testInput);
    const rows = await db
      .select()
      .from(tagsTable)
      .where(eq(tagsTable.id, result.id))
      .execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.user_id).toBe(testInput.user_id);
    expect(row.name).toBe(testInput.name);
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
