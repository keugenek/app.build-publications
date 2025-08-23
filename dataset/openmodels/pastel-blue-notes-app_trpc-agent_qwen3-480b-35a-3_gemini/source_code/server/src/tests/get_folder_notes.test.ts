import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, notesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getFolderNotes } from '../handlers/get_folder_notes';

describe('getFolderNotes', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Create a test folder
    const folderResult = await db.insert(foldersTable)
      .values({
        name: 'Test Folder',
        user_id: userId
      })
      .returning()
      .execute();
    
    const folderId = folderResult[0].id;
    
    // Create test notes in the folder
    await db.insert(notesTable)
      .values([
        {
          title: 'Note 1',
          content: 'Content of note 1',
          user_id: userId,
          folder_id: folderId
        },
        {
          title: 'Note 2',
          content: 'Content of note 2',
          user_id: userId,
          folder_id: folderId
        }
      ])
      .execute();
      
    // Create a note not in any folder (should not be returned)
    await db.insert(notesTable)
      .values({
        title: 'Note 3',
        content: 'Content of note 3',
        user_id: userId,
        folder_id: null
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch all notes within a specific folder', async () => {
    // Get the folder ID from the database
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.name, 'Test Folder'))
      .execute();
    
    const folderId = folders[0].id;
    
    // Call the handler
    const result = await getFolderNotes(folderId);
    
    // Validate the results
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Note 1');
    expect(result[0].content).toBe('Content of note 1');
    expect(result[0].folder_id).toBe(folderId);
    expect(result[1].title).toBe('Note 2');
    expect(result[1].content).toBe('Content of note 2');
    expect(result[1].folder_id).toBe(folderId);
    
    // Verify all returned notes have the correct folder_id
    result.forEach(note => {
      expect(note.folder_id).toBe(folderId);
      expect(note.created_at).toBeInstanceOf(Date);
      expect(note.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return an empty array when folder has no notes', async () => {
    // Create an empty folder
    const userResult = await db.select().from(usersTable).execute();
    const userId = userResult[0].id;
    
    const folderResult = await db.insert(foldersTable)
      .values({
        name: 'Empty Folder',
        user_id: userId
      })
      .returning()
      .execute();
    
    const emptyFolderId = folderResult[0].id;
    
    // Call the handler
    const result = await getFolderNotes(emptyFolderId);
    
    // Should return an empty array
    expect(result).toHaveLength(0);
  });

  it('should return an empty array for non-existent folder ID', async () => {
    // Call the handler with a non-existent folder ID
    const result = await getFolderNotes(99999);
    
    // Should return an empty array
    expect(result).toHaveLength(0);
  });
});
