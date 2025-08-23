import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { db } from '../db';
import { usersTable, foldersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createDB, resetDB } from '../helpers';
import { type CreateUserInput, type CreateFolderInput, type UpdateFolderInput } from '../schema';
import { updateFolder } from '../handlers/update_folder';

// Helper to create a user
const createUser = async (email: string, passwordHash: string) => {
  const [user] = await db
    .insert(usersTable)
    .values({ email, password_hash: passwordHash })
    .returning()
    .execute();
  return user;
};

// Helper to create a folder for a user
const createFolder = async (name: string, userId: number) => {
  const [folder] = await db
    .insert(foldersTable)
    .values({ name, user_id: userId })
    .returning()
    .execute();
  return folder;
};

describe('updateFolder handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates folder name when provided', async () => {
    const user = await createUser('test@example.com', 'hash');
    const folder = await createFolder('Original Name', user.id);

    const input: UpdateFolderInput = { id: folder.id, name: 'New Name' };
    const result = await updateFolder(input);

    expect(result.id).toBe(folder.id);
    expect(result.name).toBe('New Name');
    expect(result.user_id).toBe(user.id);
    // Verify persisted change
    const persisted = await db
      .select()
      .from(foldersTable)
      .where(eq(foldersTable.id, folder.id))
      .execute();
    expect(persisted[0].name).toBe('New Name');
  });

  it('keeps existing name when name omitted', async () => {
    const user = await createUser('test2@example.com', 'hash2');
    const folder = await createFolder('Stay Same', user.id);

    const input: UpdateFolderInput = { id: folder.id };
    const result = await updateFolder(input);

    expect(result.name).toBe('Stay Same');
    // Ensure DB still has original name
    const persisted = await db
      .select()
      .from(foldersTable)
      .where(eq(foldersTable.id, folder.id))
      .execute();
    expect(persisted[0].name).toBe('Stay Same');
  });

  it('throws error when folder does not exist', async () => {
    const input: UpdateFolderInput = { id: 9999, name: 'Anything' };
    await expect(updateFolder(input)).rejects.toThrow('Folder not found');
  });
});
