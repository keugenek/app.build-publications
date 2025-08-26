import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable } from '../db/schema';
import { type Folder, type CreateUserInput } from '../schema';
import { getFolders } from '../handlers/get_folders';
import { eq } from 'drizzle-orm';

// Helper to create a user
const createTestUser = async () => {
  const input: CreateUserInput = {
    email: 'test@example.com',
    password: 'password123', // plain password, will be stored as hash in test
  };
  const user = await db
    .insert(usersTable)
    .values({
      email: input.email,
      password_hash: input.password, // In real code this would be hashed; for test we store plain
    })
    .returning()
    .execute();
  return user[0];
};

describe('getFolders handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no folders exist', async () => {
    const result = await getFolders();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should fetch all folders for existing users', async () => {
    const user = await createTestUser();
    // Insert two folders for the user
    const folderInputs = [
      { name: 'Folder One', user_id: user.id },
      { name: 'Folder Two', user_id: user.id },
    ];
    await db.insert(foldersTable).values(folderInputs).execute();

    const folders = await getFolders();
    // Ensure we got both folders back
    expect(folders).toHaveLength(2);
    const names = folders.map((f) => f.name).sort();
    expect(names).toEqual(['Folder One', 'Folder Two']);
    // Verify each folder has required fields and correct types
    folders.forEach((folder) => {
      expect(typeof folder.id).toBe('number');
      expect(typeof folder.name).toBe('string');
      expect(typeof folder.user_id).toBe('number');
      expect(folder.created_at).toBeInstanceOf(Date);
    });
  });

  it('should correctly associate folders with the right user_id', async () => {
    const userA = await createTestUser();
    // Create a second user directly via raw insert for simplicity
    const userB = await db
      .insert(usersTable)
      .values({ email: 'second@example.com', password_hash: 'pw' })
      .returning()
      .execute();
    const userBRow = userB[0];

    // Insert folders for each user
    await db.insert(foldersTable).values([
      { name: 'A Folder', user_id: userA.id },
      { name: 'B Folder', user_id: userBRow.id },
    ]).execute();

    const allFolders = await getFolders();
    // There should be two folders total
    expect(allFolders).toHaveLength(2);
    // Find each by name and verify user_id
    const aFolder = allFolders.find((f) => f.name === 'A Folder');
    const bFolder = allFolders.find((f) => f.name === 'B Folder');
    expect(aFolder?.user_id).toBe(userA.id);
    expect(bFolder?.user_id).toBe(userBRow.id);
  });
});
