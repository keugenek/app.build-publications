import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, notesTable, foldersTable } from '../db/schema';
import { type DeleteNoteInput } from '../schema';
import { deleteNote } from '../handlers/delete_note';
import { eq, and } from 'drizzle-orm';

describe('deleteNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let otherUserId: number;
  let testFolderId: number;
  let testNoteId: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'test@example.com',
          password_hash: 'hashed_password'
        },
        {
          email: 'other@example.com',
          password_hash: 'hashed_password'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create test folder
    const folders = await db.insert(foldersTable)
      .values({
        user_id: testUserId,
        name: 'Test Folder'
      })
      .returning()
      .execute();

    testFolderId = folders[0].id;

    // Create test note
    const notes = await db.insert(notesTable)
      .values({
        user_id: testUserId,
        folder_id: testFolderId,
        title: 'Test Note',
        content: 'This is a test note content'
      })
      .returning()
      .execute();

    testNoteId = notes[0].id;
  });

  it('should delete a note successfully', async () => {
    const input: DeleteNoteInput = {
      id: testNoteId,
      user_id: testUserId
    };

    const result = await deleteNote(input);

    // Check result
    expect(result.success).toBe(true);

    // Verify note was deleted from database
    const deletedNote = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, testNoteId))
      .execute();

    expect(deletedNote).toHaveLength(0);
  });

  it('should delete a note without folder', async () => {
    // Create note without folder
    const noteWithoutFolder = await db.insert(notesTable)
      .values({
        user_id: testUserId,
        folder_id: null,
        title: 'Unfiled Note',
        content: 'This note has no folder'
      })
      .returning()
      .execute();

    const input: DeleteNoteInput = {
      id: noteWithoutFolder[0].id,
      user_id: testUserId
    };

    const result = await deleteNote(input);

    expect(result.success).toBe(true);

    // Verify note was deleted
    const deletedNote = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, noteWithoutFolder[0].id))
      .execute();

    expect(deletedNote).toHaveLength(0);
  });

  it('should throw error when note does not exist', async () => {
    const input: DeleteNoteInput = {
      id: 99999, // Non-existent note ID
      user_id: testUserId
    };

    expect(deleteNote(input)).rejects.toThrow(/note not found/i);
  });

  it('should throw error when user does not own the note', async () => {
    const input: DeleteNoteInput = {
      id: testNoteId,
      user_id: otherUserId // Different user trying to delete
    };

    expect(deleteNote(input)).rejects.toThrow(/not found or you do not have permission/i);

    // Verify note still exists in database
    const existingNote = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, testNoteId))
      .execute();

    expect(existingNote).toHaveLength(1);
    expect(existingNote[0].user_id).toEqual(testUserId);
  });

  it('should not delete notes of other users', async () => {
    // Create note for other user
    const otherUserNote = await db.insert(notesTable)
      .values({
        user_id: otherUserId,
        folder_id: null,
        title: 'Other User Note',
        content: 'This belongs to another user'
      })
      .returning()
      .execute();

    const input: DeleteNoteInput = {
      id: otherUserNote[0].id,
      user_id: testUserId // Wrong user trying to delete
    };

    expect(deleteNote(input)).rejects.toThrow(/not found or you do not have permission/i);

    // Verify other user's note still exists
    const stillExists = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, otherUserNote[0].id))
      .execute();

    expect(stillExists).toHaveLength(1);
    expect(stillExists[0].user_id).toEqual(otherUserId);
  });

  it('should verify database constraints work correctly', async () => {
    // Create multiple notes for the same user
    const additionalNotes = await db.insert(notesTable)
      .values([
        {
          user_id: testUserId,
          folder_id: testFolderId,
          title: 'Note 2',
          content: 'Second note'
        },
        {
          user_id: testUserId,
          folder_id: null,
          title: 'Note 3',
          content: 'Third note'
        }
      ])
      .returning()
      .execute();

    // Delete one note
    const input: DeleteNoteInput = {
      id: additionalNotes[0].id,
      user_id: testUserId
    };

    const result = await deleteNote(input);
    expect(result.success).toBe(true);

    // Verify only the targeted note was deleted
    const remainingNotes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.user_id, testUserId))
      .execute();

    // Should have 2 remaining notes (original testNote + third note)
    expect(remainingNotes).toHaveLength(2);
    
    const noteIds = remainingNotes.map(note => note.id);
    expect(noteIds).toContain(testNoteId);
    expect(noteIds).toContain(additionalNotes[1].id);
    expect(noteIds).not.toContain(additionalNotes[0].id);
  });
});
