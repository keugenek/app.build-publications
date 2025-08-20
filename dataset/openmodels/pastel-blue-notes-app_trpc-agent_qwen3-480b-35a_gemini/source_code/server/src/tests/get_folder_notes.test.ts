import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, notesTable } from '../db/schema';
import { getFolderNotes } from '../handlers/get_folder_notes';
import { eq } from 'drizzle-orm';

describe('getFolderNotes', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Create folders
    const folderResult = await db.insert(foldersTable)
      .values({
        user_id: userId,
        name: 'Test Folder'
      })
      .returning()
      .execute();
    
    const folderId = folderResult[0].id;
    
    // Create another folder for testing isolation
    const folderResult2 = await db.insert(foldersTable)
      .values({
        user_id: userId,
        name: 'Another Folder'
      })
      .returning()
      .execute();
    
    const anotherFolderId = folderResult2[0].id;
    
    // Create notes in the first folder
    await db.insert(notesTable)
      .values([
        {
          user_id: userId,
          folder_id: folderId,
          title: 'Note 1',
          content: 'Content of note 1',
          is_pinned: false
        },
        {
          user_id: userId,
          folder_id: folderId,
          title: 'Note 2',
          content: 'Content of note 2',
          is_pinned: true
        }
      ])
      .execute();
    
    // Create a note in another folder
    await db.insert(notesTable)
      .values({
        user_id: userId,
        folder_id: anotherFolderId,
        title: 'Note 3',
        content: 'Content of note 3',
        is_pinned: false
      })
      .execute();
    
    // Create a note with no folder
    await db.insert(notesTable)
      .values({
        user_id: userId,
        folder_id: null,
        title: 'Orphan Note',
        content: 'Content of orphan note',
        is_pinned: false
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch all notes for a specific folder', async () => {
    // Get the folder ID
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.name, 'Test Folder'))
      .execute();
    
    const folderId = folders[0].id;
    
    // Call the handler
    const result = await getFolderNotes(folderId);
    
    // Verify we got the correct notes
    expect(result).toHaveLength(2);
    
    // Check that all notes belong to the specified folder
    result.forEach(note => {
      expect(note.folder_id).toBe(folderId);
    });
    
    // Verify note details
    const noteTitles = result.map(note => note.title);
    expect(noteTitles).toContain('Note 1');
    expect(noteTitles).toContain('Note 2');
    
    // Verify note content
    const note1 = result.find(note => note.title === 'Note 1');
    const note2 = result.find(note => note.title === 'Note 2');
    
    expect(note1).toBeDefined();
    expect(note1?.content).toBe('Content of note 1');
    expect(note1?.is_pinned).toBe(false);
    
    expect(note2).toBeDefined();
    expect(note2?.content).toBe('Content of note 2');
    expect(note2?.is_pinned).toBe(true);
  });

  it('should return an empty array when folder has no notes', async () => {
    // Get the folder ID for the empty folder
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.name, 'Another Folder'))
      .execute();
    
    // Remove the note from this folder to make it empty
    const folderId = folders[0].id;
    await db.delete(notesTable)
      .where(eq(notesTable.folder_id, folderId))
      .execute();
    
    // Call the handler
    const result = await getFolderNotes(folderId);
    
    // Verify we got an empty array
    expect(result).toHaveLength(0);
  });

  it('should return an empty array for non-existent folder ID', async () => {
    // Call the handler with a non-existent folder ID
    const result = await getFolderNotes(99999);
    
    // Verify we got an empty array
    expect(result).toHaveLength(0);
  });
});
