import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foldersTable, usersTable } from '../db/schema';
import { type UpdateFolderInput, type CreateFolderInput, type CreateUserInput } from '../schema';
import { updateFolder } from '../handlers/update_folder';
import { eq } from 'drizzle-orm';

// Test user data
const testUserInput: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User'
};

// Test folder data
const testFolderInput: CreateFolderInput = {
  user_id: 0, // Will be set after user creation
  name: 'Test Folder',
  color: '#FF0000'
};

describe('updateFolder', () => {
  let userId: number;
  let folderId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    userId = userResult[0].id;
    
    // Create a test folder
    const folderResult = await db.insert(foldersTable)
      .values({
        ...testFolderInput,
        user_id: userId
      })
      .returning()
      .execute();
    folderId = folderResult[0].id;
  });

  afterEach(resetDB);

  it('should update a folder name', async () => {
    const input: UpdateFolderInput = {
      id: folderId,
      name: 'Updated Folder Name'
    };

    const result = await updateFolder(input);

    // Basic field validation
    expect(result.id).toEqual(folderId);
    expect(result.name).toEqual('Updated Folder Name');
    expect(result.color).toEqual(testFolderInput.color);
    expect(result.user_id).toEqual(userId);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Updated at should be more recent than created at
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(result.created_at.getTime());
  });

  it('should update a folder color', async () => {
    const input: UpdateFolderInput = {
      id: folderId,
      color: '#00FF00'
    };

    const result = await updateFolder(input);

    // Basic field validation
    expect(result.id).toEqual(folderId);
    expect(result.name).toEqual(testFolderInput.name);
    expect(result.color).toEqual('#00FF00');
    expect(result.user_id).toEqual(userId);
  });

  it('should update both folder name and color', async () => {
    const input: UpdateFolderInput = {
      id: folderId,
      name: 'Completely Updated Folder',
      color: '#0000FF'
    };

    const result = await updateFolder(input);

    // Basic field validation
    expect(result.id).toEqual(folderId);
    expect(result.name).toEqual('Completely Updated Folder');
    expect(result.color).toEqual('#0000FF');
    expect(result.user_id).toEqual(userId);
  });

  it('should save updated folder to database', async () => {
    const input: UpdateFolderInput = {
      id: folderId,
      name: 'Database Updated Folder'
    };

    const result = await updateFolder(input);

    // Query using proper drizzle syntax
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, folderId))
      .execute();

    expect(folders).toHaveLength(1);
    expect(folders[0].name).toEqual('Database Updated Folder');
    expect(folders[0].color).toEqual(testFolderInput.color);
    expect(folders[0].user_id).toEqual(userId);
    expect(folders[0].updated_at.getTime()).toBeGreaterThanOrEqual(folders[0].created_at.getTime());
  });

  it('should throw an error when updating a non-existent folder', async () => {
    const input: UpdateFolderInput = {
      id: 99999, // Non-existent folder ID
      name: 'This should fail'
    };

    await expect(updateFolder(input)).rejects.toThrow(/Folder with id 99999 not found/);
  });
});
