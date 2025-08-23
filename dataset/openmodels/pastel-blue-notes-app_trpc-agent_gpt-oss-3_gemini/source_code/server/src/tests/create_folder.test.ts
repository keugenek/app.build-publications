import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable } from '../db/schema';
import { type CreateFolderInput, type Folder } from '../schema';
import { createFolder } from '../handlers/create_folder';
import { eq } from 'drizzle-orm';

// Helper to create a user for tests
const createTestUser = async () => {
  const [user] = await db
    .insert(usersTable)
    .values({
      email: 'test@example.com',
      password_hash: 'hashed', // password hashing is out of scope for this test
    })
    .returning()
    .execute();
  return user;
};

const testInput: CreateFolderInput = {
  name: 'My Test Folder',
};

describe('createFolder handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a folder for an existing user', async () => {
    await createTestUser();
    const folder = await createFolder(testInput);

    // Verify returned folder shape
    expect(folder.id).toBeDefined();
    expect(folder.user_id).toBeDefined();
    expect(folder.name).toBe(testInput.name);
    expect(folder.created_at).toBeInstanceOf(Date);

    // Verify persisted in DB
    const dbFolder = await db
      .select()
      .from(foldersTable)
      .where(eq(foldersTable.id, folder.id))
      .execute();

    expect(dbFolder).toHaveLength(1);
    const persisted = dbFolder[0];
    expect(persisted.name).toBe(testInput.name);
    expect(persisted.user_id).toBe(folder.user_id);
    expect(persisted.created_at).toBeInstanceOf(Date);
  });

  it('should throw an error when no user exists', async () => {
    // No user is created in this test case
    await expect(createFolder(testInput)).rejects.toThrow(/No user found/);
  });
});
