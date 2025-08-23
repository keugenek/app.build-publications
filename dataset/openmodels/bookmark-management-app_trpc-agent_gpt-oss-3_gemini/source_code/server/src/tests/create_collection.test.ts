import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable } from '../db/schema';
import { type CreateCollectionInput } from '../schema';
import { createCollection } from '../handlers/create_collection';
import { eq } from 'drizzle-orm';

// Helper to create a user in DB directly
const createTestUser = async () => {
  const result = await db.insert(usersTable)
    .values({
      email: 'test@example.com',
      password_hash: 'hashed',
    })
    .returning()
    .execute();
  return result[0];
};

const testInput = (userId: number): CreateCollectionInput => ({
  user_id: userId,
  name: 'My Collection',
});

describe('createCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a collection for an existing user', async () => {
    const user = await createTestUser();
    const input = testInput(user.id);
    const collection = await createCollection(input);

    // Basic field checks
    expect(collection.id).toBeDefined();
    expect(collection.user_id).toEqual(user.id);
    expect(collection.name).toEqual(input.name);
    expect(collection.created_at).toBeInstanceOf(Date);

    // Verify it was saved in the DB
    const saved = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collection.id))
      .execute();

    expect(saved).toHaveLength(1);
    expect(saved[0].name).toEqual(input.name);
    expect(saved[0].user_id).toEqual(user.id);
  });

  it('should throw an error when the user does not exist', async () => {
    const nonExistentUserId = 9999;
    const input = testInput(nonExistentUserId);
    await expect(createCollection(input)).rejects.toThrow('User not found');
  });
});
