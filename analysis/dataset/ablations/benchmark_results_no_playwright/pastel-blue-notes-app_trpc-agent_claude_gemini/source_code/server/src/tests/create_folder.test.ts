import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foldersTable, usersTable } from '../db/schema';
import { type CreateFolderInput } from '../schema';
import { createFolder } from '../handlers/create_folder';
import { eq } from 'drizzle-orm';

describe('createFolder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user for folder creation
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    testUserId = userResult[0].id;
  });

  const testInput: CreateFolderInput = {
    user_id: 0, // Will be set in each test
    name: 'Test Folder'
  };

  it('should create a folder', async () => {
    const input = { ...testInput, user_id: testUserId };
    const result = await createFolder(input);

    // Basic field validation
    expect(result.name).toEqual('Test Folder');
    expect(result.user_id).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save folder to database', async () => {
    const input = { ...testInput, user_id: testUserId };
    const result = await createFolder(input);

    // Query database to verify folder was saved
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, result.id))
      .execute();

    expect(folders).toHaveLength(1);
    expect(folders[0].name).toEqual('Test Folder');
    expect(folders[0].user_id).toEqual(testUserId);
    expect(folders[0].created_at).toBeInstanceOf(Date);
    expect(folders[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create folder with different name', async () => {
    const input = { 
      user_id: testUserId,
      name: 'Work Projects'
    };
    const result = await createFolder(input);

    expect(result.name).toEqual('Work Projects');
    expect(result.user_id).toEqual(testUserId);
  });

  it('should throw error for non-existent user', async () => {
    const input = { 
      user_id: 99999, // Non-existent user ID
      name: 'Test Folder'
    };

    await expect(createFolder(input)).rejects.toThrow(/user not found/i);
  });

  it('should allow multiple folders for same user', async () => {
    const input1 = { user_id: testUserId, name: 'Folder 1' };
    const input2 = { user_id: testUserId, name: 'Folder 2' };

    const result1 = await createFolder(input1);
    const result2 = await createFolder(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Folder 1');
    expect(result2.name).toEqual('Folder 2');
    expect(result1.user_id).toEqual(testUserId);
    expect(result2.user_id).toEqual(testUserId);

    // Verify both folders exist in database
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.user_id, testUserId))
      .execute();

    expect(folders).toHaveLength(2);
  });
});
