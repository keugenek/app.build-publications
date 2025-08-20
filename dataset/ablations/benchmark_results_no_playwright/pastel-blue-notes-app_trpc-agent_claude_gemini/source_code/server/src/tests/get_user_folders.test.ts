import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable } from '../db/schema';
import { type GetUserFoldersInput } from '../schema';
import { getUserFolders } from '../handlers/get_user_folders';

describe('getUserFolders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no folders', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const user = userResult[0];
    
    const input: GetUserFoldersInput = {
      user_id: user.id
    };

    const result = await getUserFolders(input);

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return folders for a user ordered by creation date', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create multiple folders with slight delay to ensure different timestamps
    const folder1 = await db.insert(foldersTable)
      .values({
        user_id: user.id,
        name: 'First Folder'
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const folder2 = await db.insert(foldersTable)
      .values({
        user_id: user.id,
        name: 'Second Folder'
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const folder3 = await db.insert(foldersTable)
      .values({
        user_id: user.id,
        name: 'Third Folder'
      })
      .returning()
      .execute();

    const input: GetUserFoldersInput = {
      user_id: user.id
    };

    const result = await getUserFolders(input);

    // Should return all 3 folders
    expect(result).toHaveLength(3);

    // Should be ordered by creation date (newest first)
    expect(result[0].name).toEqual('Third Folder');
    expect(result[1].name).toEqual('Second Folder');
    expect(result[2].name).toEqual('First Folder');

    // Verify all expected fields are present
    result.forEach(folder => {
      expect(folder.id).toBeDefined();
      expect(folder.user_id).toEqual(user.id);
      expect(folder.name).toBeDefined();
      expect(folder.created_at).toBeInstanceOf(Date);
      expect(folder.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should only return folders belonging to the specified user', async () => {
    // Create two different users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword1'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword2'
      })
      .returning()
      .execute();

    const user1 = user1Result[0];
    const user2 = user2Result[0];

    // Create folders for both users
    await db.insert(foldersTable)
      .values({
        user_id: user1.id,
        name: 'User 1 Folder 1'
      })
      .execute();

    await db.insert(foldersTable)
      .values({
        user_id: user1.id,
        name: 'User 1 Folder 2'
      })
      .execute();

    await db.insert(foldersTable)
      .values({
        user_id: user2.id,
        name: 'User 2 Folder 1'
      })
      .execute();

    // Get folders for user 1
    const input: GetUserFoldersInput = {
      user_id: user1.id
    };

    const result = await getUserFolders(input);

    // Should only return user 1's folders
    expect(result).toHaveLength(2);
    result.forEach(folder => {
      expect(folder.user_id).toEqual(user1.id);
      expect(folder.name).toMatch(/User 1/);
    });
  });

  it('should handle non-existent user gracefully', async () => {
    const input: GetUserFoldersInput = {
      user_id: 999999 // Non-existent user ID
    };

    const result = await getUserFolders(input);

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
});
