import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, notesTable } from '../db/schema';
import { deleteNote } from '../handlers/delete_note';
import { eq } from 'drizzle-orm';

// Test data setup
let testUserId1: number;
let testUserId2: number;
let testCategoryId: number;
let testNoteId1: number;
let testNoteId2: number;
let testNoteId3: number;

describe('deleteNote', () => {
  beforeEach(async () => {
    await createDB();

    // Create test users
    const users = await db.insert(usersTable)
      .values([
        { 
          email: 'user1@example.com', 
          password_hash: 'hashedpassword1' 
        },
        { 
          email: 'user2@example.com', 
          password_hash: 'hashedpassword2' 
        }
      ])
      .returning()
      .execute();

    testUserId1 = users[0].id;
    testUserId2 = users[1].id;

    // Create test category for user1
    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF5733',
        user_id: testUserId1
      })
      .returning()
      .execute();

    testCategoryId = categories[0].id;

    // Create test notes
    const notes = await db.insert(notesTable)
      .values([
        {
          title: 'Note 1 for User 1',
          content: 'Content for note 1',
          category_id: testCategoryId,
          user_id: testUserId1
        },
        {
          title: 'Note 2 for User 1',
          content: 'Content for note 2',
          category_id: null, // Note without category
          user_id: testUserId1
        },
        {
          title: 'Note 1 for User 2',
          content: 'Content for user 2 note',
          category_id: null,
          user_id: testUserId2
        }
      ])
      .returning()
      .execute();

    testNoteId1 = notes[0].id;
    testNoteId2 = notes[1].id;
    testNoteId3 = notes[2].id;
  });

  afterEach(resetDB);

  it('should delete a note that belongs to the user', async () => {
    // Verify note exists before deletion
    const noteBefore = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, testNoteId1))
      .execute();

    expect(noteBefore).toHaveLength(1);
    expect(noteBefore[0].title).toEqual('Note 1 for User 1');

    // Delete the note
    await deleteNote(testNoteId1, testUserId1);

    // Verify note is deleted
    const noteAfter = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, testNoteId1))
      .execute();

    expect(noteAfter).toHaveLength(0);
  });

  it('should delete a note without category', async () => {
    // Verify note exists before deletion
    const noteBefore = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, testNoteId2))
      .execute();

    expect(noteBefore).toHaveLength(1);
    expect(noteBefore[0].category_id).toBeNull();

    // Delete the note
    await deleteNote(testNoteId2, testUserId1);

    // Verify note is deleted
    const noteAfter = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, testNoteId2))
      .execute();

    expect(noteAfter).toHaveLength(0);
  });

  it('should throw error when trying to delete another users note', async () => {
    // Try to delete user2's note with user1's id
    await expect(deleteNote(testNoteId3, testUserId1))
      .rejects.toThrow(/note not found or access denied/i);

    // Verify note still exists
    const note = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, testNoteId3))
      .execute();

    expect(note).toHaveLength(1);
    expect(note[0].user_id).toEqual(testUserId2);
  });

  it('should throw error when trying to delete non-existent note', async () => {
    const nonExistentNoteId = 99999;

    await expect(deleteNote(nonExistentNoteId, testUserId1))
      .rejects.toThrow(/note not found or access denied/i);
  });

  it('should not affect other notes when deleting one note', async () => {
    // Get initial count of notes
    const notesBefore = await db.select()
      .from(notesTable)
      .execute();

    expect(notesBefore).toHaveLength(3);

    // Delete one note
    await deleteNote(testNoteId1, testUserId1);

    // Verify other notes remain
    const notesAfter = await db.select()
      .from(notesTable)
      .execute();

    expect(notesAfter).toHaveLength(2);

    // Verify the remaining notes are the correct ones
    const remainingNoteIds = notesAfter.map(note => note.id).sort();
    expect(remainingNoteIds).toEqual([testNoteId2, testNoteId3].sort());
  });

  it('should handle deletion of note when user owns multiple notes', async () => {
    // Verify user1 has multiple notes
    const user1NotesBefore = await db.select()
      .from(notesTable)
      .where(eq(notesTable.user_id, testUserId1))
      .execute();

    expect(user1NotesBefore).toHaveLength(2);

    // Delete one of user1's notes
    await deleteNote(testNoteId1, testUserId1);

    // Verify user1 still has the other note
    const user1NotesAfter = await db.select()
      .from(notesTable)
      .where(eq(notesTable.user_id, testUserId1))
      .execute();

    expect(user1NotesAfter).toHaveLength(1);
    expect(user1NotesAfter[0].id).toEqual(testNoteId2);
    expect(user1NotesAfter[0].title).toEqual('Note 2 for User 1');
  });
});
