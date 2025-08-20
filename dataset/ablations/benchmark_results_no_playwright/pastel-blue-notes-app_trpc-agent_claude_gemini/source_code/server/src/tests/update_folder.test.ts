import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable } from '../db/schema';
import { type UpdateFolderInput } from '../schema';
import { updateFolder } from '../handlers/update_folder';
import { eq } from 'drizzle-orm';

describe('updateFolder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a folder name', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create a folder
    const folderResult = await db.insert(foldersTable)
      .values({
        user_id: user.id,
        name: 'Original Folder'
      })
      .returning()
      .execute();

    const folder = folderResult[0];

    // Update the folder
    const updateInput: UpdateFolderInput = {
      id: folder.id,
      name: 'Updated Folder Name'
    };

    const result = await updateFolder(updateInput);

    // Verify the response
    expect(result.id).toEqual(folder.id);
    expect(result.user_id).toEqual(user.id);
    expect(result.name).toEqual('Updated Folder Name');
    expect(result.created_at).toEqual(folder.created_at);
    expect(result.updated_at).not.toEqual(folder.updated_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated folder to database', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create a folder
    const folderResult = await db.insert(foldersTable)
      .values({
        user_id: user.id,
        name: 'Test Folder'
      })
      .returning()
      .execute();

    const folder = folderResult[0];

    // Update the folder
    const updateInput: UpdateFolderInput = {
      id: folder.id,
      name: 'Database Updated Folder'
    };

    await updateFolder(updateInput);

    // Query database to verify the update
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, folder.id))
      .execute();

    expect(folders).toHaveLength(1);
    expect(folders[0].name).toEqual('Database Updated Folder');
    expect(folders[0].user_id).toEqual(user.id);
    expect(folders[0].updated_at).not.toEqual(folder.updated_at);
  });

  it('should handle partial updates correctly', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create a folder
    const folderResult = await db.insert(foldersTable)
      .values({
        user_id: user.id,
        name: 'Original Name'
      })
      .returning()
      .execute();

    const folder = folderResult[0];

    // Update with only ID (no name change)
    const updateInput: UpdateFolderInput = {
      id: folder.id
      // name is optional and not provided
    };

    const result = await updateFolder(updateInput);

    // Verify that name remains unchanged but updated_at is updated
    expect(result.name).toEqual('Original Name');
    expect(result.updated_at).not.toEqual(folder.updated_at);
  });

  it('should throw error when folder does not exist', async () => {
    const updateInput: UpdateFolderInput = {
      id: 999999, // Non-existent folder ID
      name: 'Updated Name'
    };

    expect(updateFolder(updateInput)).rejects.toThrow(/folder with id 999999 not found/i);
  });

  it('should preserve all other folder properties', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'preserve@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create a folder
    const folderResult = await db.insert(foldersTable)
      .values({
        user_id: user.id,
        name: 'Preserve Test'
      })
      .returning()
      .execute();

    const originalFolder = folderResult[0];

    // Update only the name
    const updateInput: UpdateFolderInput = {
      id: originalFolder.id,
      name: 'New Name Only'
    };

    const result = await updateFolder(updateInput);

    // Verify all properties are preserved except name and updated_at
    expect(result.id).toEqual(originalFolder.id);
    expect(result.user_id).toEqual(originalFolder.user_id);
    expect(result.created_at).toEqual(originalFolder.created_at);
    expect(result.name).toEqual('New Name Only');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalFolder.updated_at).toBe(true);
  });
});
