import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { tables } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteByIdInput, type Folder } from '../schema';
import { deleteFolder } from '../handlers/delete_folder';

/** Helper to create a user and return its id */
const createTestUser = async () => {
  const result = await db
    .insert(tables.users)
    .values({
      email: 'test@example.com',
      password_hash: 'hashed',
    })
    .returning()
    .execute();
  return result[0].id;
};

/** Helper to create a folder for a given user */
const createTestFolder = async (userId: number) => {
  const result = await db
    .insert(tables.folders)
    .values({
      name: 'Test Folder',
      user_id: userId,
    })
    .returning()
    .execute();
  return result[0];
};

describe('deleteFolder handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing folder and return its data', async () => {
    const userId = await createTestUser();
    const folder = await createTestFolder(userId);

    const input: DeleteByIdInput = { id: folder.id };
    const deleted = await deleteFolder(input);

    // Verify returned data matches the original folder
    expect(deleted.id).toBe(folder.id);
    expect(deleted.name).toBe('Test Folder');
    expect(deleted.user_id).toBe(userId);
    expect(deleted.created_at).toBeInstanceOf(Date);

    // Ensure the folder is no longer present in the database
    const remaining = await db
      .select()
      .from(tables.folders)
      .where(eq(tables.folders.id, folder.id))
      .execute();
    expect(remaining).toHaveLength(0);
  });

  it('should throw an error when trying to delete a non‑existent folder', async () => {
    const input: DeleteByIdInput = { id: 9999 };
    await expect(deleteFolder(input)).rejects.toThrow(/Folder with id 9999 not found/);
  });
});
