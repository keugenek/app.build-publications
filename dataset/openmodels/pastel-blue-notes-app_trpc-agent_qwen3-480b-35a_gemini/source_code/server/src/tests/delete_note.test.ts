import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, notesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteNote } from '../handlers/delete_note';
import { type CreateUserInput, type CreateFolderInput, type CreateNoteInput } from '../schema';

// Test data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User'
};

const testFolder: CreateFolderInput = {
  user_id: 0, // Will be set after user creation
  name: 'Test Folder',
  color: '#FF0000'
};

const testNote: CreateNoteInput = {
  user_id: 0, // Will be set after user creation
  folder_id: null, // Will be set after folder creation
  title: 'Test Note',
  content: 'This is a test note',
  is_pinned: false
};

describe('deleteNote', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    testNote.user_id = userId;
    testFolder.user_id = userId;
    
    // Create a folder
    const folderResult = await db.insert(foldersTable)
      .values(testFolder)
      .returning()
      .execute();
    
    const folderId = folderResult[0].id;
    testNote.folder_id = folderId;
  });

  afterEach(resetDB);

  it('should delete a note by ID', async () => {
    // Create a note first
    const noteResult = await db.insert(notesTable)
      .values(testNote)
      .returning()
      .execute();
    
    const noteId = noteResult[0].id;
    
    // Verify note exists before deletion
    const notesBefore = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, noteId))
      .execute();
    
    expect(notesBefore).toHaveLength(1);
    expect(notesBefore[0].title).toEqual('Test Note');
    
    // Delete the note
    await deleteNote(noteId);
    
    // Verify note is deleted
    const notesAfter = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, noteId))
      .execute();
    
    expect(notesAfter).toHaveLength(0);
  });

  it('should not throw an error when trying to delete a non-existent note', async () => {
    // Try to delete a note that doesn't exist
    await expect(deleteNote(99999)).resolves.toBeUndefined();
  });

  it('should only delete the specified note and not affect other notes', async () => {
    // Create two notes
    const note1Result = await db.insert(notesTable)
      .values({ ...testNote, title: 'Note 1' })
      .returning()
      .execute();
    
    const note2Result = await db.insert(notesTable)
      .values({ ...testNote, title: 'Note 2' })
      .returning()
      .execute();
    
    const note1Id = note1Result[0].id;
    const note2Id = note2Result[0].id;
    
    // Delete only the first note
    await deleteNote(note1Id);
    
    // Verify first note is deleted
    const note1Check = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, note1Id))
      .execute();
    
    expect(note1Check).toHaveLength(0);
    
    // Verify second note still exists
    const note2Check = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, note2Id))
      .execute();
    
    expect(note2Check).toHaveLength(1);
    expect(note2Check[0].title).toEqual('Note 2');
  });
});
