import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable } from '../db/schema';
import { type CreateUserInput, type CreateFolderInput, type UpdateFolderInput } from '../schema';
import { updateFolder } from '../handlers/update_folder';
import { eq } from 'drizzle-orm';

// Helper function to create a user
const createUser = async (input: CreateUserInput) => {
  const result = await db.insert(usersTable)
    .values({
      email: input.email,
      name: input.name
    })
    .returning()
    .execute();
  return result[0];
};

// Helper function to create a folder
const createFolder = async (input: CreateFolderInput) => {
  const result = await db.insert(foldersTable)
    .values({
      name: input.name,
      user_id: input.user_id,
      parent_id: input.parent_id
    })
    .returning()
    .execute();
  return result[0];
};

// Test data
const testUserInput: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User'
};

const testFolderInput: CreateFolderInput = {
  name: 'Test Folder',
  user_id: 0 // Will be set in beforeEach
};

const updateFolderInput: UpdateFolderInput = {
  id: 0, // Will be set in test
  name: 'Updated Folder Name'
};

describe('updateFolder', () => {
  beforeEach(async () => {
    await createDB();
    const user = await createUser(testUserInput);
    testFolderInput.user_id = user.id;
  });
  
  afterEach(resetDB);

  it('should update a folder name', async () => {
    // Create a folder first
    const folder = await createFolder(testFolderInput);
    
    // Update the folder
    const input: UpdateFolderInput = {
      id: folder.id,
      name: 'Updated Folder Name'
    };
    
    const result = await updateFolder(input);

    // Validate the result
    expect(result.id).toEqual(folder.id);
    expect(result.name).toEqual('Updated Folder Name');
    expect(result.user_id).toEqual(testFolderInput.user_id);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(folder.updated_at.getTime());
  });

  it('should update a folder parent_id', async () => {
    // Create a parent folder first
    const parentFolderInput: CreateFolderInput = {
      name: 'Parent Folder',
      user_id: testFolderInput.user_id
    };
    const parentFolder = await createFolder(parentFolderInput);
    
    // Create a child folder
    const childFolder = await createFolder(testFolderInput);
    
    // Update the child folder's parent_id
    const input: UpdateFolderInput = {
      id: childFolder.id,
      parent_id: parentFolder.id
    };
    
    const result = await updateFolder(input);

    // Validate the result
    expect(result.id).toEqual(childFolder.id);
    expect(result.parent_id).toEqual(parentFolder.id);
    expect(result.name).toEqual(childFolder.name); // Should remain unchanged
  });

  it('should update both name and parent_id', async () => {
    // Create a parent folder first
    const parentFolderInput: CreateFolderInput = {
      name: 'Parent Folder',
      user_id: testFolderInput.user_id
    };
    const parentFolder = await createFolder(parentFolderInput);
    
    // Create a folder
    const folder = await createFolder(testFolderInput);
    
    // Update both name and parent_id
    const input: UpdateFolderInput = {
      id: folder.id,
      name: 'Updated Folder with Parent',
      parent_id: parentFolder.id
    };
    
    const result = await updateFolder(input);

    // Validate the result
    expect(result.id).toEqual(folder.id);
    expect(result.name).toEqual('Updated Folder with Parent');
    expect(result.parent_id).toEqual(parentFolder.id);
  });

  it('should save updated folder to database', async () => {
    // Create a folder first
    const folder = await createFolder(testFolderInput);
    
    // Update the folder
    const input: UpdateFolderInput = {
      id: folder.id,
      name: 'Database Updated Folder'
    };
    
    const result = await updateFolder(input);

    // Query the database to verify update
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, folder.id))
      .execute();

    expect(folders).toHaveLength(1);
    expect(folders[0].id).toEqual(folder.id);
    expect(folders[0].name).toEqual('Database Updated Folder');
    expect(folders[0].updated_at.getTime()).toBeGreaterThan(folder.updated_at.getTime());
  });

  it('should throw an error when trying to update a non-existent folder', async () => {
    const input: UpdateFolderInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Folder'
    };

    await expect(updateFolder(input)).rejects.toThrow(/Folder with id 99999 not found/);
  });
});
