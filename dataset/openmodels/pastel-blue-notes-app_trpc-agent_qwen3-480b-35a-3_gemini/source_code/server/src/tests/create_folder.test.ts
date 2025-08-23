import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foldersTable, usersTable } from '../db/schema';
import { type CreateFolderInput } from '../schema';
import { createFolder } from '../handlers/create_folder';
import { eq } from 'drizzle-orm';

// Test user for foreign key constraint
const testUser = {
  email: 'test@example.com',
  name: 'Test User'
};

// Test folder input
const testFolderInput: CreateFolderInput = {
  name: 'Test Folder',
  user_id: 0, // Will be set after creating user
  parent_id: null
};

describe('createFolder', () => {
  beforeEach(async () => {
    await createDB();
    // Create a user first for the foreign key constraint
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    testFolderInput.user_id = userResult[0].id;
  });
  
  afterEach(resetDB);

  it('should create a folder', async () => {
    const result = await createFolder(testFolderInput);

    // Basic field validation
    expect(result.name).toEqual('Test Folder');
    expect(result.user_id).toEqual(testFolderInput.user_id);
    expect(result.parent_id).toBeNull();
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
    expect(folders[0].name).toEqual('Test Folder');
    expect(folders[0].user_id).toEqual(testFolderInput.user_id);
    expect(folders[0].parent_id).toBeNull();
    expect(folders[0].created_at).toBeInstanceOf(Date);
    expect(folders[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create a folder with parent_id', async () => {
    // First create a parent folder
    const parentFolderResult = await createFolder(testFolderInput);
    
    // Create child folder with parent_id
    const childFolderInput: CreateFolderInput = {
      name: 'Child Folder',
      user_id: testFolderInput.user_id,
      parent_id: parentFolderResult.id
    };

    const result = await createFolder(childFolderInput);

    expect(result.name).toEqual('Child Folder');
    expect(result.user_id).toEqual(testFolderInput.user_id);
    expect(result.parent_id).toEqual(parentFolderResult.id);
    
    // Verify in database
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, result.id))
      .execute();

    expect(folders).toHaveLength(1);
    expect(folders[0].parent_id).toEqual(parentFolderResult.id);
  });
});
