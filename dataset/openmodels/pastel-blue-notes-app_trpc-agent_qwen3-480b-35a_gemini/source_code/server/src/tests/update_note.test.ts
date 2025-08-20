import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, notesTable } from '../db/schema';
import { type UpdateNoteInput } from '../schema';
import { updateNote } from '../handlers/update_note';
import { eq } from 'drizzle-orm';

describe('updateNote', () => {
  beforeEach(async () => {
    await createDB();
  });
  
  afterEach(resetDB);

  it('should update a note title', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Create a note
    const noteResult = await db.insert(notesTable)
      .values({
        user_id: userId,
        title: 'Test Note',
        content: 'This is a test note',
        is_pinned: false
      })
      .returning()
      .execute();
    
    const noteId = noteResult[0].id;
    
    // Update the note
    const updateInput: UpdateNoteInput = {
      id: noteId,
      title: 'Updated Note Title'
    };
    
    const updatedNote = await updateNote(updateInput);
    
    // Check the returned data
    expect(updatedNote.id).toBe(noteId);
    expect(updatedNote.title).toBe('Updated Note Title');
    expect(updatedNote.content).toBe('This is a test note');
    expect(updatedNote.is_pinned).toBe(false);
    expect(updatedNote.user_id).toBe(userId);
    expect(updatedNote.updated_at).toBeInstanceOf(Date);
    // Check that updated_at is a valid date and exists
    expect(updatedNote.updated_at).toBeInstanceOf(Date);
    
    // Verify in database
    const dbNotes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, noteId))
      .execute();
    
    expect(dbNotes).toHaveLength(1);
    expect(dbNotes[0].title).toBe('Updated Note Title');
    expect(dbNotes[0].content).toBe('This is a test note');
    expect(dbNotes[0].is_pinned).toBe(false);
  });

  it('should update a note content', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Create a note
    const noteResult = await db.insert(notesTable)
      .values({
        user_id: userId,
        title: 'Test Note',
        content: 'This is a test note',
        is_pinned: false
      })
      .returning()
      .execute();
    
    const noteId = noteResult[0].id;
    
    // Update the note
    const updateInput: UpdateNoteInput = {
      id: noteId,
      content: 'This is updated content'
    };
    
    const updatedNote = await updateNote(updateInput);
    
    // Check the returned data
    expect(updatedNote.id).toBe(noteId);
    expect(updatedNote.title).toBe('Test Note');
    expect(updatedNote.content).toBe('This is updated content');
    expect(updatedNote.is_pinned).toBe(false);
    
    // Verify in database
    const dbNotes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, noteId))
      .execute();
    
    expect(dbNotes).toHaveLength(1);
    expect(dbNotes[0].title).toBe('Test Note');
    expect(dbNotes[0].content).toBe('This is updated content');
  });

  it('should update note pinned status', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Create a note
    const noteResult = await db.insert(notesTable)
      .values({
        user_id: userId,
        title: 'Test Note',
        content: 'This is a test note',
        is_pinned: false
      })
      .returning()
      .execute();
    
    const noteId = noteResult[0].id;
    
    // Update the note
    const updateInput: UpdateNoteInput = {
      id: noteId,
      is_pinned: true
    };
    
    const updatedNote = await updateNote(updateInput);
    
    // Check the returned data
    expect(updatedNote.id).toBe(noteId);
    expect(updatedNote.is_pinned).toBe(true);
    
    // Verify in database
    const dbNotes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, noteId))
      .execute();
    
    expect(dbNotes).toHaveLength(1);
    expect(dbNotes[0].is_pinned).toBe(true);
  });

  it('should update folder_id', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Create a folder
    const folderResult = await db.insert(foldersTable)
      .values({
        user_id: userId,
        name: 'Test Folder'
      })
      .returning()
      .execute();
    
    const folderId = folderResult[0].id;
    
    // Create a note
    const noteResult = await db.insert(notesTable)
      .values({
        user_id: userId,
        title: 'Test Note',
        content: 'This is a test note',
        is_pinned: false
      })
      .returning()
      .execute();
    
    const noteId = noteResult[0].id;
    
    // Update the note
    const updateInput: UpdateNoteInput = {
      id: noteId,
      folder_id: folderId
    };
    
    const updatedNote = await updateNote(updateInput);
    
    // Check the returned data
    expect(updatedNote.id).toBe(noteId);
    expect(updatedNote.folder_id).toBe(folderId);
    
    // Verify in database
    const dbNotes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, noteId))
      .execute();
    
    expect(dbNotes).toHaveLength(1);
    expect(dbNotes[0].folder_id).toBe(folderId);
  });

  it('should update multiple fields at once', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Create a note
    const noteResult = await db.insert(notesTable)
      .values({
        user_id: userId,
        title: 'Test Note',
        content: 'This is a test note',
        is_pinned: false
      })
      .returning()
      .execute();
    
    const noteId = noteResult[0].id;
    
    // Update the note
    const updateInput: UpdateNoteInput = {
      id: noteId,
      title: 'Completely Updated Note',
      content: 'This note has been completely updated',
      is_pinned: true
    };
    
    const updatedNote = await updateNote(updateInput);
    
    // Check the returned data
    expect(updatedNote.id).toBe(noteId);
    expect(updatedNote.title).toBe('Completely Updated Note');
    expect(updatedNote.content).toBe('This note has been completely updated');
    expect(updatedNote.is_pinned).toBe(true);
    
    // Verify in database
    const dbNotes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, noteId))
      .execute();
    
    expect(dbNotes).toHaveLength(1);
    expect(dbNotes[0].title).toBe('Completely Updated Note');
    expect(dbNotes[0].content).toBe('This note has been completely updated');
    expect(dbNotes[0].is_pinned).toBe(true);
  });

  it('should throw an error when trying to update a non-existent note', async () => {
    const updateInput: UpdateNoteInput = {
      id: 99999, // Non-existent ID
      title: 'This should fail'
    };
    
    await expect(updateNote(updateInput)).rejects.toThrow(/Note with id 99999 not found/);
  });
});
