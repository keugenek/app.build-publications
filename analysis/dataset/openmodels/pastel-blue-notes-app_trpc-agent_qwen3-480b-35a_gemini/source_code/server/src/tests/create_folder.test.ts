import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foldersTable, usersTable } from '../db/schema';
import { type CreateFolderInput, type CreateUserInput } from '../schema';
import { createFolder } from '../handlers/create_folder';
import { eq } from 'drizzle-orm';

// Test user input
const testUserInput: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User'
};

// Test folder input
const testFolderInput: CreateFolderInput = {
  user_id: 0, // Will be set after user creation
  name: 'Test Folder',
  color: '#FF0000'
};

describe('createFolder', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a user first since folder requires a valid user_id
    const users = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    
    // Set the user_id for folder creation
    testFolderInput.user_id = users[0].id;
  });
  
  afterEach(resetDB);

  it('should create a folder', async () => {
    const result = await createFolder(testFolderInput);

    // Basic field validation
    expect(result.user_id).toEqual(testFolderInput.user_id);
    expect(result.name).toEqual(testFolderInput.name);
    expect(result.color).toEqual(testFolderInput.color);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save folder to database', async () => {
    const result = await createFolder(testFolderInput);

    // Query using proper drizzle syntax
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, result.id))
      .execute();

    expect(folders).toHaveLength(1);
    expect(folders[0].user_id).toEqual(testFolderInput.user_id);
    expect(folders[0].name).toEqual(testFolderInput.name);
    expect(folders[0].color).toEqual(testFolderInput.color);
    expect(folders[0].created_at).toBeInstanceOf(Date);
    expect(folders[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create a folder with null color', async () => {
    const input: CreateFolderInput = {
      user_id: testFolderInput.user_id,
      name: 'No Color Folder',
      color: null
    };

    const result = await createFolder(input);

    expect(result.name).toEqual('No Color Folder');
    expect(result.color).toBeNull();
    
    // Verify in database
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, result.id))
      .execute();

    expect(folders).toHaveLength(1);
    expect(folders[0].color).toBeNull();
  });
});
