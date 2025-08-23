import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable } from '../db/schema';
import { type CreateFolderInput } from '../schema';
import { createFolder } from '../handlers/create_folder';
import { eq } from 'drizzle-orm';

// Helper to create a user for foreign key reference
const createTestUser = async () => {
  const result = await db
    .insert(usersTable)
    .values({
      email: 'testuser@example.com',
      password_hash: 'hashed',
    })
    .returning()
    .execute();
  return result[0];
};

const testInput: CreateFolderInput = {
  name: 'Test Folder',
  user_id: 0, // placeholder, will be replaced with real user id in tests
};

describe('createFolder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a folder and return correct fields', async () => {
    const user = await createTestUser();
    const input: CreateFolderInput = { ...testInput, user_id: user.id };

    const result = await createFolder(input);

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Test Folder');
    expect(result.user_id).toBe(user.id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the folder in the database', async () => {
    const user = await createTestUser();
    const input: CreateFolderInput = { ...testInput, user_id: user.id };

    const created = await createFolder(input);

    const rows = await db
      .select()
      .from(foldersTable)
      .where(eq(foldersTable.id, created.id))
      .execute();

    expect(rows).toHaveLength(1);
    const dbFolder = rows[0];
    expect(dbFolder.name).toBe('Test Folder');
    expect(dbFolder.user_id).toBe(user.id);
    expect(dbFolder.created_at).toBeInstanceOf(Date);
  });
});
