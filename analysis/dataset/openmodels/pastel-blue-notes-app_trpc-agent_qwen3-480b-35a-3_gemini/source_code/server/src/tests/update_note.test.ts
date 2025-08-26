import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { notesTable, usersTable, foldersTable } from '../db/schema';
import { type UpdateNoteInput } from '../schema';
import { updateNote } from '../handlers/update_note';
import { eq } from 'drizzle-orm';

describe('updateNote', () => {
  beforeEach(createDB);
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
    
    const user = userResult[0];

    // Create a note
    const noteResult = await db.insert(notesTable)
      .values({
        title: 'Original Note Title',
        content: 'Original note content',
        user_id: user.id
      })
      .returning()
      .execute();
    
    const note = noteResult[0];

    const updateInput: UpdateNoteInput = {
      id: note.id,
      title: 'Updated Note Title'
    };

    const updatedNote = await updateNote(updateInput);

    expect(updatedNote.id).toEqual(note.id);
    expect(updatedNote.title).toEqual('Updated Note Title');
    expect(updatedNote.content).toEqual(note.content);
    expect(updatedNote.user_id).toEqual(note.user_id);
    expect(updatedNote.folder_id).toEqual(note.folder_id);
    expect(updatedNote.updated_at).toBeInstanceOf(Date);
  });

  it('should update note content', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test2@example.com',
        name: 'Test User 2'
      })
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create a note
    const noteResult = await db.insert(notesTable)
      .values({
        title: 'Test Note',
        content: 'Original content',
        user_id: user.id
      })
      .returning()
      .execute();
    
    const note = noteResult[0];

    const updateInput: UpdateNoteInput = {
      id: note.id,
      content: 'Updated content for the note'
    };

    const updatedNote = await updateNote(updateInput);

    expect(updatedNote.id).toEqual(note.id);
    expect(updatedNote.title).toEqual(note.title);
    expect(updatedNote.content).toEqual('Updated content for the note');
    expect(updatedNote.user_id).toEqual(note.user_id);
    expect(updatedNote.folder_id).toEqual(note.folder_id);
  });

  it('should update note folder assignment', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test3@example.com',
        name: 'Test User 3'
      })
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create a folder
    const folderResult = await db.insert(foldersTable)
      .values({
        name: 'Test Folder',
        user_id: user.id
      })
      .returning()
      .execute();
    
    const folder = folderResult[0];

    // Create a note
    const noteResult = await db.insert(notesTable)
      .values({
        title: 'Test Note',
        content: 'Test content',
        user_id: user.id
      })
      .returning()
      .execute();
    
    const note = noteResult[0];

    const updateInput: UpdateNoteInput = {
      id: note.id,
      folder_id: folder.id
    };

    const updatedNote = await updateNote(updateInput);

    expect(updatedNote.id).toEqual(note.id);
    expect(updatedNote.folder_id).toEqual(folder.id);
  });

  it('should remove note from folder when folder_id is null', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test4@example.com',
        name: 'Test User 4'
      })
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create a folder
    const folderResult = await db.insert(foldersTable)
      .values({
        name: 'Test Folder',
        user_id: user.id
      })
      .returning()
      .execute();
    
    const folder = folderResult[0];

    // Create a note in a folder
    const noteResult = await db.insert(notesTable)
      .values({
        title: 'Test Note',
        content: 'Test content',
        user_id: user.id,
        folder_id: folder.id
      })
      .returning()
      .execute();
    
    const note = noteResult[0];

    const updateInput: UpdateNoteInput = {
      id: note.id,
      folder_id: null
    };

    const updatedNote = await updateNote(updateInput);

    expect(updatedNote.id).toEqual(note.id);
    expect(updatedNote.folder_id).toBeNull();
  });

  it('should update multiple fields at once', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test5@example.com',
        name: 'Test User 5'
      })
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create a note
    const noteResult = await db.insert(notesTable)
      .values({
        title: 'Original Title',
        content: 'Original content',
        user_id: user.id
      })
      .returning()
      .execute();
    
    const note = noteResult[0];

    const updateInput: UpdateNoteInput = {
      id: note.id,
      title: 'Completely Updated Note',
      content: 'This note has been completely updated',
    };

    const updatedNote = await updateNote(updateInput);

    expect(updatedNote.id).toEqual(note.id);
    expect(updatedNote.title).toEqual('Completely Updated Note');
    expect(updatedNote.content).toEqual('This note has been completely updated');
    expect(updatedNote.user_id).toEqual(note.user_id);
    expect(updatedNote.folder_id).toEqual(note.folder_id);
  });

  it('should save updated note to database', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test6@example.com',
        name: 'Test User 6'
      })
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create a note
    const noteResult = await db.insert(notesTable)
      .values({
        title: 'Test Note',
        content: 'Test content',
        user_id: user.id
      })
      .returning()
      .execute();
    
    const note = noteResult[0];

    const updateInput: UpdateNoteInput = {
      id: note.id,
      title: 'Database Updated Note'
    };

    const updatedNote = await updateNote(updateInput);

    // Query the database to verify the update was saved
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, note.id))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].title).toEqual('Database Updated Note');
    expect(notes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw an error when trying to update a non-existent note', async () => {
    const updateInput: UpdateNoteInput = {
      id: 99999, // Non-existent ID
      title: 'This should fail'
    };

    await expect(updateNote(updateInput)).rejects.toThrow(/Note with id 99999 not found/);
  });
});
