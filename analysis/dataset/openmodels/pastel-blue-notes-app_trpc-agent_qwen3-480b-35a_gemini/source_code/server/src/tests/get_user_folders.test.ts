import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable } from '../db/schema';
import { getUserFolders } from '../handlers/get_user_folders';
import { eq } from 'drizzle-orm';

describe('getUserFolders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all folders for a user', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({ email: 'test@example.com', name: 'Test User' })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test folders
    const folders = [
      { user_id: userId, name: 'Folder 1', color: '#FF0000' },
      { user_id: userId, name: 'Folder 2', color: '#00FF00' },
      { user_id: userId, name: 'Folder 3', color: '#0000FF' }
    ];

    await db.insert(foldersTable)
      .values(folders)
      .execute();

    // Fetch folders for the user
    const result = await getUserFolders(userId);

    // Verify we get all folders back
    expect(result).toHaveLength(3);
    expect(result[0].user_id).toBe(userId);
    expect(result[1].user_id).toBe(userId);
    expect(result[2].user_id).toBe(userId);

    // Verify folder details
    const folderNames = result.map(f => f.name);
    expect(folderNames).toContain('Folder 1');
    expect(folderNames).toContain('Folder 2');
    expect(folderNames).toContain('Folder 3');

    // Verify color values
    const folderColors = result.map(f => f.color);
    expect(folderColors).toContain('#FF0000');
    expect(folderColors).toContain('#00FF00');
    expect(folderColors).toContain('#0000FF');

    // Verify dates are properly set
    result.forEach(folder => {
      expect(folder.created_at).toBeInstanceOf(Date);
      expect(folder.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for user with no folders', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({ email: 'test2@example.com', name: 'Test User 2' })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Fetch folders for the user (should be empty)
    const result = await getUserFolders(userId);

    expect(result).toHaveLength(0);
  });

  it('should only return folders belonging to the specified user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({ email: 'user1@example.com', name: 'User 1' })
      .returning()
      .execute();
    
    const user2Result = await db.insert(usersTable)
      .values({ email: 'user2@example.com', name: 'User 2' })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create folders for both users
    await db.insert(foldersTable)
      .values([
        { user_id: user1Id, name: 'User 1 Folder' },
        { user_id: user2Id, name: 'User 2 Folder' }
      ])
      .execute();

    // Fetch folders for user 1
    const user1Folders = await getUserFolders(user1Id);
    
    // Should only get user 1's folders
    expect(user1Folders).toHaveLength(1);
    expect(user1Folders[0].name).toBe('User 1 Folder');
    expect(user1Folders[0].user_id).toBe(user1Id);
  });
});
