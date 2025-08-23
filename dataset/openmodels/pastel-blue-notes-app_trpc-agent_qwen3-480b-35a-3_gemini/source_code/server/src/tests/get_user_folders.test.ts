import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foldersTable, usersTable } from '../db/schema';
import { getUserFolders } from '../handlers/get_user_folders';
import { eq } from 'drizzle-orm';

describe('getUserFolders', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test user
    await db.insert(usersTable)
      .values({
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      })
      .execute();
      
    // Create another test user
    await db.insert(usersTable)
      .values({
        id: 2,
        email: 'test2@example.com',
        name: 'Test User 2'
      })
      .execute();
      
    // Create test folders for user 1
    await db.insert(foldersTable)
      .values({
        name: 'Folder 1',
        user_id: 1,
        parent_id: null
      })
      .execute();
      
    await db.insert(foldersTable)
      .values({
        name: 'Folder 2',
        user_id: 1,
        parent_id: null
      })
      .execute();
      
    // Create a folder for user 2
    await db.insert(foldersTable)
      .values({
        name: 'Folder 3',
        user_id: 2,
        parent_id: null
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch all folders for a specific user', async () => {
    const folders = await getUserFolders(1);
    
    expect(folders).toHaveLength(2);
    expect(folders[0].user_id).toEqual(1);
    expect(folders[1].user_id).toEqual(1);
    
    // Check that we only get folders for user 1
    const folderNames = folders.map(folder => folder.name);
    expect(folderNames).toContain('Folder 1');
    expect(folderNames).toContain('Folder 2');
    expect(folderNames).not.toContain('Folder 3');
  });

  it('should return an empty array if user has no folders', async () => {
    // Create a user with no folders
    await db.insert(usersTable)
      .values({
        id: 3,
        email: 'test3@example.com',
        name: 'Test User 3'
      })
      .execute();
      
    const folders = await getUserFolders(3);
    expect(folders).toHaveLength(0);
  });

  it('should return folders with correct data structure', async () => {
    const folders = await getUserFolders(1);
    
    expect(folders).toHaveLength(2);
    
    folders.forEach(folder => {
      expect(folder).toHaveProperty('id');
      expect(folder).toHaveProperty('name');
      expect(folder).toHaveProperty('user_id');
      expect(folder).toHaveProperty('created_at');
      expect(folder).toHaveProperty('updated_at');
      
      expect(typeof folder.id).toBe('number');
      expect(typeof folder.name).toBe('string');
      expect(typeof folder.user_id).toBe('number');
      expect(folder.created_at).toBeInstanceOf(Date);
      expect(folder.updated_at).toBeInstanceOf(Date);
    });
  });
});
